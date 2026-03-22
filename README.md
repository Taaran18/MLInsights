# MLInsights — Automated ML Analysis Platform

Upload any CSV or Excel dataset, explore it, clean it, train 30+ machine learning models, compare results, and download everything — PDF report, cleaned dataset, session metadata, and trained `.pkl` files.

---

## Tech Stack

| Layer    | Technology                                      |
|----------|-------------------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts  |
| Backend  | FastAPI, Python 3.12, scikit-learn, XGBoost, LightGBM, CatBoost |
| Hosting  | Vercel (frontend) · Render (backend)            |

---

## Features

- **Dataset Insights** — shape, dtypes, describe, correlation heatmap, value counts
- **Missing Values** — per-column stats, smart cleaning options (fill, drop, normalize)
- **Train Models** — 30+ models across regression, classification, clustering; auto-recommendations; feature scaling; cross-validation
- **Training Progress** — live modal with per-model elapsed time and estimated time
- **Results** — metrics, feature importance charts, confusion matrix
- **Compare** — side-by-side bar chart across all trained models
- **Download** — PDF report, CSV/XLSX dataset, `meta.json`, and a ZIP of all `.pkl` model files

---

## Project Structure

```
MLInsights/
├── backend/               # FastAPI application
│   ├── main.py            # App entry point + CORS
│   ├── requirements.txt
│   ├── routers/           # upload, insights, cleaning, models, training, report
│   ├── models/            # ML model definitions (30+ models)
│   └── utils/             # session_store, data_utils, ml_models, report_gen
│
├── frontend/              # Next.js application
│   ├── app/               # App Router pages + API routes
│   ├── components/        # React components
│   └── lib/               # api.ts, utils.ts
│
├── render.yaml            # Render deployment config
└── .gitignore
```

---

## Local Development

### Prerequisites

- Python 3.12+
- Node.js 18+

### Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and edit if needed
cp .env.example .env

# Start the server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

# Start the dev server
npm run dev
```

Open `http://localhost:3000`.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable               | Description                              | Example                                    |
|------------------------|------------------------------------------|--------------------------------------------|
| `NEXT_PUBLIC_API_URL`  | URL of the FastAPI backend               | `https://mlinsights-api.onrender.com`      |

### Backend (`backend/.env`)

| Variable          | Description                                       | Example                                                   |
|-------------------|---------------------------------------------------|-----------------------------------------------------------|
| `ALLOWED_ORIGINS` | Comma-separated allowed CORS origins              | `https://mlinsights.vercel.app,http://localhost:3000`     |
| `UPLOAD_DIR`      | Directory for session data (default: `backend/uploads/`) | `/tmp/mlinsights_uploads`                        |

---

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo.
3. Render will automatically pick up `render.yaml` with these settings:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. In the Render dashboard **Environment** tab, set:
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app,http://localhost:3000`
   - `UPLOAD_DIR` is pre-set to `/tmp/mlinsights_uploads` in `render.yaml`
5. Copy the deployed URL (e.g. `https://mlinsights-api.onrender.com`).

> **Note:** Render's free tier has an ephemeral filesystem. Sessions survive restarts within the same instance but are lost on new deploys. This is expected behavior for a demo/prototype.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo.
2. Set **Root Directory** to `frontend`.
3. Add an environment variable:
   - `NEXT_PUBLIC_API_URL` = `https://mlinsights-api.onrender.com` (your Render URL)
4. Deploy. Vercel will run `npm run build` automatically.
5. Go back to Render and update `ALLOWED_ORIGINS` to include your Vercel URL.

---

## Supported Models

### Classification (14+)
Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, HistGradient Boosting, XGBoost, LightGBM, CatBoost, SVM (RBF/Linear), KNN, Naive Bayes, LDA, MLP, Stacking, AdaBoost, Bagging, Extra Trees

### Regression (14+)
Linear, Ridge, Lasso, Elastic Net, Bayesian Ridge, Huber, Decision Tree, Random Forest, Gradient Boosting, XGBoost, LightGBM, CatBoost, SVR, KNN, MLP, Stacking

### Clustering (6+)
KMeans, DBSCAN, Agglomerative, Spectral, BIRCH, OPTICS

---

## License

MIT
