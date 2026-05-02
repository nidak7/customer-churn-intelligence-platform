from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    gender: str = Field(default="Female")
    SeniorCitizen: int = Field(default=0, ge=0, le=1)
    Partner: str = Field(default="No")
    Dependents: str = Field(default="No")
    tenure: int = Field(default=12, ge=0)
    PhoneService: str = Field(default="Yes")
    MultipleLines: str = Field(default="No")
    InternetService: str = Field(default="Fiber optic")
    OnlineSecurity: str = Field(default="No")
    OnlineBackup: str = Field(default="No")
    DeviceProtection: str = Field(default="No")
    TechSupport: str = Field(default="No")
    StreamingTV: str = Field(default="Yes")
    StreamingMovies: str = Field(default="Yes")
    Contract: str = Field(default="Month-to-month")
    PaperlessBilling: str = Field(default="Yes")
    PaymentMethod: str = Field(default="Electronic check")
    MonthlyCharges: float = Field(default=79.5, ge=0)
    TotalCharges: float = Field(default=954.0, ge=0)
