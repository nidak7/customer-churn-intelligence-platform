# Data

`telco_customer_churn.csv` is the IBM Telco Customer Churn dataset: 7,043 customers, one row each, 21 columns.

The columns I used most:

| Column | What it means |
|---|---|
| customerID | Customer id |
| tenure | Months the customer has been with the company (0 to 72) |
| Contract | Month-to-month, One year or Two year |
| InternetService | DSL, Fiber optic or No |
| PaymentMethod | Electronic check, Mailed check, Bank transfer (automatic), Credit card (automatic) |
| OnlineSecurity, TechSupport | Yes, No, or No internet service |
| MonthlyCharges | Monthly bill in dollars |
| TotalCharges | Total billed so far. Stored as text, with 11 blanks for new customers |
| SeniorCitizen | 1 if the customer is a senior citizen |
| Churn | Yes if the customer left in the last month |

The other columns are customer details (gender, Partner, Dependents) and the services they have (PhoneService, MultipleLines, OnlineBackup, DeviceProtection, StreamingTV, StreamingMovies, PaperlessBilling).

Cleaning: I turned `TotalCharges` into a number and set the 11 blanks to 0, because all 11 customers had 0 months of tenure and hadn't been billed yet. There are no duplicate customer ids.

`powerbi/churn_customers_powerbi.csv` has the same customers plus columns I added: `ChurnFlag` (1 or 0), `TenureBand`, `ChargeBand`, `RiskScore` (model probability), `RiskBand` (Low, Medium, High), `IsTestCustomer` (1 if the customer was in the test set), `RiskRank`, `RiskDecile` and `HighRiskSegment`.
