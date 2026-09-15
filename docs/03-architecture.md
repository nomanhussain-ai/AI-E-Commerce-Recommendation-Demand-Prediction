# System Architecture

**Project:** AI-Powered E-Commerce Recommendation & Demand Prediction System
**Revision:** v2.0 — stack migrated from *React+Vite / NestJS / MongoDB* to **Next.js / FastAPI / PostgreSQL**
**Status:** design baseline (approved for build)

---

## 1. Why the stack changed (v1 → v2)

| Concern | v1 (old) | v2 (new) | Reason for change |
|---|---|---|---|
| Web app | React 18 + Vite SPA | **Next.js 16 App Router (React 19)** | Server Components = SSR + streaming for catalog/PDP → SEO + fast first paint; one framework for UI + BFF; route handlers handle the auth cookie safely |
| Business API | NestJS (TypeScript) | **FastAPI `core-api` (Python 3.12)** | Whole backend is now one language (Python) → shared models/validation with ML; Pydantic v2 + async SQLAlchemy; less context-switching for a small team |
| ML service | Python FastAPI | **Python FastAPI `ml-service`** (unchanged role) | kept as a separate microservice — still the correct call for the FYP report |
| Database | MongoDB + Mongoose | **PostgreSQL 17 + SQLModel/SQLAlchemy 2.0 + Alembic** | typed relational schema, ACID orders, `pgvector` for recommendation/semantic embeddings, native full-text search as the search baseline, one engine for OLTP + vectors |
| Search | Mongo text index | **Meilisearch** (primary) + Postgres FTS (baseline) | dedicated typo-tolerant instant search + facets + hybrid (keyword+vector). See [`11-search-design.md`](11-search-design.md) |
| Cache / jobs | (optional Redis) | **Redis** + **Arq** worker | recommendation cache, rate-limit, and background jobs (search sync, nightly aggregates, retrain triggers) |

The **4 AI modules (M1 recommendation, M2 forecasting, M3 behaviour analytics, M4 assistant) are unchanged.** Only the delivery stack moved.

---

## 2. Context diagram (C4 level 1)

```
                          ┌─────────────┐        ┌─────────────┐
        Customer ───────▶ │             │        │             │ ◀─────── Admin
        (browser)         │  Next.js 16 │        │  Next.js 16 │        (browser)
                          │  storefront │        │  admin app  │
                          └──────┬──────┘        └──────┬──────┘
                                 │  HTTPS (RSC fetch + Route Handlers + Server Actions)
                                 ▼
                        ┌──────────────────────┐
                        │   core-api (FastAPI) │   auth · users · catalog · cart ·
                        │   REST + OpenAPI     │   orders · events · search · analytics ·
                        └───┬───────┬───────┬──┘   admin · assistant-orchestration
             SQLAlchemy(async)     │       │  HTTP (internal, API-key)
                        ▼          │       ▼
              ┌──────────────┐     │   ┌──────────────────────┐
              │ PostgreSQL 17│     │   │  ml-service (FastAPI) │  /recommend /similar
              │ + pgvector   │◀────┼───│  inference + training │  /forecast  /health
              │ + pg_trgm    │     │   └──────────┬───────────┘  models/*.joblib
              └──────┬───────┘     │              │ nightly batch: read sales/events,
                     │             │              │ write recommendations/forecasts/embeddings
        outbox / CDC │             ▼
                     ▼      ┌─────────────┐   ┌──────────────┐
              ┌────────────┐│    Redis    │   │ Object store │
              │ Meilisearch ││ cache+queue │   │ (S3 / MinIO) │  product images,
              │  products   ││             │   │              │  model artifacts
              └────────────┘└─────────────┘   └──────────────┘
```

*Storefront and admin can be one Next.js app with route groups `(shop)` and `(admin)`, or two deployments sharing a UI package — see [`project-file-structure.md`](../guide/architure-solution/project-file-structure.md).*

---

## 3. Components and responsibilities

### 3.1 Next.js 16 web app (frontend + BFF)

