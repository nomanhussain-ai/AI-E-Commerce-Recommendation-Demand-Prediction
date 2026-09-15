# core-api

FastAPI business API — auth, catalog, cart, orders, analytics, admin.
Async top to bottom (asyncpg · async SQLAlchemy 2.0 / SQLModel · Alembic).

## Layout

Layered layout per the [2026 production-ready FastAPI structure guide](https://dev.to/datanestdigital/production-ready-fastapi-project-structure-2026-guide-b1g):
`api` handlers stay thin and call `services`; `services` hold business logic; `repositories` do DB access only.

```
app/
  main.py              FastAPI app factory — lifespan, middleware, router include
  config.py            Settings (pydantic-settings)
  database.py          Async engine + session dependency
  dependencies.py      Shared FastAPI dependencies (SessionDep, repo providers)
  exceptions.py        Domain errors + error-envelope handlers
  middleware.py        Custom ASGI middleware (request-id / log context)
  api/
    router.py          Root router — aggregates every API version
    v1/router.py       v1 router — include_router for every module
    v1/<feature>.py    Route handlers only, one file per feature
  core/                Cross-cutting: security · logging · ids · redis · rate_limit
  models/              SQLModel tables (one file per aggregate)
  schemas/             Pydantic request/response DTOs
  services/            Business logic, orchestration — testable without HTTP
  repositories/        DB access only (base.py = generic CRUD)
  clients/             Outbound HTTP clients for downstream services
migrations/            Alembic (single head; 0001 = extensions + identity)
tests/                 pytest + httpx
```

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/health` | liveness + DB check |
| POST | `/api/v1/auth/register` | → `{ user, access_token, refresh_token }` |
| POST | `/api/v1/auth/login` | email + password → token pair |
| POST | `/api/v1/auth/refresh` | rotates the refresh token (one-time use) |
| POST | `/api/v1/auth/logout` | revokes a refresh token |
| GET | `/api/v1/auth/me` | requires `Authorization: Bearer <access_token>` |
| POST | `/api/v1/auth/forgot-password` | always 200; returns `debug_reset_token` when `DEBUG=true` |
| POST | `/api/v1/auth/reset-password` | consumes the token, revokes all sessions |

Access token TTL 15 min, refresh 7 days (argon2id hashing, HS256 JWT).

## Configuration

The DB connection string is **built in [`app/config.py`](app/config.py)** from keyword
values — never pasted whole into an env file. Environments are named profiles:

| `APP_ENV` (top of `app/config.py`) | Reads | For |
| --- | --- | --- |
| `"local"` *(default)* | `.env` + `.env.local` | Postgres on your machine |
| `"dev"` | `.env` + `.env.dev` | shared dev server |

`.env` holds values common to all environments; `.env.<APP_ENV>` holds the `DB_*`
keywords for that one (and wins on a conflict). **To switch:** change the `APP_ENV`
line in `app/config.py` (or set the `APP_ENV` env var).

```powershell
copy .env.example        .env
copy .env.local.example  .env.local     # edit DB_PASSWORD etc.
# copy .env.dev.example  .env.dev       # when you need the dev server
```

`DB_*` → assembled as `${DB_DRIVER}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`.
There are **no DB defaults in `config.py`** — if a `DB_*` value is missing the app fails
at startup with a message naming what to set. `DB_NAME` is the PostgreSQL database name
(a plain identifier like `ecommerce`), not the project title.
(A full `DATABASE_URL` env var still overrides everything — the test-suite uses that for SQLite.)

## Local run

```powershell
cd services\core-api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
copy .env.local.example .env.local
```

### Cloudinary image uploads

Create a Cloudinary account, open the product environment credentials in the Cloudinary
console, and add these values to `.env` or `.env.local`:

```text
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

The frontend uploads images through the authenticated `POST /api/v1/media/upload` endpoint.
Product uploads require an admin token; profile uploads require any signed-in token. Only
the Cloudinary `public_id` is saved in the existing image fields. API responses turn that
key into a secure Cloudinary URL, so image bytes are never stored in PostgreSQL.

**Database — pick one:**

*PostgreSQL (native install on this machine):*
```powershell
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

# 1. create the role + database (asks for the 'postgres' password you set at install)
& $psql -U postgres -f scripts\create_db.sql

# 2. put the same password in .env.local  (DB_PASSWORD=app if you kept the script default)

# 3. create the tables
python -m alembic upgrade head
```
`scripts\create_db.sql` makes role `app` / password `app` / db `ecommerce` to match
`.env.local.example`. pgvector isn't required yet; the migration skips it if absent.

*No PostgreSQL — SQLite fallback:* put one line in `.env`
```
DATABASE_URL=sqlite+aiosqlite:///./dev.db
```
No `alembic` step — tables are auto-created on startup.

**Then start the server:**
```powershell
python -m uvicorn app.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs  · ReDoc: http://localhost:8000/redoc
- In Swagger, call `/auth/register` or `/auth/login`, copy `access_token`, click **Authorize**,
  paste it, then the padlocked endpoints (e.g. `/auth/me`) work.
- Health: http://localhost:8000/api/v1/health

### Tests

```bash
python -m pytest          # runs fully in-process on SQLite, no DB/Redis needed
```

## Migrations

```bash
python -m alembic revision --autogenerate -m "add products"   # then hand-review
python -m alembic upgrade head
python -m alembic downgrade -1
```

With the SQLite fallback there are no migrations — `init_models()` creates the schema from
the SQLModel classes on startup. PostgreSQL always goes through Alembic.
