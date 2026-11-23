import sqlite3
from pathlib import Path

import pandas as pd


class DatasetRepository:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def initialize(self):
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS customer_churn (
                    customerID TEXT PRIMARY KEY,
                    gender TEXT,
                    SeniorCitizen INTEGER,
                    Partner TEXT,
                    Dependents TEXT,
                    tenure INTEGER,
                    PhoneService TEXT,
                    MultipleLines TEXT,
                    InternetService TEXT,
                    OnlineSecurity TEXT,
                    OnlineBackup TEXT,
                    DeviceProtection TEXT,
                    TechSupport TEXT,
                    StreamingTV TEXT,
                    StreamingMovies TEXT,
                    Contract TEXT,
                    PaperlessBilling TEXT,
                    PaymentMethod TEXT,
                    MonthlyCharges REAL,
                    TotalCharges REAL,
                    Churn TEXT
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS dataset_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
                """
            )
            connection.commit()

    def save_dataset(self, dataframe: pd.DataFrame, metadata: dict):
        with self._connect() as connection:
            connection.execute("DELETE FROM customer_churn")
            dataframe.to_sql("customer_churn", connection, if_exists="append", index=False)
            connection.execute("DELETE FROM dataset_meta")
            connection.executemany(
                "INSERT INTO dataset_meta (key, value) VALUES (?, ?)",
                [(key, str(value)) for key, value in metadata.items()],
            )
            connection.commit()

    def load_dataset(self) -> pd.DataFrame:
        with self._connect() as connection:
            return pd.read_sql_query("SELECT * FROM customer_churn", connection)

    def load_metadata(self) -> dict:
        with self._connect() as connection:
            rows = connection.execute("SELECT key, value FROM dataset_meta").fetchall()
        return {key: value for key, value in rows}
