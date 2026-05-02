REQUIRED_COLUMNS = [
    "customerID",
    "gender",
    "SeniorCitizen",
    "Partner",
    "Dependents",
    "tenure",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
    "MonthlyCharges",
    "TotalCharges",
    "Churn",
]

NUMERIC_COLUMNS = ["SeniorCitizen", "tenure", "MonthlyCharges", "TotalCharges"]
BINARY_COLUMNS = ["Partner", "Dependents", "PhoneService", "PaperlessBilling", "Churn"]

CATEGORICAL_COLUMNS = [
    "gender",
    "Partner",
    "Dependents",
    "PhoneService",
    "MultipleLines",
    "InternetService",
    "OnlineSecurity",
    "OnlineBackup",
    "DeviceProtection",
    "TechSupport",
    "StreamingTV",
    "StreamingMovies",
    "Contract",
    "PaperlessBilling",
    "PaymentMethod",
]

FEATURE_COLUMNS = [column for column in REQUIRED_COLUMNS if column not in {"customerID", "Churn"}]

TENURE_BINS = [-1, 12, 24, 48, 72]
TENURE_LABELS = ["0-12 months", "13-24 months", "25-48 months", "49-72 months"]

CHARGE_RANGE_BINS = [0, 35, 70, 100, 130]
CHARGE_RANGE_LABELS = ["0-35", "36-70", "71-100", "101-130"]

CONTRACT_ORDER = ["Month-to-month", "One year", "Two year"]
PAYMENT_METHOD_ORDER = [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)",
]
INTERNET_SERVICE_ORDER = ["Fiber optic", "DSL", "No"]

NORMALIZED_VALUE_MAPS = {
    "gender": {
        "female": "Female",
        "male": "Male",
    },
    "PhoneService": {
        "yes": "Yes",
        "no": "No",
    },
    "MultipleLines": {
        "yes": "Yes",
        "no": "No",
        "no phone service": "No phone service",
    },
    "InternetService": {
        "dsl": "DSL",
        "fiber optic": "Fiber optic",
        "fiber": "Fiber optic",
        "no": "No",
    },
    "OnlineSecurity": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "OnlineBackup": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "DeviceProtection": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "TechSupport": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "StreamingTV": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "StreamingMovies": {
        "yes": "Yes",
        "no": "No",
        "no internet service": "No internet service",
    },
    "Contract": {
        "month-to-month": "Month-to-month",
        "one year": "One year",
        "two year": "Two year",
    },
    "PaperlessBilling": {
        "yes": "Yes",
        "no": "No",
    },
    "PaymentMethod": {
        "electronic check": "Electronic check",
        "mailed check": "Mailed check",
        "bank transfer (automatic)": "Bank transfer (automatic)",
        "credit card (automatic)": "Credit card (automatic)",
    },
}