| Layer | What it does | Notes |
|---|---|---|
| **Server Components** (default) | fetch catalog, PDP, home, recommendation rails, admin pages directly from `core-api` server-side | no client JS for data; `fetch()` with `next: { revalidate }` for ISR-style caching |
| **Client Components** (`"use client"`) | cart drawer, filter sidebar, search-as-you-type box, assistant chat, admin charts (Recharts) | use **TanStack Query** only inside these islands |
| **Route Handlers** (`app/api/**`) | thin BFF: `/api/auth/login|logout|refresh` proxy to core-api and set/clear **httpOnly cookies**; `/api/search/suggest` proxy to Meilisearch with the public search key | never expose the ML service or the Meilisearch admin key to the browser |
| **Server Actions** | mutations: add-to-cart, place-order, submit-review, save-profile-interests | call core-api with the access token from the cookie; `revalidatePath()` after |
| **Data Access Layer** `lib/dal.ts` | `getCurrentUser()` / `requireUser()` / `requireAdmin()` — verifies the session **inside Server Components / Actions**, not in middleware | follows Next.js 2025 auth guidance (middleware = optimistic redirect only) |
| **Middleware** | optimistic redirect of clearly-unauthenticated users away from `/account` and `/admin` | not the security boundary |

**Rendering choice per route**

| Route | Strategy |
|---|---|
| `/` home | SSR + streamed recommendation rails (`<Suspense>`) |
| `/c/[category]`, `/search` | SSR, results from `core-api` (which queries Meilisearch); filters update via client-side URL params |
| `/p/[slug]` PDP | SSR + `generateStaticParams` for top-N products, ISR revalidate 300s; "Similar" / "Also bought" streamed |
| `/cart`, `/checkout` | client-heavy, dynamic |
| `/admin/**` | SSR, `requireAdmin()` in every page, charts are client islands |

### 3.2 `core-api` (FastAPI) — the business API

Single OpenAPI-documented REST service. Async top-to-bottom (asyncpg driver, async routes, async httpx to ml-service).

**Internal layering** (per module):

```
router/      HTTP only — parse request, call service, shape response (Pydantic schemas)
service/     business logic — orchestrates repositories, ml-client, search-client, cache
repository/  DB access only — SQLAlchemy queries, no business rules
models/      SQLModel table classes
schemas/     Pydantic request/response DTOs
```

**Modules:** `auth`, `users`, `categories`, `products`, `search`, `cart`, `wishlist`, `orders`, `events`, `recommendations`, `forecast`, `analytics`, `inventory`, `notifications`, `admin`, `assistant`.

**Cross-cutting (`core/`, `common/`):** settings (pydantic-settings), DB session lifespan, JWT + password hashing (argon2), RBAC dependency, request-id + structured logging middleware, uniform error envelope, rate limiter (Redis), `MLClient` (httpx, timeout + fallback), `SearchClient` (Meilisearch SDK), `CacheService` (Redis).

### 3.3 `ml-service` (FastAPI) — models only

| Endpoint (internal) | Purpose |
|---|---|
| `GET /health` | loaded model versions |
| `POST /recommend` | `{userId, limit, context}` → ranked items + reasons |
| `POST /similar-items` | `{productId, limit}` → content/CF neighbours |
| `POST /forecast` | `{productId, days}` → per-day predictions + interval |
| `POST /embed` | `{texts[]}` → vectors (used to backfill `product.embedding`) |
| `POST /train/{recommender|forecast}` | admin-triggered retrain (async job) |

- Models loaded once at startup via `joblib.load()` (never per-request).
- Training scripts (`training/*.py`) run as **Arq jobs / cron**, read Postgres, write artifacts to object storage + upsert `recommendations`, `forecasts`, `product_similarity`, `user_profiles`, and `product.embedding`.
- Never called directly by the browser; only `core-api` calls it, over the internal network with `X-Internal-Key`.

### 3.4 PostgreSQL 17

- Extensions: `pgvector` (embeddings + ANN/HNSW), `pg_trgm` + `unaccent` (fuzzy FTS baseline), optionally `pg_search` (ParadeDB BM25) for the search bake-off.
- One logical DB, two roles: `app_rw` (core-api), `ml_ro` (ml-service read) + a dedicated `ml_rw` for the batch upserts.
- Migrations: **Alembic**, one head, autogenerate + hand-review.
- Full schema: [`05-database-design.md`](05-database-design.md).

### 3.5 Meilisearch

