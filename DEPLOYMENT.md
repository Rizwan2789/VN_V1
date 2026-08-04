# Deploying Vista Nova

Two independent deployments: the Angular frontend on **Vercel**, and the FastAPI backend on a
long-lived host (**Render**, **Railway**, or **Fly.io**). A serverless platform (including Vercel's
own Python functions) won't work for the backend — it runs a daily APScheduler job (sweeping
`PENDING → OVERDUE` fee records) and a pooled async DB connection, both of which need a
persistent process.

## 1. Database

Provision a hosted PostgreSQL instance — [Neon](https://neon.tech) or
[Vercel Postgres](https://vercel.com/storage/postgres) are the easiest to pair with Vercel, but any
Postgres host works (Supabase, RDS, your backend host's managed Postgres, etc.). Copy the
connection string; you'll need it in the next step.

## 2. Backend (Render / Railway / Fly.io)

1. Deploy the `backend/` directory as a Python service.
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Build command: `pip install -r requirements.txt`
2. Set environment variables from `backend/.env.production.example`:
   - `DATABASE_URL` — the hosted Postgres connection string from step 1
   - `JWT_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`
   - `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` — defaults are fine
   - `CORS_ORIGINS` — leave as `["http://localhost:4200"]` for now; update once you have the
     Vercel URL from step 3
3. Run the initial migration and seed data against the production database:
   ```
   alembic upgrade head
   python -m scripts.seed_data
   ```
4. Note the deployed backend URL (e.g. `https://vista-nova-api.onrender.com`).

## 3. Frontend (Vercel)

1. Update `frontend/src/environments/environment.ts` — set `apiBaseUrl` to the backend URL from
   step 2.
2. Push to a Git repo connected to Vercel, or run `vercel --prod` from `frontend/`. Vercel reads
   `frontend/vercel.json` automatically (build command + SPA rewrite for Angular routing).
3. Note the deployed frontend URL (e.g. `https://vista-nova.vercel.app`).

## 4. Close the loop

Go back to the backend host and update `CORS_ORIGINS` to include the real Vercel URL from step 3,
then redeploy the backend so it accepts requests from the production frontend.

## Verifying the deployment

- `GET https://<backend-url>/api/health` → `{"status": "ok", ...}`
- Visit the Vercel URL, confirm the landing page loads and `/login` reaches the backend
  (Coordinator and Student tabs both authenticate against the seeded accounts)
- Confirm the daily overdue-sweep job is running: check the backend host's logs after 00:05 server
  time for the `Marked N fee record(s) overdue` log line (only appears when there's something to
  flip)
