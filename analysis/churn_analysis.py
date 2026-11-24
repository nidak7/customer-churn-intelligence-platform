"""
Customer churn analysis. Reproduces the main numbers and builds the Power BI dataset.

Run from the repository root:
    python analysis/churn_analysis.py

What it does
1. Cleans the Telco data (11 blank TotalCharges become 0, they are new customers not yet billed).
2. Prints the main churn numbers and chi-square tests.
3. Trains the same Logistic Regression the web app uses (75/25 split, seed 42).
4. Writes powerbi/churn_customers_powerbi.csv with a risk score and band for every customer.
"""
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2_contingency
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "telco_customer_churn.csv"
OUT = ROOT / "powerbi" / "churn_customers_powerbi.csv"

MEDIUM_RISK, HIGH_RISK = 0.30, 0.60  # Low < 0.30 <= Medium < 0.60 <= High


def load_clean() -> pd.DataFrame:
    df = pd.read_csv(DATA)
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    blanks = int(df["TotalCharges"].isna().sum())
    df["TotalCharges"] = df["TotalCharges"].fillna(0)  # all the blanks are tenure-0 customers
    assert df["customerID"].is_unique
    print(f"Rows: {len(df):,} | blank TotalCharges fixed: {blanks}")
    # quick checks so I notice if the data file changes
    assert len(df) == 7043, "expected 7,043 customers"
    assert blanks == 11, "expected 11 blank TotalCharges"
    df["ChurnFlag"] = (df["Churn"] == "Yes").astype(int)
    df["TenureBand"] = pd.cut(df["tenure"], [-1, 12, 24, 48, 72],
                              labels=["0-12 months", "13-24 months", "25-48 months", "49-72 months"])
    df["ChargeBand"] = pd.cut(df["MonthlyCharges"], [0, 35, 70, 100, 130],
                              labels=["0-35", "36-70", "71-100", "101-130"], include_lowest=True)
    return df


def headline(df: pd.DataFrame) -> None:
    rate = df["ChurnFlag"].mean() * 100
    rev_share = df.loc[df.ChurnFlag == 1, "MonthlyCharges"].sum() / df["MonthlyCharges"].sum() * 100
    print(f"\nChurn rate: {rate:.2f}% ({df.ChurnFlag.sum():,} customers) | revenue share of churners: {rev_share:.1f}%")
    for col in ["Contract", "TenureBand", "InternetService", "PaymentMethod"]:
        print(f"\nChurn by {col}")
        print((df.groupby(col, observed=True)["ChurnFlag"].mean() * 100).round(2).to_string())
    seg = df[(df.Contract == "Month-to-month") & (df.InternetService == "Fiber optic")
             & (df.PaymentMethod == "Electronic check") & (df.tenure <= 12)]
    print(f"\nHighest-risk segment: {len(seg)} customers, {seg.ChurnFlag.mean() * 100:.1f}% churn")

    print("\nChi-square tests (p < 0.05 means linked to churn)")
    for col in ["Contract", "TenureBand", "InternetService", "PaymentMethod", "OnlineSecurity",
                "TechSupport", "gender", "PhoneService"]:
        _, p, _, _ = chi2_contingency(pd.crosstab(df[col], df["ChurnFlag"]))
        print(f"  {col:<16} p = {p:.4g}  {'linked' if p < 0.05 else 'not linked'}")


def score(df: pd.DataFrame) -> pd.DataFrame:
    features = [c for c in df.columns if c not in
                {"customerID", "Churn", "ChurnFlag", "TenureBand", "ChargeBand"}]
    numeric = ["SeniorCitizen", "tenure", "MonthlyCharges", "TotalCharges"]
    categorical = [c for c in features if c not in numeric]
    pipe = Pipeline([
        ("prep", ColumnTransformer([("num", StandardScaler(), numeric),
                                    ("cat", OneHotEncoder(handle_unknown="ignore"), categorical)])),
        ("model", LogisticRegression(max_iter=2500, class_weight="balanced", random_state=42)),
    ])
    x_train, x_test, y_train, y_test = train_test_split(
        df[features], df["ChurnFlag"], test_size=0.25, random_state=42, stratify=df["ChurnFlag"])
    pipe.fit(x_train, y_train)

    p_test = pipe.predict_proba(x_test)[:, 1]
    pred = (p_test >= 0.5).astype(int)
    top30 = np.argsort(-p_test, kind="stable")[: int(round(len(p_test) * 0.30))]
    print(f"\nModel on {len(y_test):,} unseen customers")
    print(f"  Accuracy {accuracy_score(y_test, pred):.4f} | Precision {precision_score(y_test, pred):.4f} "
          f"| Recall {recall_score(y_test, pred):.4f} | AUC {roc_auc_score(y_test, p_test):.4f}")
    print(f"  Top 30% of customers by risk contain {y_test.to_numpy()[top30].sum() / y_test.sum() * 100:.1f}% of churners")

    out = df.copy()
    out["RiskScore"] = pipe.predict_proba(df[features])[:, 1].round(4)
    out["RiskBand"] = pd.cut(out["RiskScore"], [-0.01, MEDIUM_RISK - 1e-9, HIGH_RISK - 1e-9, 1.0],
                             labels=["Low", "Medium", "High"])
    out["IsTestCustomer"] = out.index.isin(x_test.index).astype(int)  # scores on training rows look better than they should
    out["RiskRank"] = out["RiskScore"].rank(ascending=False, method="first").astype(int)
    out["RiskDecile"] = pd.qcut(out["RiskRank"], 10, labels=range(1, 11)).astype(int)
    out["RiskBandOrder"] = out["RiskBand"].map({"Low": 1, "Medium": 2, "High": 3}).astype(int)
    out["TenureBandOrder"] = out["TenureBand"].cat.codes + 1
    out["HighRiskSegment"] = ((out.Contract == "Month-to-month") & (out.InternetService == "Fiber optic")
                              & (out.PaymentMethod == "Electronic check") & (out.tenure <= 12)).astype(int)
    test = out[out.IsTestCustomer == 1]
    print("\nActual churn by risk band (test customers)")
    print(test.groupby("RiskBand", observed=True)["ChurnFlag"].agg(customers="count", churn_rate=lambda s: round(s.mean() * 100, 2)).to_string())
    return out


if __name__ == "__main__":
    data = load_clean()
    headline(data)
    result = score(data)
    OUT.parent.mkdir(exist_ok=True)
    result.to_csv(OUT, index=False)
    print(f"\nWrote {OUT.relative_to(ROOT)} ({len(result):,} rows)")
