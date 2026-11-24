# How I built the Power BI dashboard

Notes on how I built the dashboard from `churn_customers_powerbi.csv` (7,043 rows, one per customer, with the model risk scores). Where it helps, I list a number to check against the notebook.

## 1. Load and clean (Power Query)
1. Home > Get data > Text/CSV, pick `churn_customers_powerbi.csv`, then Transform Data.
2. Check types: `tenure`, `MonthlyCharges`, `TotalCharges`, `RiskScore` = Decimal/Whole number; `ChurnFlag`, `IsTestCustomer`, `RiskDecile`, `RiskRank`, `HighRiskSegment` = Whole number; everything else = Text.
3. Home > Close & Apply.

Check: the table has 7,043 rows.

## 2. Sort the band columns
Text sorts alphabetically, so the bands come out in the wrong order. The dataset already has `RiskBandOrder` and `TenureBandOrder`. If you build from scratch, you can create them in Modeling > New column:

```DAX
RiskBandOrder = SWITCH(customers[RiskBand], "Low", 1, "Medium", 2, "High", 3)
TenureBandOrder = SWITCH(customers[TenureBand], "0-12 months", 1, "13-24 months", 2, "25-48 months", 3, 4)
```
Select `RiskBand`, then Column tools > Sort by column > RiskBandOrder. Do the same for `TenureBand`.

## 3. Measures (Modeling > New measure)
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

Checks: Customers 7,043, Churn Rate 26.54%, Revenue Lost $139,131, Revenue Lost % 30.5%, Avg Tenure 32.4, Retained at 10% $166,957.

These two measures are for test customers only. Scores on training rows look better than they should, so I check the model on unseen customers:
```DAX
Test Churn Rate = CALCULATE([Churn Rate], customers[IsTestCustomer] = 1)
High Risk Segment Churn = CALCULATE([Churn Rate], customers[HighRiskSegment] = 1)
```
Checks: High Risk Segment Churn is 71.2% (631 customers). With `RiskBand = High` and the test filter, churn is 55.19% (Low 4.47%, Medium 24.94%).

## 4. Theme
View > Themes > Browse for themes, then pick `churn_theme.json`. That's the soft slate palette in the screenshots.

## 5. Page 1: Overview
- 4 card visuals: Customers, Churn Rate, Revenue Lost, Avg Tenure.
- Clustered column: X = `Contract`, Y = `Churn Rate`.
- Line chart: X = `TenureBand`, Y = `Churn Rate`.
- Clustered column: X = `InternetService`. Bar chart: Y = `PaymentMethod`, X = `Churn Rate`.
- Turn on data labels in Format, and set the Y axis to start at 0.

## 6. Page 2: Who to call first
- Card: `High Risk Segment Churn`.
- Column chart: X = `RiskBand`, Y = `Test Churn Rate`.
- Column chart: X = `RiskDecile`, Y = `Churn Rate` (decile 1 should be about 76%).
- Table: `customerID`, `Contract`, `tenure`, `MonthlyCharges`, `RiskScore`; filter `IsTestCustomer = 1`, sort by `RiskScore` descending, Top N = 12 (Filters pane).
- Slicers: `Contract`, `InternetService`.

## 7. Page 3: Retention impact
- Cards for `Retained at 5%`, `Retained at 10%`, `Retained at 20%` and `Revenue Lost %`, then column or bar charts of `Revenue Lost` by `Contract`, `TenureBand`, `InternetService` and `PaymentMethod`.

## 8. Finish
Add page names, align the visuals with Format > Align, and turn on View > Gridlines > Snap to grid. Save the file and export a screenshot of each page for the README.
