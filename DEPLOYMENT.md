# Deploying Vista Nova

Two independent deployments: the Angular frontend on **Vercel**, and the FastAPI backend on a
long-lived host (**Render**, **Railway**, or **Fly.io**). A serverless platform (including Vercel's
own Python functions) won't work for the backend — it runs a daily APScheduler job (sweeping
`PENDING → OVERDUE` fee records) and a pooled async DB connection, both of which need a
persistent process.

## 1. Database

Provision a hosted PostgreSQL instance at [neon.tech](https://neon.tech) — free tier, and
`core/config.py` already normalizes its connection string automatically. (Vercel's own Postgres
product no longer exists standalone — Vercel merged it into Neon in December 2024, so this is the
direct path either way.) Any other Postgres host works too (Supabase, RDS, your backend host's
managed Postgres, etc.). Copy the connection string; you'll need it in the next step.

## 2. Backend (Render / Railway / Fly.io)

Of these three, only **Render** still has a genuine free tier as of this writing — its free web
services spin down after ~15 minutes idle and take about a minute to wake on the next request
(occasionally a bit longer if Neon's database has also gone idle and needs to cold-start). Railway
no longer offers an ongoing free tier (a small one-time trial credit, then paid). Fly.io has no
permanent free allowance either (a short trial, then pay-as-you-go, roughly $2/month for a minimal
always-on instance). For a $0 goal, use Render and accept the spin-down/cold-start tradeoff; if a
few dollars a month is fine, Railway avoids that tradeoff entirely.

1. Deploy the `backend/` directory as a Python service.
   - Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Build command: `pip install -r requirements.txt`
2. Set environment variables from `backend/.env.production.example`:
   - `DATABASE_URL` — the hosted Postgres connection string from step 1
   - `JWT_SECRET_KEY` — generate with `python -c "import secrets; print(secrets.token_urlsafe(48))"`
     (never reuse the local dev `.env`'s secret)
   - `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` — defaults are fine
   - `CORS_ORIGINS` — leave as `["http://localhost:4200"]` for now; update once you have the
     Vercel URL from step 3
   - `EMAIL_BACKEND=smtp`, `EMAIL_FROM_ADDRESS`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USERNAME`/
     `SMTP_PASSWORD`/`SMTP_USE_TLS` — for Gmail, generate a **separate** App Password for
     production at https://myaccount.google.com/apppasswords rather than reusing the local dev
     one, so the two stay independently revocable later
3. Run the initial migration against the production database:
   ```
   alembic upgrade head
   ```
4. Bootstrap the real admin account (this is a fresh production launch — no dev data is being
   migrated over):
   ```
   python -m scripts.create_admin
   ```
   Run this from the host's shell (e.g. Render's "Shell" tab) or from a local machine with
   `DATABASE_URL` temporarily pointed at the production connection string. Log in as this admin
   and immediately complete `/admin/security-questions` — a freshly-created admin has no answers
   configured yet, which blocks their *own* forgot-password recovery flow until that's done.

   `python -m scripts.seed_data` (placeholder coordinator/student accounts) is optional demo data
   only — skip it for a real launch; everything beyond the admin account gets created through the
   live app going forward (signups, coordinator-added students, etc.).
5. Note the deployed backend URL (e.g. `https://vista-nova-api.onrender.com`).

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
- Visit the Vercel URL, confirm the landing page loads and `/login` reaches the backend (the Admin
  tab authenticates against the account bootstrapped in step 2.4 above; Coordinator/Student
  accounts only exist once created through the app)
- Trigger a real email-sending action (e.g. approve a signup request and click "Send email") and
  confirm it actually lands in the recipient's inbox — an `EmailLog` row with `status="SENT"`
  isn't proof on its own, that also happens under `EMAIL_BACKEND=log`
- Confirm the daily overdue-sweep job is running: check the backend host's logs after 00:05 server
  time for the `Marked N fee record(s) overdue` log line (only appears when there's something to
  flip)

## Known limitations / recommended follow-ups

- **Overdue-sweep reliability on Render's free tier**: if the service is spun down at 00:05 server
  time, that day's in-process sweep is simply missed (not queued or retried) — it degrades
  gracefully (fee records just stay `PENDING` a bit longer than their due date, no data loss), but
  isn't fully reliable while asleep. A follow-up worth adding later: a small secret-protected
  endpoint that manually triggers the sweep, pinged once daily by an external scheduler (e.g. a
  GitHub Actions workflow) — the HTTP request itself also wakes a sleeping free instance. Not
  built yet.
- **No rate limiting** on the public unauthenticated endpoints (`POST /api/signup-requests`,
  `POST /api/password-reset-requests`, the admin recovery flow's `/api/auth/admin/forgot-password/*`)
  — flagged during the original admin-module build and deliberately deferred. Worth adding soon
  after a real public launch, e.g. via `slowapi` or a rate limit configured at the hosting
  platform's edge/proxy level.
