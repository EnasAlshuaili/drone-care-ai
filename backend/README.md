# DroneCare Backend (FastAPI)

Foundation (Phase 1), database & authentication (Phase 2), drone management
(Phase 4), flight & telemetry (Phase 5), and ANN model integration & AI
failure prediction (Phase 6). No maintenance/notification/analytics business
logic yet.

Phase 6 wraps the existing `ann2_model.h5` / `scaler2.pkl` / `encoders.pkl`
(repo root) as an internal prediction service — see `app/services/ml_service.py`
and `app/core/ml_config.py`. Running via Docker requires those three files
to exist at the repo root (they are mounted read-only into the backend
container — see `docker-compose.yml`); running without Docker requires them
one directory above `backend/` (the default `ML_MODEL_PATH` etc. in
`.env.example` already assume this).

## Local run (via Docker, recommended)

```bash
cp .env.example .env   # from the repo root, first time only
docker compose up --build
```

Migrations run automatically on backend startup (see `entrypoint.sh`).
Visit `http://localhost:8000/api/v1/health`.

## Local run (without Docker)

Requires a Python venv with `python3-venv` available and a reachable
PostgreSQL instance matching `DATABASE_URL`.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # first time only
alembic upgrade head
uvicorn app.main:app --reload
```

## Database migrations (Alembic)

```bash
# generate a new migration after changing models under app/models/
alembic revision --autogenerate -m "describe the change"

# apply pending migrations
alembic upgrade head
```

`alembic/env.py` reads `DATABASE_URL` from `app.core.config.Settings` — the
connection string is never duplicated into `alembic.ini`.

## Structure

- `app/main.py` — FastAPI app instance, CORS, router mounting, error handling
- `app/core/config.py` — environment-driven settings (single source of truth)
- `app/core/security.py` — password hashing (bcrypt) and JWT issuance/verification
- `app/core/ml_config.py` — authoritative ordered ML feature schema, categorical encoding catalog, and risk-level thresholds
- `app/db/` — SQLAlchemy engine/session (`session.py`) and declarative base (`base_class.py`, `base.py`)
- `app/models/` — SQLAlchemy models for the 8 documented MVP entities
- `app/schemas/` — Pydantic request/response schemas
- `app/services/` — business logic (`user_service.py`, `auth_service.py`, `authorization.py`, `drone_service.py`, `flight_service.py`, `prediction_service.py`, `ml_service.py`)
- `app/api/deps.py` — shared dependencies (`get_current_user`)
- `app/api/v1/` — versioned API routes (`health.py`, `auth.py`, `drones.py`, `flights.py`, `predictions.py`)
- `alembic/` — migrations; `alembic/versions/` contains the initial schema migration
