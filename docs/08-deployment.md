# Deployment Guide

Stack: **Next.js 16 · core-api (FastAPI) · ml-service (FastAPI) · worker (Arq) · PostgreSQL 17 · Meilisearch · Redis · object storage.**

---

## 1. Environments

| | Local | Staging / Production |
|---|---|---|
| web | `next dev` :3000 | Vercel **or** Node container (Render/Fly) |
| core-api | uvicorn :8000 | container (Render / Railway / Fly.io) |
| ml-service | uvicorn :8001 | container (same, more RAM: models in memory) |
| worker | `arq` process | container (1 replica) |
| PostgreSQL | `pgvector/pgvector:pg17` container | Neon / Supabase / RDS (needs `pgvector`, `pg_trgm`, `unaccent`) |
| Meilisearch | `getmeili/meilisearch:v1.14` container | Meilisearch Cloud **or** container + persistent volume |
| Redis | container | Upstash / managed / container |
| object storage | MinIO container | S3 / R2 / Spaces |

---

## 2. Local — one command

```bash
cp .env.example .env
docker compose up -d postgres redis meilisearch minio   # infra
task migrate                                             # alembic upgrade head  (creates roles + extensions via init.sql)
task seed                                                # datasets → PG → embeddings → Meilisearch index
task dev                                                 # web + core-api + ml-service + worker (hot reload)
```

`deployment/postgres/init.sql` runs on first DB boot: creates extensions and the `ml_ro` / `ml_rw` roles.

---

## 3. Container images

| Image | Dockerfile | Notes |
|---|---|---|
| web | `deployment/docker/web.Dockerfile` | multi-stage: `pnpm build` → `next start` (standalone output) |
| core-api | `deployment/docker/core-api.Dockerfile` | `python:3.12-slim`, `uv sync`, non-root, `uvicorn` (gunicorn+uvicorn workers in prod) |
| ml-service | `deployment/docker/ml.Dockerfile` | same base + build deps for lightgbm/implicit; bake or mount model artifacts |
| worker | `deployment/docker/worker.Dockerfile` | core-api deps + `arq app.main.WorkerSettings` |

`docker-compose.prod.yml` wires these with nginx (`deployment/nginx/default.conf`) as the TLS-terminating reverse proxy when self-hosting the whole stack.

---

## 4. Release flow

1. Alembic migration merged to `develop` → CI runs `alembic upgrade head` against a throwaway PG (testcontainers).
2. `release/vX` → CI builds all images, tags `:vX`, pushes to registry.
3. Deploy order: **migrate DB → core-api → ml-service → worker → web**.
4. Post-deploy: `POST /api/v1/admin/search/reindex` if the product schema changed; `scripts/health-check` must pass.
5. Rollback: redeploy previous image tags; migrations are additive/backwards-compatible (expand-contract).

CI/CD workflows: `.github/workflows/{web,core-api,ml,e2e}-ci.yml` + `cd.yml`.

---

## 5. Configuration & secrets

- All config via env vars (§`.env.example`). No secrets in the repo — `.env` is git-ignored.
- Production must set: `JWT_SECRET`, `SESSION_COOKIE_SECRET`, `MEILI_MASTER_KEY`, `INTERNAL_API_KEY`, DB creds, `COOKIE_SECURE=true`, `CORS_ORIGINS=https://<web-domain>`.
- Meilisearch: after boot, create a **scoped search key** (actions `["search"]`, index `products`) → set as `MEILI_SEARCH_KEY` for web. Master key stays with ops + core-api/worker only.
- ml-service is **not** publicly routable — only reachable from core-api/worker on the internal network, gated by `X-Internal-Key`.

---

## 6. Data & models in production

| Asset | Where | How |
|---|---|---|
| Product images | object storage bucket | uploaded via `/admin/products` |
| Model artifacts (`*.joblib`) | object storage `models/` | written by training jobs; `model_registry` tracks the active version |
| Meilisearch index | its persistent volume | rebuilt from PG any time via `admin/search/reindex` |
| PostgreSQL | managed provider backups + `deployment/monitoring/backup.sh` (nightly `pg_dump` to storage) | |

Search ↔ DB sync in prod: **transactional outbox + worker** (default). Optional upgrade: enable `wal_level=logical` and run **meilisync**/**meilibridge** for CDC (see `11-search-design.md` §4.3).

---

## 7. Scheduled jobs (worker / Arq cron)

| Job | Schedule |
|---|---|
| `search_sync` (drain outbox) | every 2 s |
| `nightly_sales_rollup` | 02:00 |
| `nightly_user_profiles` | 02:15 |
| `nightly_recommendations` | 02:30 |
| `nightly_forecasts` (+ stock alerts) | 02:45 |
| `build_embeddings` (new/changed products) | 03:00 |
| `rebuild_search_index` (safety net) | 03:30 |
| `train_forecast` / `train_recommender` | weekly (Sun 04:00) or on `/admin/ml/retrain` |

Hosted alternative if no always-on worker: Render Cron / GitHub Actions scheduled workflow hitting `/admin/ml/*` and rollup endpoints.

---

## 8. Hardening checklist

- [ ] HTTPS everywhere; `COOKIE_SECURE=true`, `SameSite=Lax`, `HttpOnly`
- [ ] CORS locked to the web origin
- [ ] Rate limiting on `/auth/*` and `/assistant/*` (Redis)
- [ ] ml-service private, `X-Internal-Key` required
- [ ] Meilisearch master key never shipped to the browser; scoped search key only
- [ ] DB least-privilege roles (`app_rw`, `ml_ro`, `ml_rw`)
- [ ] Alembic migrations reviewed, expand-contract
- [ ] `/health` on every service wired to the platform's health checks
- [ ] Structured logs with `request_id`; error tracking (Sentry optional)
- [ ] Nightly PG backup verified by a test restore
- [ ] Seed/demo data loaded before any demo
