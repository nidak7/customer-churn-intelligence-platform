# Customer Churn Intelligence

**Which telecom customers are likely to leave, why, and who should the retention team contact first?**

This project analyzes 7,043 customers from the public IBM Telco Customer Churn dataset. It combines data cleaning, churn analysis, statistical testing, and a Logistic Regression model, and presents the results in a dashboard with downloadable reports.

---

## Key findings

| Question | Answer |
|---|---|
| How many customers left? | **1,869 of 7,043 (26.54%)**, about one in four |
| How much monthly revenue did they take? | **30.5%** of all monthly charges |
| What mattered most? | **Contract type.** Month-to-month: 42.71% churn. Two-year: 2.83% |
| When is risk highest? | **The first year.** 47.44% of customers with 0–12 months' tenure left |
| Which groups stood out? | Fibre optic users (41.89%), electronic check payers (45.29%), senior citizens (41.68%) |
| Riskiest segment? | New month-to-month fibre customers paying by electronic check: **71.2% churn** (631 customers) |
| What reduces churn? | Online security and tech support: about **15%** churn with them vs **42%** without |

Chi-square tests confirmed that contract, tenure, internet service, payment method, and add-on services are all linked to churn. Gender and phone service are not.

---

## Model results

A Logistic Regression model with balanced class weights was trained on 75% of customers and tested on the remaining **1,761** customers it had never seen.

| Measure | Result | In plain words |
|---|---|---|
| Recall | **79.66%** | Caught about 4 in 5 customers who actually left |
| Precision | 51.88% | About half of flagged customers actually left |
| Accuracy | 75.01% | Correct for 3 in 4 customers overall |
| AUC | **0.846** | Ranks churners above non-churners well |

**Risk bands** (probability cut-offs 0.30 and 0.60, checked on the same 1,761 unseen customers):

| Band | Customers | Actually churned |
|---|---|---|
| Low | 761 | 4.47% |
| Medium | 393 | 24.94% |
| High | 607 | 55.19% |

**Business impact:** the top 30% of customers by predicted risk contained **66.4%** of everyone who left. A retention team could reach two-thirds of likely leavers by contacting fewer than a third of customers.

**Why recall over accuracy?** Missing a customer who is about to leave usually costs more than one extra courtesy call.

---

**Revenue view:** churned customers paid $139,131 a month. Saving 10% of them would keep about **$166,957 a year**.

---

## Repository contents

| Folder | What is inside |
|---|---|
| `analysis/churn_analysis.py` | Cleans the data, reproduces every figure above, trains the model and writes the Power BI dataset |
| `sql/churn_analysis_queries.sql` | 10 queries (GROUP BY, CASE, CTE, window function) with expected results |
| `powerbi/` | Scored dataset, Power BI theme and a step-by-step build guide |
| `backend/`, `frontend/` | FastAPI service and React dashboard |
| `data/telco_customer_churn.csv` | Source data |

**Reproduce the numbers:** `pip install pandas scikit-learn scipy` then `python analysis/churn_analysis.py`

---

## Recommendations

1. **Support new customers early.** Check in at 30, 90, and 180 days.
2. **Offer suitable contract upgrades** to high-risk month-to-month customers.
3. **Move electronic-check payers to automatic payment.**
4. **Bundle online security and tech support,** especially for fibre customers.
5. **Review fibre pricing and quality.** Fibre churn is higher at every tenure level.
6. **Score customers monthly** and assign actions by Low, Medium, and High risk.

Test each action on a small group first. These results show association, not proof of cause.

---

## How it works

```text
CSV data → cleaning and validation (Pandas) → SQLite storage
        → KPIs, segment churn rates, and insights
        → Logistic Regression (scikit-learn) → risk scores
        → FastAPI endpoints → React dashboard → CSV/PDF reports
```

**Data cleaning**
- Converted `TotalCharges` from text to numbers
- Set 11 blank `TotalCharges` values to 0. They all belonged to new customers who had not been billed yet.
- Checked for duplicate customer IDs (none found)

**Tech stack**
- Analysis and ML: Python, Pandas, NumPy, scikit-learn
- Storage: SQLite
- API: FastAPI
- Dashboard: React, Recharts, Tailwind CSS
- Reports: CSV and PDF (ReportLab)

---

## Run it locally

**Backend**

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API docs: http://127.0.0.1:8000/docs

**Frontend** (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Dashboard: http://127.0.0.1:5173

The full dataset in `data/` loads automatically when the backend starts.

---

## Limitations

- Public data and a hypothetical company, so results may differ for a real telecom business
- A single snapshot with no complaint, usage, or satisfaction data
- Findings show association, not causation
- Only Logistic Regression was tested. Comparing it with Random Forest is a planned next step.

---

## Dataset

IBM Telco Customer Churn (`WA_Fn-UseC_-Telco-Customer-Churn.csv`): 7,043 customers, 21 columns, used for educational purposes.

**Author:** Nida Farheen Khan · [LinkedIn](https://www.linkedin.com/in/nida-khan-237715279)
