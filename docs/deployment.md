# APIx Deployment Guide

Two independently-deployed pieces: the FastAPI backend and the React
frontend. Neither depends on the other at build time -- the frontend talks
to the backend purely over HTTP at runtime via `VITE_API_BASE_URL`.

---

## Backend (FastAPI) — Render or Railway

Both are free-tier friendly and support Python + a `Procfile` out of the box.

1. Push this repo to GitHub (already done).
2. Create a new Web Service on Render (or Railway) pointed at the repo.
3. Build command: `pip install -r requirements.txt`
4. Start command: the `Procfile` at the repo root already defines this —
   `web: uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
5. Environment variables:
   - `DATABASE_URL` — your Supabase/Neon connection string
   - `CORS_ORIGINS` — the deployed frontend's URL (e.g.
     `https://apix.vercel.app`). Comma-separate multiple origins if needed.
     Leaving this unset defaults to `*`, which works but is not recommended
     once the frontend has a real URL.
6. After first deploy, run `python src/db/init_db.py` once (via the
   platform's shell/console) to create the tables if they don't exist yet.
7. Confirm `GET https://<your-backend-url>/health` returns `{"status": "ok", ...}`.

## Frontend (React + Vite) — Vercel or Netlify

Both auto-detect a Vite project and build correctly with zero config beyond
the environment variable below.

1. Import the repo, set the project root to `frontend/`.
2. Build command: `npm run build` (already the default for a Vite project)
3. Output directory: `dist`
4. Environment variable: `VITE_API_BASE_URL` — the deployed backend's URL
   from the step above (e.g. `https://apix-api.onrender.com`), no trailing
   slash.
5. SPA routing (React Router, client-side): both platforms need a rewrite so
   deep links like `/routes` don't 404 on refresh.
   - Vercel: `frontend/vercel.json` (already in the repo) handles this.
   - Netlify: `frontend/public/_redirects` (already in the repo) handles this.
6. Redeploy the backend's `CORS_ORIGINS` to include the frontend's final URL
   once you know it (Vercel/Netlify assign a URL on first deploy).

## Local development

Two terminals, from the repo root:

```bash
# Terminal 1 — backend
source .venv/bin/activate
uvicorn src.api.main:app --reload

# Terminal 2 — frontend
cd frontend
npm run dev
```

Frontend defaults to `http://localhost:8000` for the API if
`VITE_API_BASE_URL` isn't set (see `frontend/.env.example`). Backend defaults
CORS to `*` if `CORS_ORIGINS` isn't set, so the two talk to each other with
no extra config in local dev.
