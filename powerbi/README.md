# Power BI dashboard

Three report pages built on `churn_customers_powerbi.csv` (7,043 customers with model risk scores):

1. **Overview**: customers, churn rate, revenue lost, churn by contract, tenure, internet service and payment method
2. **Who to call first**: highest-risk segment, model risk bands, risk deciles, call list
3. **Retention impact**: revenue lost and a save-rate what-if

## Open the project

1. Open `Churn.pbip` in Power BI Desktop (enable *Power BI Project* files under Options > Preview features if asked).
2. In `Churn.SemanticModel/definition/expressions.tmdl`, set `DataFile` to the full path of `churn_customers_powerbi.csv` on your machine.
3. Click **Refresh**.

`BUILD_GUIDE.md` explains how every measure and visual was built, and `churn_theme.json` holds the colour theme.
