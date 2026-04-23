- [Configuration](#configuration)
- [Future Roadmap](#future-roadmap)

---

## Project Overview

CRS is a production-ready, mobile-first AI platform that:

1. Accepts a farmer's location (village name or GPS)
2. Auto-fetches soil and weather data
3. Runs an ML model to predict the best 3 crops
4. Returns ranked results with confidence %, plain-language explanations, and planting/water/fertilizer advice
5. Collects farmer feedback to improve over time
6. Provides an admin dashboard for monitoring usage and feedback

Languages supported: English and Hindi (extensible architecture)

---

## Repo Structure

```
CRS/
├── apps/
│   ├── web/                 # Next.js 15 + Tailwind CSS frontend
│   │   ├── src/app/         # App Router pages
│   │   │   ├── page.tsx     # Landing page
│   │   │   ├── recommend/   # Recommendation flow (village/GPS + results)
│   │   │   └── admin/       # Admin dashboard
│   │   └── src/lib/         # API client, i18n, types
│   │
│   └── api/                 # FastAPI backend
│       ├── app/
│       │   ├── main.py      # App entry point + CORS + startup
│       │   ├── config.py    # Settings (pydantic-settings)
│       │   ├── schemas.py   # Pydantic request/response models
│       │   ├── routers/     # /recommend, /feedback, /admin/*
│       │   ├── services/    # weather, soil, recommendation logic
│       │   ├── ml/          # ML inference wrapper
│       │   └── db/          # SQLAlchemy models + async session
│       └── ml_artifacts/    # Trained model saved here
│
├── ml/
│   ├── crop_model/          # Schema constants
│   ├── scripts/
│   │   ├── train.py         # Model training script
│   │   └── test_inference.py# Quick inference sanity check
│   └── data/                # Place Crop_recommendation.csv here
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Quick Start

> Requires: Node.js 20+, Python 3.11+

### 1. Clone & enter repo

```powershell
cd d:\CRS
```

### 2. Frontend

```powershell
cd apps\web
Copy-Item .env.local.example .env.local
npm install
npm run dev
# Opens at http://localhost:3000
```

### 3. Backend

```powershell
cd d:\CRS\apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
# API at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

Both frontend and backend work out-of-the-box with stub data even without API keys or a trained model.

---

## Training the ML Model

1. Download `Crop_recommendation.csv` from:
   https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset

2. Place it at `ml\data\Crop_recommendation.csv`

3. Run training:

```powershell
cd d:\CRS
pip install -r ml\requirements.txt
python ml\scripts\train.py
```

The model is saved to `apps\api\ml_artifacts\model.joblib`.
Restart the API server — it auto-loads the model on startup.

### Verify inference

```powershell
python ml\scripts\test_inference.py
```

---

## Running with Docker

```powershell
Copy-Item .env.example .env
# Edit .env and set real API keys if desired
docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

---

## API Reference

All endpoints on `http://localhost:8000`.

### POST /recommend

Request body (JSON):

```json
// Option A: village name
{ "village": "Rampur" }

// Option B: GPS
{ "lat": 28.61, "lon": 77.20 }

// Option C: both (GPS takes priority)
{ "village": "Rampur", "lat": 28.61, "lon": 77.20 }
```

Response:

```json
{
  "recommendation_id": "abc123",
  "recommendations": [
    {
      "crop": "Wheat",
      "confidence": 0.82,
      "why": "Suitable for wheat because of cool temperature...",
      "advice": {
        "planting": "October–November",
        "water": "4–6 irrigations...",
        "fertilizer": "120:60:40 NPK..."
      }
    }
  ],
  "note": "Data shown is based on regional averages."
}
```

### POST /feedback

```json
{
  "recommendation_id": "abc123",
  "helpful": true,
  "comment": "Very accurate for my region!"
}
```

### GET /admin/metrics

Header: `X-Admin-Token: <your-token>`

### GET /admin/feedback

Header: `X-Admin-Token: <your-token>`

Full interactive docs at http://localhost:8000/docs

---

## Admin Panel

Open http://localhost:3000/admin in the browser.
Enter the admin token (default: `changeme-admin-token`) to view metrics and feedback.

Change the token in `.env` (ADMIN_TOKEN) before going to production.

---

## Configuration

| File | Variable | Description |
|------|----------|-------------|
| `apps/api/.env` | `ADMIN_TOKEN` | Protects admin endpoints |
| `apps/api/.env` | `OPENWEATHER_API_KEY` | Real weather data (stub when empty) |
| `apps/api/.env` | `SOIL_API_KEY` | Real soil data (stub when empty) |
| `apps/api/.env` | `DATABASE_URL` | SQLite by default; swap for Postgres |
| `apps/api/.env` | `MODEL_ARTIFACT_PATH` | Path to trained model |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_BASE_URL` | API base URL for frontend |

---

## Deploy (GitHub Private Repo + Vercel + Render)

### 1) Push to a private GitHub repo

1. Create a new **Private** repository on GitHub (no README/license).
2. In this folder, run:

```powershell
cd d:\CRS
git add .
git commit -m "Initial CRS app"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2) Deploy API on Render

- In Render: **New +** → **Web Service** → connect your GitHub repo.
- Render YAML is already present at `render.yaml`.
- After deploy, note your API URL, e.g. `https://kisan-sathi-api.onrender.com`.

Required env vars (Render):
- `ADMIN_TOKEN` (generate / keep secret)
- `ALLOWED_ORIGINS` (optional if using `.vercel.app` domains)
  - JSON array example: `["https://your-app.vercel.app","https://yourdomain.com"]`
  - Or comma-separated: `https://your-app.vercel.app, https://yourdomain.com`

### 3) Deploy Web on Vercel

- In Vercel: **New Project** → import the same GitHub repo.
- Either:
  - Use repo root and keep the default config from `vercel.json`, OR
  - Set **Root Directory** to `apps/web` and use default Next.js settings.

Required env vars (Vercel):
- `NEXT_PUBLIC_API_BASE_URL` = your Render API URL (example: `https://kisan-sathi-api.onrender.com`)

### 4) Verify after deploy

- API health: `https://<render-host>/health`
- Web: open Vercel URL → go to `/recommend` and try a village (e.g., Rampur)

---

## Future Roadmap

The architecture is designed to support these extensions:

- **Real soil API** — integrate SoilGrids (ISRIC) or iSDA Africa
- **Real weather API** — set `OPENWEATHER_API_KEY`
- **Plant disease detection** — add `/diagnose` route + image upload
- **IoT sensor integration** — push endpoint for live soil sensors
- **Market price analysis** — additional feature in recommendation scoring
- **Multi-language** — add keys to `src/lib/i18n.ts` (Punjabi, Marathi, Telugu…)
- **Region-wise expansion** — parameterize soil/weather services by region
```powershell
cd d:\CRS\apps\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
# API at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

Both frontend and backend work out-of-the-box with stub data even without API keys or a trained model.

---

## Training the ML Model

1. Download `Crop_recommendation.csv` from:
   https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset

2. Place it at `ml\data\Crop_recommendation.csv`

3. Run training:

```powershell
cd d:\CRS
pip install -r ml\requirements.txt
python ml\scripts\train.py
```

The model is saved to `apps\api\ml_artifacts\model.joblib`.
Restart the API server — it auto-loads the model on startup.

### Verify inference

```powershell
python ml\scripts\test_inference.py
```

---

## Running with Docker

```powershell
Copy-Item .env.example .env
# Edit .env and set real API keys if desired
docker-compose up --build
```

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

---

## API Reference

All endpoints on `http://localhost:8000`.

### POST /recommend

Request body (JSON):

```json
// Option A: village name
{ "village": "Rampur" }

// Option B: GPS
{ "lat": 28.61, "lon": 77.20 }

// Option C: both (GPS takes priority)
{ "village": "Rampur", "lat": 28.61, "lon": 77.20 }
```

Response:

```json
{
  "recommendation_id": "abc123",
  "recommendations": [
    {
      "crop": "Wheat",
      "confidence": 0.82,
      "why": "Suitable for wheat because of cool temperature...",
      "advice": {
        "planting": "October–November",
        "water": "4–6 irrigations...",
        "fertilizer": "120:60:40 NPK..."
      }
    }
  ],
  "note": "Data shown is based on regional averages."
}
```

### POST /feedback

```json
{
  "recommendation_id": "abc123",
  "helpful": true,
  "comment": "Very accurate for my region!"
}
```

### GET /admin/metrics

Header: `X-Admin-Token: <your-token>`

### GET /admin/feedback

Header: `X-Admin-Token: <your-token>`

Full interactive docs at http://localhost:8000/docs

---

## Admin Panel

Open http://localhost:3000/admin in the browser.
Enter the admin token (default: `changeme-admin-token`) to view metrics and feedback.

Change the token in `.env` (ADMIN_TOKEN) before going to production.

---

## Configuration

| File | Variable | Description |
|------|----------|-------------|
| `apps/api/.env` | `ADMIN_TOKEN` | Protects admin endpoints |
| `apps/api/.env` | `OPENWEATHER_API_KEY` | Real weather data (stub when empty) |
| `apps/api/.env` | `SOIL_API_KEY` | Real soil data (stub when empty) |
| `apps/api/.env` | `DATABASE_URL` | SQLite by default; swap for Postgres |
| `apps/api/.env` | `MODEL_ARTIFACT_PATH` | Path to trained model |
| `apps/web/.env.local` | `NEXT_PUBLIC_API_BASE_URL` | API base URL for frontend |

---

## Deploy (GitHub Private Repo + Vercel + Render)

### 1) Push to a private GitHub repo

1. Create a new **Private** repository on GitHub (no README/license).
2. In this folder, run:

```powershell
cd d:\CRS
git add .
git commit -m "Initial CRS app"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2) Deploy API on Render

- In Render: **New +** → **Web Service** → connect your GitHub repo.
- Render YAML is already present at `render.yaml`.
- After deploy, note your API URL, e.g. `https://kisan-sathi-api.onrender.com`.

Required env vars (Render):
- `ADMIN_TOKEN` (generate / keep secret)
- `ALLOWED_ORIGINS` (optional if using `.vercel.app` domains)
  - JSON array example: `["https://your-app.vercel.app","https://yourdomain.com"]`
  - Or comma-separated: `https://your-app.vercel.app, https://yourdomain.com`

### 3) Deploy Web on Vercel

- In Vercel: **New Project** → import the same GitHub repo.
- Either:
  - Use repo root and keep the default config from `vercel.json`, OR
  - Set **Root Directory** to `apps/web` and use default Next.js settings.

Required env vars (Vercel):
- `NEXT_PUBLIC_API_BASE_URL` = your Render API URL (example: `https://kisan-sathi-api.onrender.com`)

### 4) Verify after deploy

- API health: `https://<render-host>/health`
- Web: open Vercel URL → go to `/recommend` and try a village (e.g., Rampur)

---

## Future Roadmap

The architecture is designed to support these extensions:

- **Real soil API** — integrate SoilGrids (ISRIC) or iSDA Africa
- **Real weather API** — set `OPENWEATHER_API_KEY`
- **Plant disease detection** — add `/diagnose` route + image upload
- **IoT sensor integration** — push endpoint for live soil sensors
- **Market price analysis** — additional feature in recommendation scoring
- **Multi-language** — add keys to `src/lib/i18n.ts` (Punjabi, Marathi, Telugu…)
- **Region-wise expansion** — parameterize soil/weather services by region
- **Model retraining pipeline** — scheduled job using stored feedback data
- **Postgres** — change `DATABASE_URL` to `postgresql+asyncpg://…`

---

Built with Next.js 15, FastAPI, scikit-learn, SQLAlchemy, Tailwind CSS.
