-- Customer churn analysis queries (SQLite syntax; works in PostgreSQL with minor changes)
-- Table: customers  (load data/telco_customer_churn.csv; TotalCharges blanks set to 0)
-- Expected results are shown in the comments.

-- 1. Overall churn rate and revenue share
-- Expect: 7043 customers, 1869 churned, 26.54%, churners hold 30.5% of monthly revenue
SELECT COUNT(*)                                                       AS customers,
       SUM(Churn = 'Yes')                                             AS churned,
       ROUND(100.0 * SUM(Churn = 'Yes') / COUNT(*), 2)                AS churn_rate_pct,
       ROUND(100.0 * SUM(CASE WHEN Churn='Yes' THEN MonthlyCharges END) / SUM(MonthlyCharges), 1) AS churner_revenue_share_pct
FROM customers;

-- 2. Churn by contract type
-- Expect: Month-to-month 42.71, One year 11.27, Two year 2.83
SELECT Contract, COUNT(*) AS customers,
       ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 2) AS churn_rate_pct
FROM customers GROUP BY Contract ORDER BY churn_rate_pct DESC;

-- 3. Churn by tenure band
-- Expect: 0-12 months 47.44 ... 49-72 months 9.51
SELECT CASE WHEN tenure <= 12 THEN '1. 0-12 months'
            WHEN tenure <= 24 THEN '2. 13-24 months'
            WHEN tenure <= 48 THEN '3. 25-48 months'
            ELSE '4. 49-72 months' END AS tenure_band,
       COUNT(*) AS customers,
       ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 2) AS churn_rate_pct
FROM customers GROUP BY tenure_band ORDER BY tenure_band;

-- 4. Churn by internet service and payment method
-- Expect: Fiber optic 41.89, Electronic check 45.29
SELECT InternetService, PaymentMethod, COUNT(*) AS customers,
       ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 2) AS churn_rate_pct
FROM customers GROUP BY InternetService, PaymentMethod
HAVING COUNT(*) >= 100 ORDER BY churn_rate_pct DESC;

-- 5. Highest-risk segment
-- Expect: 631 customers, 71.2% churn
SELECT COUNT(*) AS customers, ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 1) AS churn_rate_pct,
       ROUND(SUM(MonthlyCharges), 0) AS monthly_revenue
FROM customers
WHERE Contract = 'Month-to-month' AND InternetService = 'Fiber optic'
  AND PaymentMethod = 'Electronic check' AND tenure <= 12;

-- 6. Protective add-on services
-- Expect: roughly 15% churn with online security / tech support vs 42% without
SELECT 'Online security' AS service, OnlineSecurity AS has_service, COUNT(*) AS customers,
       ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 2) AS churn_rate_pct
FROM customers WHERE InternetService <> 'No' GROUP BY OnlineSecurity
UNION ALL
SELECT 'Tech support', TechSupport, COUNT(*), ROUND(100.0 * SUM(Churn='Yes') / COUNT(*), 2)
FROM customers WHERE InternetService <> 'No' GROUP BY TechSupport;

-- 7. Monthly revenue lost to churn, by contract (window function for share of total)
SELECT Contract,
       ROUND(SUM(CASE WHEN Churn='Yes' THEN MonthlyCharges END), 0) AS revenue_lost,
       ROUND(100.0 * SUM(CASE WHEN Churn='Yes' THEN MonthlyCharges END)
             / SUM(SUM(CASE WHEN Churn='Yes' THEN MonthlyCharges END)) OVER (), 1) AS share_of_lost_pct
FROM customers GROUP BY Contract ORDER BY revenue_lost DESC;

-- 8. Customer lifetime value of leavers vs stayers
SELECT Churn, COUNT(*) AS customers, ROUND(AVG(tenure), 1) AS avg_tenure_months,
       ROUND(AVG(MonthlyCharges), 2) AS avg_monthly, ROUND(AVG(TotalCharges), 0) AS avg_lifetime_value
FROM customers GROUP BY Churn;

-- 9. CTE: contract + tenure heatmap, flagging cells above the overall churn rate
WITH base AS (SELECT 100.0 * SUM(Churn='Yes') / COUNT(*) AS overall FROM customers),
cells AS (
  SELECT Contract,
         CASE WHEN tenure <= 12 THEN '0-12' WHEN tenure <= 24 THEN '13-24'
              WHEN tenure <= 48 THEN '25-48' ELSE '49-72' END AS tenure_band,
         COUNT(*) AS customers, 100.0 * SUM(Churn='Yes') / COUNT(*) AS churn_rate
  FROM customers GROUP BY 1, 2)
SELECT Contract, tenure_band, customers, ROUND(churn_rate, 1) AS churn_rate_pct,
       CASE WHEN churn_rate > overall THEN 'Above average' ELSE 'Below average' END AS flag
FROM cells, base ORDER BY churn_rate DESC;

-- 10. Risk bands from the model (requires powerbi/churn_customers_powerbi.csv loaded as scored_customers)
-- Expect on test customers: Low 761 / 4.47%, Medium 393 / 24.94%, High 607 / 55.19%
SELECT RiskBand, COUNT(*) AS customers,
       ROUND(100.0 * SUM(ChurnFlag) / COUNT(*), 2) AS actual_churn_pct
FROM scored_customers WHERE IsTestCustomer = 1
GROUP BY RiskBand ORDER BY CASE RiskBand WHEN 'Low' THEN 1 WHEN 'Medium' THEN 2 ELSE 3 END;
