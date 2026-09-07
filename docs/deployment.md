# APIx Deployment Guide

APIx consists of two independently-deployed pieces:
1. **FastAPI Backend**: Python REST API serving the index calculations, methodology metadata, and database queries.
2. **React + Vite Frontend**: Modern TypeScript dashboard talking to the backend purely over HTTP via `VITE_API_BASE_URL`.

---

## 🚀 Quick Deployment Guide

### Option A: 1-Click Render Blueprint (Recommended for Full Stack)
1. Push your repository to GitHub.
2. Log into [Render](https://render.com) and click **New +** -> **Blueprint**.
3. Select your repository. Render will automatically read `render.yaml` and configure both the backend service and the frontend static site!
4. Add your `DATABASE_URL` environment variable in the Render dashboard.

---

### Option B: Backend on Render / Railway

#### Backend on Render (Web Service):
1. Create a **New Web Service** pointing to your GitHub repository.
2. **Runtime**: `Python 3`
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
5. **Health Check Path**: `/health`
6. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase or Postgres connection string (e.g. `postgresql://postgres:...@...supabase.com:5432/postgres`)
   - `CORS_ORIGINS`: Comma-separated list of allowed frontend URLs (e.g. `https://apix.vercel.app, https://apix.netlify.app`), or leave unset / `*` during initial testing.
   - `PYTHON_VERSION`: `3.12.8`
7. After the first deployment, run the schema setup in the Render Shell:
   ```bash
   python -m src.db.init_db
   ```
8. Verify health check: `GET https://<your-backend-url>/health` returns `{"status": "ok", "service": "APIx", "version": "0.2.0"}`.

#### Backend on Railway:
1. Click **New Project** -> **Deploy from GitHub repo**.
2. Railway will automatically pick up `railway.toml` / `Procfile`.
3. Set `DATABASE_URL` and `CORS_ORIGINS` in Railway Variables.
4. Verify deployment at `https://<your-railway-domain>/health`.

#### Backend with Docker (Any Cloud: Cloud Run, Fly.io, AWS, Azure, DigitalOcean):
```bash
# Build container image
docker build -t apix-backend .

# Run container locally or in cloud
docker run -p 8000:8000 -e DATABASE_URL="<your-database-url>" -e CORS_ORIGINS="*" apix-backend
```

---

### Option C: Frontend on Vercel / Netlify

#### Frontend on Vercel:
1. Import your GitHub repository in [Vercel](https://vercel.com).
2. **Framework Preset**: `Vite` (auto-detected).
3. **Root Directory**: `.` (or `frontend` — both work seamlessly thanks to root `vercel.json` and `package.json`).
4. **Build Command**: `npm run build`
5. **Output Directory**: `dist` (or `frontend/dist` if building from root).
6. **Environment Variables**:
   - `VITE_API_BASE_URL`: The deployed backend URL (e.g. `https://apix-backend.onrender.com` or `https://apix.up.railway.app`). No trailing slash needed.
7. Click **Deploy**.

#### Frontend on Netlify:
1. Import your GitHub repository in [Netlify](https://netlify.com).
2. Netlify will automatically detect `netlify.toml`.
3. Set `VITE_API_BASE_URL` in **Site Settings** -> **Environment variables**.
4. Click **Deploy Site**.

---

## 🛠️ Verification & Troubleshooting Checklist

| Issue | Cause | Fix |
|---|---|---|
| **Vercel: "No package.json found"** | Vercel attempted to build root without monorepo config | Fixed: Root `package.json` and `vercel.json` now proxy commands automatically to `frontend/`. |
| **Netlify: 404 on page refresh (/routes, /explorer)** | Client-side routing rewrite missing | Fixed: `netlify.toml` and `frontend/public/_redirects` rewrite all paths `/*` to `/index.html`. |
| **Backend: "Invalid value for --port"** | `$PORT` environment variable unset | Fixed: `Procfile` uses `${PORT:-8000}`. |
| **CORS blocked in browser console** | Frontend origin missing from `CORS_ORIGINS` | Set `CORS_ORIGINS` on backend to your frontend URL (e.g. `https://apix.vercel.app`), or `*`. |
| **Database: "relation fare_quotes does not exist"** | Initial database schema not created | Run `python -m src.db.init_db` in the backend console. |
| **Pytest: "No module named src"** | Pytest path resolution | Fixed: `pytest.ini` now automatically adds root to `pythonpath`. |

---

## 💻 Local Development

```bash
# Terminal 1 — Backend
source .venv/bin/activate
uvicorn src.api.main:app --reload

# Terminal 2 — Frontend
npm run dev
# or:
cd frontend && npm run dev
```
