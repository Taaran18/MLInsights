# MLInsights

Upload any CSV or Excel dataset, explore it, clean it, train 30+ machine learning models, compare results, and download everything — PDF report, cleaned dataset, session metadata, and trained `.pkl` files. Built with Next.js 14 + Tailwind CSS on the frontend and FastAPI on the backend.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111+-009688?logo=fastapi) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) ![Python](https://img.shields.io/badge/Python-3.11+-yellow?logo=python) ![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5+-F7931E?logo=scikitlearn)

## Features

- **Dataset Insights** — shape, dtypes, describe, correlation heatmap, value counts per column
- **Missing Values** — per-column stats, smart cleaning options (fill mean/median/mode, drop rows/cols, normalize)
- **30+ ML Models** — regression, classification, clustering; auto-recommended based on your dataset
- **Training Progress** — live modal with per-model elapsed time and estimated total time
- **Results** — metrics table, feature importance chart, confusion matrix (classification)
- **Compare** — side-by-side bar chart across all trained models
- **Download** — PDF report, CSV/XLSX dataset, `meta.json` session data, and a ZIP of all `.pkl` model files

### Models Covered

| Task               | Models                                                                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Classification** | Logistic Regression, Decision Tree, Random Forest, Gradient Boosting, HistGradient Boosting, XGBoost, LightGBM, CatBoost, SVM (RBF/Linear), KNN, Naive Bayes, LDA, MLP, Stacking, AdaBoost, Bagging, Extra Trees |
| **Regression**     | Linear, Ridge, Lasso, Elastic Net, Bayesian Ridge, Huber, Decision Tree, Random Forest, Gradient Boosting, XGBoost, LightGBM, CatBoost, SVR, KNN, MLP, Stacking                                                  |
| **Clustering**     | KMeans, DBSCAN, Agglomerative, Spectral, BIRCH, OPTICS                                                                                                                                                           |

## Tech Stack

### Frontend

- [Next.js 14](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) — dark theme
- [Recharts](https://recharts.org/) — charts and heatmaps

### Backend

- [FastAPI](https://fastapi.tiangolo.com/) — modular REST API
- [scikit-learn](https://scikit-learn.org/), [XGBoost](https://xgboost.readthedocs.io/), [LightGBM](https://lightgbm.readthedocs.io/), [CatBoost](https://catboost.ai/) — ML engines
- [pandas](https://pandas.pydata.org/) + [pyarrow](https://arrow.apache.org/docs/python/) — data I/O and session storage
- [ReportLab](https://www.reportlab.com/) — PDF generation
- [Uvicorn](https://www.uvicorn.org/) — ASGI server

## Project Structure

```text
MLInsights/
├── backend/
│   ├── main.py                 # FastAPI app entry point + CORS
│   ├── requirements.txt
│   ├── runtime.txt             # Python version pin for Render
│   ├── render.yaml             # Render deployment config
│   ├── routers/
│   │   ├── upload.py           # Dataset upload + session creation
│   │   ├── insights.py         # Shape, dtypes, describe, correlations
│   │   ├── cleaning.py         # Missing value analysis + cleaning
│   │   ├── models.py           # Model recommendations
│   │   ├── training.py         # Model training + .pkl export
│   │   └── report.py           # PDF, CSV/XLSX, meta.json, models ZIP
│   └── utils/
│       ├── session_store.py    # File-based session management
│       ├── data_utils.py       # Pandas helpers
│       ├── ml_models.py        # Model registry (30+ models)
│       └── report_gen.py       # PDF builder
└── frontend/
    ├── app/
    │   ├── api/download/       # Next.js proxy route (fixes cross-origin filename)
    │   └── page.tsx            # Main single-page app
    ├── components/
    │   ├── FileUpload.tsx
    │   ├── DataInsights.tsx
    │   ├── DataCleaning.tsx
    │   ├── ModelSelection.tsx  # Model cards + training modal
    │   ├── TrainingResults.tsx
    │   └── ReportDownload.tsx  # Download cards (PDF, dataset, JSON, ZIP)
    └── lib/
        ├── api.ts              # API fetch helpers
        └── utils.ts
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt

# Copy env file and edit if needed
cp .env.example .env

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

App runs at `http://localhost:3000`.

## API Overview

```text
POST /api/upload/                        Upload CSV or XLSX → returns session_id
GET  /api/insights/{session_id}/summary  Shape, dtypes, describe, value counts
GET  /api/insights/{session_id}/corr     Correlation matrix
GET  /api/cleaning/{session_id}/missing  Missing value stats per column
POST /api/cleaning/{session_id}/clean    Apply cleaning strategy
GET  /api/models/{session_id}/recommend  Auto-recommended models for the dataset
POST /api/training/{session_id}/train    Train selected models → returns results
GET  /api/report/{session_id}/pdf        Download PDF report
GET  /api/report/{session_id}/dataset    Download cleaned CSV or XLSX
GET  /api/report/{session_id}/meta       Download meta.json session data
GET  /api/report/{session_id}/models_zip Download ZIP of all .pkl model files
```

## Environment Variables

**Frontend** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Backend** — create `backend/.env`:

```env
ALLOWED_ORIGINS=http://localhost:3000
UPLOAD_DIR=backend/uploads
```

## License

MIT
