# Power BI build guide: Customer Churn

Build the dashboard from `churn_customers_powerbi.csv` (7,043 rows, one per customer, with model risk scores). Every step ends with a number to check.

## 1. Load and clean (Power Query)
1. **Home → Get data → Text/CSV** → pick `churn_customers_powerbi.csv` → **Transform Data**.
2. Check types: `tenure`, `MonthlyCharges`, `TotalCharges`, `RiskScore` = Decimal/Whole number; `ChurnFlag`, `IsTestCustomer`, `RiskDecile`, `RiskRank`, `HighRiskSegment` = Whole number; everything else = Text.
3. **Home → Close & Apply**.

Check: the table has **7,043 rows**.

## 2. Sort the band columns
Text sorts alphabetically, so bands come out in the wrong order. The dataset already includes `RiskBandOrder` and `TenureBandOrder`. If you build from scratch, you can also create them in **Modeling → New column**:

```DAX
RiskBandOrder = SWITCH(customers[RiskBand], "Low", 1, "Medium", 2, "High", 3)
TenureBandOrder = SWITCH(customers[TenureBand], "0-12 months", 1, "13-24 months", 2, "25-48 months", 3, 4)
```
Select `RiskBand` → **Column tools → Sort by column → RiskBandOrder**. Repeat for `TenureBand`.

## 3. Measures (Modeling → New measure)
```DAX
Customers      = COUNTROWS(customers)
Churned        = CALCULATE([Customers], customers[ChurnFlag] = 1)
Churn Rate     = DIVIDE([Churned], [Customers])
Monthly Revenue = SUM(customers[MonthlyCharges])
Revenue Lost   = CALCULATE([Monthly Revenue], customers[ChurnFlag] = 1)
Revenue Lost % = DIVIDE([Revenue Lost], [Monthly Revenue])
Avg Tenure     = AVERAGE(customers[tenure])
Retained at 5%  = [Revenue Lost] * 12 * 0.05
Retained at 10% = [Revenue Lost] * 12 * 0.10
Retained at 20% = [Revenue Lost] * 12 * 0.20
```

Checks: Customers **7,043** · Churn Rate **26.54%** · Revenue Lost **$139,131** · Revenue Lost % **30.5%** · Avg Tenure **32.4** · Retained at 10% = **$166,957**.

Test-only measures (training rows have flattering scores, so validate the model on unseen customers only):
```DAX
Test Churn Rate = CALCULATE([Churn Rate], customers[IsTestCustomer] = 1)
High Risk Segment Churn = CALCULATE([Churn Rate], customers[HighRiskSegment] = 1)
```
Checks: High Risk Segment Churn **71.2%** (631 customers). With `RiskBand = High` and the test filter, churn is **55.19%** (Low **4.47%**, Medium **24.94%**).

## 4. Theme
**View → Themes → Browse for themes** → `churn_theme.json`. This gives the soft slate palette used in the screenshots.

## 5. Page 1: Overview
- 4 **Card** visuals: Customers, Churn Rate, Revenue Lost, Avg Tenure.
- **Clustered column**: X = `Contract`, Y = `Churn Rate`.
- **Line chart**: X = `TenureBand`, Y = `Churn Rate`.
- **Clustered column**: X = `InternetService`; **Bar chart**: Y = `PaymentMethod`, X = `Churn Rate`.
- Format → Data labels on; set Y axis start to 0.

## 6. Page 2: Who to call first
- Card: `High Risk Segment Churn`.
- Column chart: X = `RiskBand`, Y = `Test Churn Rate`.
- Column chart: X = `RiskDecile`, Y = `Churn Rate` (decile 1 should be about 76%).
- **Table**: `customerID`, `Contract`, `tenure`, `MonthlyCharges`, `RiskScore`; filter `IsTestCustomer = 1`, sort by `RiskScore` descending, Top N = 12 (Filters pane).
- Slicers: `Contract`, `InternetService`.

## 7. Page 3: Retention impact
- Cards for `Retained at 5%`, `Retained at 10%`, `Retained at 20%` and `Revenue Lost %`, then column or bar charts of `Revenue Lost` by `Contract`, `TenureBand`, `InternetService` and `PaymentMethod`.

## 8. Finish
Add page names, align visuals with **Format → Align**, turn on **View → Gridlines → Snap to grid**. Save the file, and export a screenshot of each page for the README.

## Talking points for interviews
- Churn is 26.5% and is concentrated: month-to-month contracts and the first 12 months.
- The riskiest 30% of customers contain 66.4% of churners, so outreach can be targeted.
- I validated the model on unseen customers only, and I chose recall over accuracy because missing a leaver costs more than an extra call.
