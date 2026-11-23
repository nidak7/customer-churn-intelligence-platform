# Interactive churn app (optional)

A small web version of the churn analysis: filter by segment, train the model, and score a single customer.

**Backend** (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend** (React)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and click **Train Model**. The dataset in `../../data/` loads automatically.
