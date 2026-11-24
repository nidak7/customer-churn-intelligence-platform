# Power BI dashboard

The report has three pages, all built on `churn_customers_powerbi.csv` (7,043 customers with model risk scores).

- Overview: customers, churn rate, revenue lost, and churn by contract, tenure, internet service and payment method.
- Who to call first: the highest-risk segment, model risk bands, risk deciles and a call list.
- Retention impact: revenue lost by segment, and revenue kept at 5%, 10% and 20% save rates.

## Open the project

1. Open `Churn.pbip` in Power BI Desktop (if it asks, turn on *Power BI Project* files under Options > Preview features).
2. In `Churn.SemanticModel/definition/expressions.tmdl`, set `DataFile` to the full path of `churn_customers_powerbi.csv` on your machine.
3. Click Refresh.

`BUILD_GUIDE.md` has notes on how I built the measures and visuals, and `churn_theme.json` is the colour theme.