- Indexes: `products` (search + facets + hybrid), `suggestions` (query autocomplete).
- Kept in sync from Postgres — see §5.
- Keys: **admin key** (core-api / worker only), **search key** scoped to `products` (Next.js Route Handler / client).
- Design + evaluation: [`11-search-design.md`](11-search-design.md).

### 3.6 Redis

- `cache:reco:{userId}` (TTL 6–12h), `cache:trending` (TTL 1h), `cache:pdp:{id}` fragments.
- Rate-limit buckets for `/auth/*` and `/assistant/*`.
- **Arq** queue: `sync_product_to_search`, `rebuild_search_index`, `nightly_sales_rollup`, `nightly_user_profiles`, `trigger_retrain`.

---

## 4. Request flows

### 4.1 Login (cookie session)

```
Browser → POST /api/auth/login (Next Route Handler)
         → POST /auth/login (core-api)  → verify argon2 hash → issue access(15m)+refresh(7d) JWT
         ← {access, refresh, user}
Route Handler sets:  Set-Cookie: access_token=…  HttpOnly; Secure; SameSite=Lax; Path=/
                     Set-Cookie: refresh_token=… HttpOnly; Secure; SameSite=Lax; Path=/api/auth
         ← {user}   (no tokens in the JS-visible body)
Later:   Server Component → lib/dal.getCurrentUser() → reads access_token cookie → GET /auth/me
         on 401 → Server Action / Route Handler calls /auth/refresh → rotate cookies
```

### 4.2 Product search (customer types "gaminng laptp")

```
Search box (client) ──debounced──▶ GET /api/search/suggest?q=  (Next Route Handler, search key)
                                   ▶ Meilisearch /indexes/products/search
                                   ◀ typo-corrected hits (< 50 ms)
Enter / submit ──▶ /search?q=gaming+laptop&brand=Asus&price=50000..150000
   Server Component ▶ GET /products/search (core-api)
        core-api ▶ Meilisearch multi-search (hits + facetDistribution)
                 ▶ Postgres: hydrate live price/stock for the hit IDs
                 ▶ (optional) re-rank top 50 with personalization signal
        ◀ {items, facets, total, page}
   SSR HTML streamed to browser; facet clicks = client URL param updates → re-fetch
```

Fallback: if Meilisearch is unreachable, `core-api` runs the **Postgres FTS** query path (`websearch_to_tsquery` + `pg_trgm`) so search never 500s.

### 4.3 Personalized recommendations (home rail)

```
Home Server Component ▶ GET /recommendations/me?limit=12 (core-api, user from cookie)
   core-api: Redis cache:reco:{userId}?  → hit: return
             miss → GET precomputed row from `recommendations` table (nightly ML)
                  → still empty (cold start) → ml-service POST /recommend (800–1200ms timeout)
                       → timeout/empty → category-affinity best-sellers
                            → still empty → global trending
   cache the result (TTL 6h) → return {items:[{productId,score,reason}]}
   hydrate product cards from Postgres (price, stock, image)
```

Fallback chain is mandatory: **personalized → category → trending. Never an empty rail.**

### 4.4 Demand forecast (admin)

```
Admin Forecast page ▶ GET /admin/forecast?productId=&days=30 (requireAdmin)
   core-api reads `forecasts` table (written by nightly ml batch)
            + computes coverage = stock / predictedTotal → risk band + reorder qty
   ◀ {series:[{date,yhat,lower,upper}], stock, coverage, risk, reorderQty, metrics}
Nightly: Arq → ml-service /forecast for every active product → upsert `forecasts`
```

---

## 5. Keeping PostgreSQL ↔ Meilisearch in sync

Two documented options; **Option A is the FYP default**, Option B is the "production-grade" upgrade discussed in the report.

### Option A — Transactional outbox + worker (default)

1. On product create/update/delete, `core-api` writes the row **and** an `search_outbox` row in the same transaction.
2. An Arq worker polls `search_outbox` (every 2s) → pushes add/update/delete to Meilisearch → marks rows done.
3. Nightly `rebuild_search_index` job does a full reindex as a safety net.

*Pros:* no extra infra, no dual-write inconsistency, easy to explain. *Cons:* ~seconds of lag (fine for a catalog).

