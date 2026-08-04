# Vista Nova — Fee Management System

An education-academy fee management portal with two roles: **Coordinator** (manages students, batches, and fee collection) and **Student** (views fee history and receipts).

- `frontend/` — Angular + Angular Material SPA
- `backend/` — FastAPI + SQLAlchemy + PostgreSQL API


## Local development

**Database**

```
docker compose up -d
```

**Backend**

```
cd backend
python -m venv .venv
./.venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

**Frontend**

```
cd frontend
npm install
npm start
```

App: http://localhost:4200

Seeded accounts (from `python -m scripts.seed_data`):
- Coordinator: `admin@vistanova.edu` / `Coordinator123!`
- Student: `VN-2026-001` / `Student123!`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) — Angular on Vercel, FastAPI on a long-lived host
(Render/Railway/Fly.io), hosted Postgres (Neon/Vercel Postgres/etc.).
