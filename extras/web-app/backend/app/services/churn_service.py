from __future__ import annotations

import logging
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd
from scipy import sparse
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.services.database import DatasetRepository
from app.utils.constants import (
    BINARY_COLUMNS,
    CATEGORICAL_COLUMNS,
    CHARGE_RANGE_BINS,
    CHARGE_RANGE_LABELS,
    CONTRACT_ORDER,
    FEATURE_COLUMNS,
    HIGH_RISK_THRESHOLD,
    MEDIUM_RISK_THRESHOLD,
    INTERNET_SERVICE_ORDER,
    NORMALIZED_VALUE_MAPS,
    NUMERIC_COLUMNS,
    PAYMENT_METHOD_ORDER,
    REQUIRED_COLUMNS,
    TENURE_BINS,
    TENURE_LABELS,
)
from app.utils.exceptions import DatasetNotLoadedError, DatasetValidationError, ModelNotTrainedError
from app.utils.insight_engine import generate_insight_cards, generate_recommendations
from app.utils.reporting import build_export_dataframe, build_pdf_report

logger = logging.getLogger("customer_churn_intelligence")


class ChurnService:
    def __init__(self):
        project_root = Path(__file__).resolve().parents[3]
        database_path = project_root / "backend" / "app" / "customer_churn.db"
        self.sample_path = Path(__file__).resolve().parents[5] / "data" / "telco_customer_churn.csv"
        self.repository = DatasetRepository(database_path)
        self.repository.initialize()
        self.model_bundle: dict | None = None

    def bootstrap_sample_dataset(self):
        current = self.repository.load_dataset()
        metadata = self.repository.load_metadata()
        needs_refresh = (
            current.empty
            or metadata.get("source_name") != self.sample_path.name
            or int(float(metadata.get("cleaned_rows", 0) or 0)) < 1000
        )
        if not needs_refresh:
            return
        if not self.sample_path.exists():
            raise DatasetNotLoadedError("Full Telco sample dataset is missing from the data folder.")
        logger.info("Bootstrapping full Telco churn dataset from %s", self.sample_path.name)
        raw_df = pd.read_csv(self.sample_path)
        cleaned_df, metadata = self.clean_dataframe(raw_df, self.sample_path.name)
        self.repository.save_dataset(cleaned_df, metadata)

    @staticmethod
    def _safe_number(value: float | int | None, digits: int = 2) -> float:
        numeric_value = float(value) if value is not None else 0.0
        if not np.isfinite(numeric_value):
            numeric_value = 0.0
        return round(numeric_value, digits)

    @staticmethod
    def _display_name(feature_name: str) -> str:
        label = feature_name.replace("num__", "").replace("cat__", "")
        parts = label.split("_")
        if len(parts) > 1 and parts[0] in {"cat", "num"}:
            parts = parts[1:]
        return " ".join(parts).replace("SeniorCitizen", "Senior Citizen").title()

    def _normalize_categorical_value(self, column: str, value):
        if pd.isna(value):
            return np.nan
        cleaned = str(value).strip()
        if not cleaned:
            return np.nan
        lowered = cleaned.lower()

        if column in BINARY_COLUMNS:
            yes_no_map = {"yes": "Yes", "y": "Yes", "true": "Yes", "1": "Yes", "no": "No", "n": "No", "false": "No", "0": "No"}
            if lowered in yes_no_map:
                return yes_no_map[lowered]

        column_map = NORMALIZED_VALUE_MAPS.get(column, {})
        if lowered in column_map:
            return column_map[lowered]
        return cleaned

    def ingest_uploaded_file(self, filename: str, file_bytes: bytes) -> dict:
        if not filename.lower().endswith(".csv"):
            raise DatasetValidationError("Invalid CSV format. Please upload a valid Telco churn CSV.")

        try:
            dataframe = pd.read_csv(BytesIO(file_bytes))
        except Exception as exc:
            raise DatasetValidationError("Invalid CSV format. Please upload a valid Telco churn CSV.") from exc

        incoming_columns = {str(column).strip() for column in dataframe.columns}
        if incoming_columns.issubset({"section", "label", "value"}):
            raise DatasetValidationError("Invalid CSV format. This file looks like an exported report, not a churn dataset.")

        cleaned_df, metadata = self.clean_dataframe(dataframe, filename)
        self.repository.save_dataset(cleaned_df, metadata)
        self.model_bundle = None
        logger.info("Dataset uploaded successfully from %s with %s rows after cleaning", filename, len(cleaned_df))
        return {
            "message": "Dataset uploaded and cleaned successfully.",
            "metadata": metadata,
            "preview": cleaned_df.head(5).replace({np.nan: None}).to_dict(orient="records"),
        }

    def clean_dataframe(self, dataframe: pd.DataFrame, source_name: str) -> tuple[pd.DataFrame, dict]:
        if dataframe.empty:
            raise DatasetValidationError("Dataset not loaded. Please upload a churn CSV with customer records.")

        df = dataframe.copy()
        df.columns = [str(column).strip() for column in df.columns]

        missing_columns = [column for column in REQUIRED_COLUMNS if column not in df.columns]
        if missing_columns:
            missing_label = ", ".join(missing_columns)
            raise DatasetValidationError(f"Invalid CSV format. Required columns are missing: {missing_label}.")

        df = df[REQUIRED_COLUMNS].copy()
        df.replace(r"^\s*$", np.nan, regex=True, inplace=True)
        df["customerID"] = df["customerID"].astype(str).str.strip()

        original_rows = len(df)
        logger.info("Starting cleaning for %s with %s rows", source_name, original_rows)

        duplicate_count = int(df["customerID"].duplicated().sum())
        if duplicate_count:
            logger.info("Removing %s duplicate customer IDs", duplicate_count)
        df = df.drop_duplicates(subset=["customerID"], keep="first")
        df = df[df["customerID"].notna() & (df["customerID"] != "")]

        for column in NUMERIC_COLUMNS:
            df[column] = pd.to_numeric(df[column], errors="coerce")

        blank_total_charges = int(df["TotalCharges"].isna().sum())
        if blank_total_charges:
            logger.info("Fixing %s blank or invalid TotalCharges values", blank_total_charges)
        df["TotalCharges"] = df["TotalCharges"].fillna(df["MonthlyCharges"] * df["tenure"])

        numeric_missing_before = int(df[NUMERIC_COLUMNS].isna().sum().sum())
        df["MonthlyCharges"] = df["MonthlyCharges"].fillna(df["MonthlyCharges"].median())
        df["tenure"] = df["tenure"].fillna(df["tenure"].median())
        df["TotalCharges"] = df["TotalCharges"].fillna(df["TotalCharges"].median())
        df["SeniorCitizen"] = df["SeniorCitizen"].fillna(0)
        df["SeniorCitizen"] = df["SeniorCitizen"].astype(int)
        df["tenure"] = df["tenure"].round().clip(lower=0).astype(int)

        categorical_missing_before = 0
        for column in [column for column in REQUIRED_COLUMNS if column not in NUMERIC_COLUMNS and column != "customerID"]:
            df[column] = df[column].apply(lambda value, current_column=column: self._normalize_categorical_value(current_column, value))
            categorical_missing_before += int(df[column].isna().sum())
            mode_series = df[column].mode(dropna=True)
            fallback_value = mode_series.iloc[0] if not mode_series.empty else "Unknown"
            df[column] = df[column].fillna(fallback_value)

        if not df["Churn"].isin(["Yes", "No"]).all():
            logger.info("Normalizing non-standard churn labels into Yes/No")
            df["Churn"] = df["Churn"].apply(lambda value: self._normalize_categorical_value("Churn", value))
            df["Churn"] = df["Churn"].fillna("No")

        cleaned_rows = len(df)
        missing_values_filled = numeric_missing_before + categorical_missing_before
        logger.info(
            "Cleaning complete for %s: cleaned_rows=%s duplicate_ids_removed=%s missing_values_filled=%s",
            source_name,
            cleaned_rows,
            duplicate_count,
            missing_values_filled,
        )

        metadata = {
            "source_name": source_name,
            "loaded_at": datetime.now(timezone.utc).isoformat(),
            "original_rows": original_rows,
            "cleaned_rows": cleaned_rows,
            "duplicate_customer_ids_removed": duplicate_count,
            "blank_total_charges_fixed": blank_total_charges,
            "missing_values_filled": missing_values_filled,
        }
        return df, metadata

    def _load_dataframe(self) -> pd.DataFrame:
        dataframe = self.repository.load_dataset()
        if dataframe.empty:
            raise DatasetNotLoadedError("Dataset not loaded. Upload a Telco churn CSV to begin.")
        dataframe["SeniorCitizen"] = pd.to_numeric(dataframe["SeniorCitizen"], errors="coerce").fillna(0).astype(int)
        dataframe["tenure"] = pd.to_numeric(dataframe["tenure"], errors="coerce").fillna(0).astype(int)
        dataframe["MonthlyCharges"] = pd.to_numeric(dataframe["MonthlyCharges"], errors="coerce").fillna(0.0)
        dataframe["TotalCharges"] = pd.to_numeric(dataframe["TotalCharges"], errors="coerce").fillna(0.0)
        return dataframe

    def _apply_filters(self, dataframe: pd.DataFrame, filters: dict | None) -> pd.DataFrame:
        if not filters:
            return dataframe
        filtered_df = dataframe.copy()
        for column, value in filters.items():
            if value and value not in {"All", ""} and column in filtered_df.columns:
                filtered_df = filtered_df[filtered_df[column] == value]
        return filtered_df

    def _add_group_columns(self, dataframe: pd.DataFrame) -> pd.DataFrame:
        df = dataframe.copy()
        df["tenure_group"] = pd.cut(
            df["tenure"],
            bins=TENURE_BINS,
            labels=TENURE_LABELS,
            include_lowest=True,
            right=True,
        )
        df["monthly_charge_range"] = pd.cut(
            df["MonthlyCharges"],
            bins=CHARGE_RANGE_BINS,
            labels=CHARGE_RANGE_LABELS,
            include_lowest=True,
            right=True,
        )
        return df

    @staticmethod
    def _order_index(value: str, order: list[str]) -> int:
        try:
            return order.index(value)
        except ValueError:
            return len(order) + 1

    def _group_churn_metrics(self, dataframe: pd.DataFrame, dimension: str, order: list[str] | None = None) -> list[dict]:
        grouped = (
            dataframe.groupby(dimension, dropna=False, observed=True)
            .agg(
                customer_count=("customerID", "count"),
                churned_customers=("Churn", lambda series: int((series == "Yes").sum())),
                average_monthly_charge=("MonthlyCharges", "mean"),
            )
            .reset_index()
        )
        grouped["churn_rate"] = (
            grouped["churned_customers"] / grouped["customer_count"].replace({0: np.nan}) * 100
        ).replace([np.inf, -np.inf], np.nan).fillna(0)
        grouped = grouped[grouped["customer_count"] > 0]
        if order:
            grouped["sort_index"] = grouped[dimension].astype(str).apply(lambda value: self._order_index(value, order))
            grouped = grouped.sort_values(["sort_index", "customer_count"], ascending=[True, False])
            grouped = grouped.drop(columns=["sort_index"])
        else:
            grouped = grouped.sort_values(["churn_rate", "customer_count"], ascending=[False, False])

        return [
            {
                "segment": "Unknown" if pd.isna(row[dimension]) else str(row[dimension]),
                "customer_count": int(row["customer_count"]),
                "churned_customers": int(row["churned_customers"]),
                "average_monthly_charge": self._safe_number(row["average_monthly_charge"]),
                "churn_rate": self._safe_number(row["churn_rate"]),
            }
            for _, row in grouped.iterrows()
        ]

    def get_summary(self, filters: dict | None = None) -> dict:
        df = self._apply_filters(self._load_dataframe(), filters)
        if df.empty:
            raise DatasetValidationError("Dataset not loaded for the selected filters. Adjust filters or upload a valid churn CSV.")

        metadata = self.repository.load_metadata()
        churn_mask = df["Churn"] == "Yes"
        churn_rate = (churn_mask.mean() * 100) if len(df) else 0
        revenue_at_risk = df.loc[churn_mask, "MonthlyCharges"].sum()

        return {
            "kpis": {
                "total_customers": int(len(df)),
                "churn_rate": self._safe_number(churn_rate),
                "average_monthly_charges": self._safe_number(df["MonthlyCharges"].mean()),
                "average_tenure": self._safe_number(df["tenure"].mean()),
                "revenue_at_risk": self._safe_number(revenue_at_risk),
            },
            "data_health": metadata,
            "filters_applied": {key: value for key, value in (filters or {}).items() if value},
        }

    def get_chart_payload(self, filters: dict | None = None) -> dict:
        df = self._add_group_columns(self._apply_filters(self._load_dataframe(), filters))
        if df.empty:
            raise DatasetValidationError("Dataset not loaded for chart analysis. Upload a valid churn CSV to continue.")

        heatmap = (
            df.groupby(["Contract", "tenure_group"], observed=True)
            .agg(churn_rate=("Churn", lambda series: float((series == "Yes").mean() * 100)))
            .reset_index()
        )
        heatmap["churn_rate"] = heatmap["churn_rate"].replace([np.inf, -np.inf], np.nan).fillna(0)
        heatmap["contract_sort"] = heatmap["Contract"].astype(str).apply(lambda value: self._order_index(value, CONTRACT_ORDER))
        heatmap["tenure_sort"] = heatmap["tenure_group"].astype(str).apply(lambda value: self._order_index(value, TENURE_LABELS))
        heatmap = heatmap.sort_values(["contract_sort", "tenure_sort"]).drop(columns=["contract_sort", "tenure_sort"])

        return {
            "filters_applied": {key: value for key, value in (filters or {}).items() if value},
            "churn_by_contract": self._group_churn_metrics(df, "Contract", CONTRACT_ORDER),
            "churn_by_payment_method": self._group_churn_metrics(df, "PaymentMethod", PAYMENT_METHOD_ORDER),
            "churn_by_internet_service": self._group_churn_metrics(df, "InternetService", INTERNET_SERVICE_ORDER),
            "churn_by_tenure_group": self._group_churn_metrics(df, "tenure_group", TENURE_LABELS),
            "churn_by_monthly_charge_range": self._group_churn_metrics(df, "monthly_charge_range", CHARGE_RANGE_LABELS),
            "risk_heatmap": [
                {
                    "contract": str(row["Contract"]),
                    "tenure_group": str(row["tenure_group"]),
                    "churn_rate": self._safe_number(row["churn_rate"]),
                }
                for _, row in heatmap.iterrows()
            ],
        }

    def get_insight_payload(self, filters: dict | None = None) -> dict:
        summary = self.get_summary(filters)
        charts = self.get_chart_payload(filters)
        insight_cards = generate_insight_cards(summary, charts)
        recommendations = generate_recommendations(summary, charts)

        return {
            "top_segment": insight_cards[0]["metric"] if insight_cards else "No data",
            "key_drivers": {
                "contract": charts["churn_by_contract"][0]["segment"] if charts["churn_by_contract"] else "Unknown",
                "tenure": charts["churn_by_tenure_group"][0]["segment"] if charts["churn_by_tenure_group"] else "Unknown",
                "payment": charts["churn_by_payment_method"][0]["segment"] if charts["churn_by_payment_method"] else "Unknown",
            },
            "insight_cards": insight_cards[:6],
            "recommendations": recommendations,
            "high_risk_segments": [card for card in insight_cards if card["severity"] in {"high", "critical"}],
        }

    def train_model(self) -> dict:
        df = self._load_dataframe()
        if df["Churn"].nunique() < 2:
            raise DatasetValidationError("Dataset not loaded with enough churn diversity to train the model.")
        if len(df) < 100:
            raise DatasetValidationError("Dataset not loaded with enough rows to train a stable churn model.")

        x = df[FEATURE_COLUMNS].copy()
        y = df["Churn"].map({"No": 0, "Yes": 1})

        numeric_features = [column for column in FEATURE_COLUMNS if column in NUMERIC_COLUMNS]
        categorical_features = [column for column in FEATURE_COLUMNS if column in CATEGORICAL_COLUMNS]

        numeric_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )
        categorical_transformer = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("encoder", OneHotEncoder(handle_unknown="ignore")),
            ]
        )

        preprocessor = ColumnTransformer(
            transformers=[
                ("num", numeric_transformer, numeric_features),
                ("cat", categorical_transformer, categorical_features),
            ]
        )

        model = LogisticRegression(
            max_iter=2500,
            class_weight="balanced",
            solver="lbfgs",
            random_state=42,
        )

        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])

        x_train, x_test, y_train, y_test = train_test_split(
            x,
            y,
            test_size=0.25,
            random_state=42,
            stratify=y,
        )

        pipeline.fit(x_train, y_train)
        predictions = pipeline.predict(x_test)
        probabilities = pipeline.predict_proba(x_test)[:, 1]

        metrics = {
            "accuracy": self._safe_number(accuracy_score(y_test, predictions), 4),
            "precision": self._safe_number(precision_score(y_test, predictions, zero_division=0), 4),
            "recall": self._safe_number(recall_score(y_test, predictions, zero_division=0), 4),
            "auc": self._safe_number(roc_auc_score(y_test, probabilities), 4),
            "top_30_capture": self._top_share_captured(y_test.to_numpy(), probabilities, 0.30),
            "confusion_matrix": confusion_matrix(y_test, predictions).tolist(),
        }

        feature_names = pipeline.named_steps["preprocessor"].get_feature_names_out()
        coefficients = pipeline.named_steps["model"].coef_[0]
        ranked_features = sorted(zip(feature_names, coefficients), key=lambda item: abs(item[1]), reverse=True)
        top_features = [
            {
                "feature": self._display_name(feature_name),
                "importance": self._safe_number(abs(weight), 4),
                "direction": "Increases churn risk" if weight > 0 else "Reduces churn risk",
            }
            for feature_name, weight in ranked_features[:10]
        ]

        probability_bands = self._risk_bands(y_test.to_numpy(), probabilities)

        self.model_bundle = {
            "pipeline": pipeline,
            "metrics": metrics,
            "top_features": top_features,
            "trained_at": datetime.now(timezone.utc).isoformat(),
            "probability_bands": probability_bands,
            "feature_names": feature_names,
            "coefficients": coefficients,
            "intercept": float(pipeline.named_steps["model"].intercept_[0]),
        }
        logger.info("Logistic regression model trained successfully with %s rows", len(df))

        return {
            "message": "Model trained successfully.",
            "model_name": "Logistic Regression",
            "metrics": metrics,
            "top_features": top_features,
            "trained_at": self.model_bundle["trained_at"],
            "probability_bands": probability_bands,
        }

    @staticmethod
    def _top_share_captured(actual: np.ndarray, scores: np.ndarray, top_fraction: float) -> float:
        """Share of all churners found in the top `top_fraction` of customers ranked by risk score."""
        cutoff = int(round(len(scores) * top_fraction))
        order = np.argsort(-scores, kind="stable")[:cutoff]
        total_churners = actual.sum()
        return round(float(actual[order].sum() / total_churners), 4) if total_churners else 0.0

    @staticmethod
    def _risk_bands(actual: np.ndarray, scores: np.ndarray) -> list[dict]:
        masks = {
            "Low": scores < MEDIUM_RISK_THRESHOLD,
            "Medium": (scores >= MEDIUM_RISK_THRESHOLD) & (scores < HIGH_RISK_THRESHOLD),
            "High": scores >= HIGH_RISK_THRESHOLD,
        }
        return [
            {
                "threshold": band,
                "count": int(mask.sum()),
                "actual_churn_rate": round(float(actual[mask].mean() * 100), 2) if mask.any() else 0.0,
            }
            for band, mask in masks.items()
        ]

    def predict_customer(self, customer_payload: dict) -> dict:
        if not self.model_bundle:
            raise ModelNotTrainedError("Model not trained. Train the churn model before running prediction.")

        payload = customer_payload.copy()
        for key in ["SeniorCitizen", "tenure"]:
            if key in payload:
                payload[key] = int(payload[key])
        for key in ["MonthlyCharges", "TotalCharges"]:
            if key in payload:
                payload[key] = float(payload[key])

        customer_df = pd.DataFrame([{column: payload[column] for column in FEATURE_COLUMNS}])
        pipeline = self.model_bundle["pipeline"]
        probability = float(pipeline.predict_proba(customer_df)[0][1])
        risk_level = "High" if probability >= HIGH_RISK_THRESHOLD else "Medium" if probability >= MEDIUM_RISK_THRESHOLD else "Low"

        transformed = pipeline.named_steps["preprocessor"].transform(customer_df)
        if sparse.issparse(transformed):
            transformed_row = transformed.toarray()[0]
        else:
            transformed_row = np.asarray(transformed)[0]

        coefficients = np.asarray(self.model_bundle["coefficients"])
        contributions = transformed_row * coefficients
        ranked_indices = np.argsort(np.abs(contributions))[::-1]
        top_factors = []
        for index in ranked_indices[:6]:
            if abs(contributions[index]) <= 0:
                continue
            top_factors.append(
                {
                    "feature": self._display_name(self.model_bundle["feature_names"][index]),
                    "impact": self._safe_number(abs(contributions[index]), 4),
                    "direction": "Increases churn risk" if contributions[index] > 0 else "Reduces churn risk",
                }
            )
            if len(top_factors) == 3:
                break

        return {
            "prediction": f"{risk_level} risk",
            "risk_level": risk_level,
            "churn_probability": self._safe_number(probability * 100),
            "recommended_action": (
                "Prioritize proactive retention outreach, plan stabilization, and service review for this profile."
                if risk_level == "High"
                else "Monitor this account, review support quality, and consider a targeted retention offer."
                if risk_level == "Medium"
                else "Customer appears comparatively stable. Focus on engagement and loyalty expansion."
            ),
            "top_model_features": self.model_bundle["top_features"][:10],
            "top_prediction_factors": top_factors,
        }

    def export_report(self, format_name: str) -> tuple[str, str, bytes]:
        normalized_format = format_name.lower().strip()
        summary = self.get_summary()
        charts = self.get_chart_payload()
        insights = self.get_insight_payload()
        model_metrics = self.model_bundle["metrics"] if self.model_bundle else None
        top_features = self.model_bundle["top_features"] if self.model_bundle else []

        if normalized_format == "csv":
            report_df = build_export_dataframe(summary, charts, insights, model_metrics, top_features)
            return ("customer_churn_report.csv", "text/csv", report_df.to_csv(index=False).encode("utf-8"))
        if normalized_format == "pdf":
            pdf_bytes = build_pdf_report(summary, insights, model_metrics, top_features)
            return ("customer_churn_report.pdf", "application/pdf", pdf_bytes)
        raise DatasetValidationError("Invalid export format. Use csv or pdf.")