### Option B — Change Data Capture (logical replication)

- Postgres `wal_level = logical` → **meilisync** / **meilibridge** streams INSERT/UPDATE/DELETE from the WAL to Meilisearch in near-real-time.
- Removes app-level sync code entirely; sub-second freshness.
- Document as "future work / production hardening" and, if time allows, demo it.

Embeddings for hybrid search: the nightly ML `embed` job writes `product.embedding` (pgvector) → same sync path pushes a `_vectors` field to Meilisearch.

---

## 6. Non-functional requirements

| Attribute | Target | How |
|---|---|---|
| Search latency | p95 < 150 ms (suggest < 50 ms) | Meilisearch in-memory index; hydrate only hit IDs from PG |
| Recommendation API | p95 < 400 ms | Redis cache + nightly precompute; ML call is the cold path only |
| Availability of storefront | works with ml-service **down** | fallback chains (§4.2, §4.3) |
| Auth | tokens never in `localStorage` | httpOnly/Secure/SameSite cookies; DAL verification in RSC |
| Data integrity | orders are ACID | Postgres transaction: create order + decrement stock + write events |
| Scalability (demo scale) | ~2k products, ~1–2 yr synthetic events, 100 concurrent users | single node each; indexes per `05-database-design.md` |
| Observability | request-id tracing, structured JSON logs, `/health` per service | logging middleware; `scripts/health-check` |
| Security | CORS locked to web origin; ml-service private; rate-limited auth/assistant; secrets via env only | see [`08-deployment.md`](08-deployment.md) |

---

## 7. Environments

| Env | Web | core-api | ml-service | Postgres | Meilisearch | Redis |
|---|---|---|---|---|---|---|
| Local | `next dev` :3000 | uvicorn :8000 | uvicorn :8001 | docker :5432 | docker :7700 | docker :6379 |
| Staging/Prod | Vercel (or Node container) | container (Render/Railway/Fly) | container | Neon / Supabase / RDS | Meilisearch Cloud or container + volume | Upstash / container |

`docker-compose.yml` runs the full stack locally with one command; see [`08-deployment.md`](08-deployment.md).

---

## 8. Technology decision log (for the report)

| # | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D1 | Next.js App Router + Server Components | React+Vite SPA; Remix | SSR/SEO for catalog, streaming rails, built-in BFF for the auth cookie, one deploy target |
| D2 | Two Python services (core-api + ml-service) | single FastAPI monolith; Next BFF + ML only | isolates ML CPU/memory from web load, independent retrain/deploy, "microservice architecture" narrative, still one language |
| D3 | PostgreSQL over MongoDB | keep Mongo; MySQL | typed schema + ACID orders + `pgvector` + native FTS baseline in one engine |
| D4 | SQLModel + async SQLAlchemy 2.0 + Alembic | raw SQLAlchemy; Tortoise; Prisma-py | Pydantic-native models shared with FastAPI, mature migrations |
| D5 | Meilisearch as primary search | Typesense; OpenSearch; Postgres-only; ParadeDB pg_search | best instant-search UX + facets + hybrid with least ops; see [`11-search-design.md`](11-search-design.md) for the full bake-off |
| D6 | httpOnly cookie sessions, DAL-verified | localStorage JWT; NextAuth/Auth.js | XSS-safe, works with Server Components, matches current Next.js security guidance |
| D7 | Outbox sync (CDC as upgrade) | dual-write; CDC-only from day 1 | outbox is simple + consistent + explainable for a student project |
| D8 | Redis + Arq for cache & jobs | Celery; APScheduler in-process | async-native, tiny, enough for nightly batch + index sync |

---

## 9. Related documents

- [`04-api-contract.md`](04-api-contract.md) — REST + internal endpoints
- [`05-database-design.md`](05-database-design.md) — PostgreSQL schema, indexes, pgvector
- [`06-ml-design.md`](06-ml-design.md) — recommendation + forecasting methodology
- [`11-search-design.md`](11-search-design.md) — **researched search solution + engine comparison**
- [`08-deployment.md`](08-deployment.md) — containers, envs, CI/CD
- [`../guide/architure-solution/project-file-structure.md`](../guide/architure-solution/project-file-structure.md) — monorepo layout
