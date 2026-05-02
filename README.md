# Customer Churn Intelligence Platform

Customer Churn Intelligence Platform is a full-stack churn analytics application designed for Data Analyst, Business Analyst, and entry-level Data Science portfolios. It combines operational KPI tracking, churn segmentation, automated business insights, and a machine learning prediction workflow in a recruiter-ready analytics dashboard.

## Resume-ready project description

Built a production-style churn intelligence application using React, Tailwind CSS, Recharts, FastAPI, Pandas, scikit-learn, and SQLite. The platform ingests Telco-style customer churn CSV files, validates and cleans the data, calculates business KPIs, visualizes churn drivers, generates automated retention insights, trains a churn prediction model, and exports professional CSV or PDF reports.

## Features

- Full Telco Customer Churn sample dataset included out of the box with 7000+ rows
- CSV upload with strict schema validation and clean user-facing errors
- Data cleaning pipeline for blank `TotalCharges`, missing values, duplicate `customerID`, numeric conversion, and categorical normalization
- Global-neutral KPI system with no currency symbols
- Executive analytics dashboard with compact KPI strip, filter toolbar, charts, insight notes, data health, and prediction lab
- Chart suite for contract, payment method, internet service, tenure, monthly charges, and churn risk heatmap
- Insight engine that surfaces top churn segments, key drivers, and business recommendations
- Logistic Regression churn model with train/test split, realistic metrics, confusion matrix, and top 10 influencing features
- Prediction lab with churn probability, risk level, and local top factors
- CSV and PDF export including KPIs, insights, recommendations, model metrics, and top features
- Graceful empty states and backend-offline handling

## Tech stack

- Frontend: React, Vite, Tailwind CSS, Recharts, Axios
- Backend: FastAPI, Uvicorn
- Data and ML: Python, Pandas, NumPy, scikit-learn
- Database: SQLite
- Export: CSV and PDF via Pandas and ReportLab

## Folder structure

```text
customer-churn-intelligence/
  backend/
    main.py
    requirements.txt
    app/
      routes/
      services/
      models/
      utils/
  frontend/
    package.json
    tailwind.config.js
    src/
      components/
      pages/
      services/
      utils/
  data/
    sample_customer_churn.csv
    telco_customer_churn_full.csv
  README.md
```

## Backend API endpoints

- `POST /upload`
- `GET /summary`
- `GET /charts`
- `GET /insights`
- `POST /train-model`
- `POST /predict`
- `GET /export-report`
- `GET /health`

## Sample dataset

The bundled `data/sample_customer_churn.csv` has been upgraded to the full Telco Customer Churn dataset shape and row volume. The application automatically boots from that file on backend startup, so the dashboard works immediately after setup.

Required schema:

- `customerID`
- `gender`
- `SeniorCitizen`
- `Partner`
- `Dependents`
- `tenure`
- `PhoneService`
- `MultipleLines`
- `InternetService`
- `OnlineSecurity`
- `OnlineBackup`
- `DeviceProtection`
- `TechSupport`
- `StreamingTV`
- `StreamingMovies`
- `Contract`
- `PaperlessBilling`
- `PaymentMethod`
- `MonthlyCharges`
- `TotalCharges`
- `Churn`

## Setup

### 1. Install backend dependencies

```powershell
cd customer-churn-intelligence\backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run the FastAPI backend

```powershell
cd customer-churn-intelligence\backend
.venv\Scripts\activate
uvicorn main:app --reload
```

Backend URLs:

- API: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Health: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Install frontend dependencies

```powershell
cd customer-churn-intelligence\frontend
npm install
```

### 4. Run the React frontend

```powershell
cd customer-churn-intelligence\frontend
npm run dev
```

Frontend URL:

- Dashboard: [http://127.0.0.1:5173](http://127.0.0.1:5173)

### 5. Optional frontend environment variable

Create `frontend/.env` if you want to pin the local backend URL:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## How the app works

1. FastAPI starts and loads the bundled full Telco sample dataset into SQLite.
2. The frontend checks backend health, then loads summary KPIs, charts, and business insights.
3. Uploading a new CSV replaces the active dataset after validation and cleaning.
4. Training the model produces accuracy, precision, recall, confusion matrix, and top feature influence.
5. The prediction lab scores a customer profile and explains local churn factors.
6. Export packages the latest business snapshot as CSV or PDF.

## Testing guide

### Startup and connectivity

1. Start the backend.
2. Start the frontend.
3. Confirm the status pill shows `Backend Connected`.
4. Stop the backend and confirm the UI shows `Backend is offline. Start the FastAPI server and refresh.`

### Dataset and validation

1. Load the app and confirm the full sample dataset appears automatically.
2. Upload `data/sample_customer_churn.csv` and confirm the upload succeeds.
3. Confirm data health shows cleaned rows, duplicates removed, blank charges fixed, and missing values filled.
4. Upload a malformed CSV and confirm the UI shows `Invalid CSV format`.
5. Upload a CSV missing required columns and confirm the UI shows the missing-column validation message.
6. Upload a report-export CSV and confirm it is rejected cleanly.

### KPI and chart verification

1. Confirm the dashboard shows total customers, churn rate, average monthly charges, average tenure, and revenue at risk.
2. Confirm there are no currency symbols in the UI.
3. Change contract, internet service, payment method, or churn filters.
4. Confirm KPIs and charts update based on the selected filters.
5. Confirm all charts have tooltips and empty states when no data is available.

### Machine learning and prediction

1. Click `Train Model`.
2. Confirm accuracy, precision, recall, confusion matrix, and top 10 features appear.
3. Confirm the model metrics are realistic and not perfect.
4. Open `Prediction Lab`.
5. Enter a customer scenario and click `Run Prediction`.
6. Confirm churn probability, risk level, and top 3 factors appear.

### Export

1. Click `Export CSV`.
2. Confirm the report includes KPIs, insights, recommendations, model metrics, and top features.
3. Click `Export PDF`.
4. Confirm the PDF downloads and contains a readable professional summary.

### Responsiveness and UI quality

1. Check the dashboard at 1366px laptop width.
2. Check tablet width.
3. Check mobile width.
4. Confirm filters do not overlap, KPI cards stay aligned, and the prediction form remains usable.
5. Confirm there are no console errors during normal use.

## Common errors and fixes

### Backend is offline

- Make sure FastAPI is running on `http://127.0.0.1:8000`
- Refresh the frontend after the server starts
- If needed, add `VITE_API_BASE_URL=http://127.0.0.1:8000` to `frontend/.env`

### Invalid CSV format

- Confirm the upload is a real Telco churn dataset and not a previously exported report
- Confirm all required columns are present
- Confirm the file extension is `.csv`

### Dataset not loaded

- Start the backend first so the bundled sample dataset can bootstrap
- If the database was left in an invalid state, restart the backend to reload the sample dataset

### Model not trained

- Click `Train Model` before using the prediction lab
- Re-train after every new dataset upload because the model resets intentionally

### Frontend cannot connect locally

- Confirm backend port `8000` and frontend port `5173`
- Check `frontend/src/services/api.js` or `frontend/.env`
- Verify CORS is enabled in `backend/main.py`

## Screenshots

Add screenshots here after local run:

- Dashboard overview
- Segment filter view
- Insight and data health panel
- Model snapshot
- Prediction lab

## Future improvements

- Add saved analysis sessions and dataset version history
- Add segment drill-down tables with customer search
- Add SHAP-based local explanations
- Add automated frontend and backend test suites
- Add benchmark comparison across multiple churn datasets

