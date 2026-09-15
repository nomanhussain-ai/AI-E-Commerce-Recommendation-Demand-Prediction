# Testing Strategy

Stack: Next.js 16 · core-api (FastAPI) · ml-service (FastAPI) · worker (Arq) · PostgreSQL · Meilisearch · Redis.

---

## 1. Test pyramid per component

| Component | Unit | Integration | E2E |
|---|---|---|---|
| **web** | component tests (Vitest + Testing Library), Server Action logic | Route Handlers against a mocked core-api (MSW) | Playwright against the full compose stack |
| **core-api** | services & repositories (pytest), pure functions | routers against real PG + Redis + Meilisearch via **testcontainers** | covered by `tests/e2e` |
| **ml-service** | feature engineering, scoring, forecaster math (pytest) | endpoints against a seeded PG | model quality = offline eval notebooks (not CI-gated) |
| **worker** | task functions (pytest) | outbox → Meilisearch sync against testcontainers | — |

---

## 2. core-api

- `pytest` + `pytest-asyncio` + `httpx.AsyncClient`.
- `conftest.py`: spin PostgreSQL + Redis + Meilisearch containers once per session; `alembic upgrade head`; per-test transaction rollback for isolation.
- Fixtures: `client`, `admin_client`, `seed_products`, `seed_user`.
- Must-cover cases:
  - auth: register → login → `/auth/me` → refresh rotation → logout revokes refresh token; expired access → 401.
  - RBAC: customer hitting `/admin/*` → 403.
  - orders: concurrent purchase of the last unit → exactly one 201, one `409 OUT_OF_STOCK`; stock + events consistent.
  - **search fallback**: with Meilisearch container paused, `/products/search` still 200 with `engine: "pg-fts"`.
  - **reco fallback chain**: ml-service unreachable → response still non-empty (`reason` in `category`/`popular`).
  - events: `/events` never blocks / never 5xx on bad optional fields.
  - validation: bad payloads → 422 with the error envelope.

## 3. ml-service

- No data leakage: assert lag features are strictly shifted; time-based split helper tested.
- Forecaster: known synthetic series → error within tolerance; stock-out days are masked.
- Recommender: popularity baseline deterministic; hybrid score monotonic in each component; already-purchased items penalised out.
- `/embed` returns unit-norm 384-d vectors.

## 4. web (Next.js)

- DAL: `requireAdmin()` redirects a customer; `getCurrentUser()` returns null with no cookie.
- `/api/auth/login` sets `HttpOnly; Secure; SameSite=Lax` cookies and does **not** leak tokens in the JSON body.
- `<SearchBox>` debounces and hits `/api/search/suggest`; `<Facets>` reflects URL params.
- Server Components render with mocked core-api responses (no network in unit runs).

## 5. E2E (Playwright, `tests/e2e`)

1. **Customer happy path:** register → browse category → search "gaminng laptp" (typo) → open PDP → add to cart → checkout (COD) → see order in history.
2. **Recommendations:** after viewing 3 laptops, home shows a "Because you viewed…" rail.
3. **Admin forecast:** login as admin → Forecast page → a product shows a 30-day chart, a risk badge, and a reorder suggestion.
4. **Resilience:** stop `ml-service` → storefront still loads with fallback rails; stop `meilisearch` → search still returns results.

## 6. Non-functional

| Check | Target | Tool |
|---|---|---|
| search latency | p95 < 150 ms (suggest < 50 ms) | k6 / Locust against `/products/search` |
| recommendation API | p95 < 400 ms with cache warm | k6 |
| 100 concurrent users | no 5xx, error rate < 1% | k6 |
| search relevance | see [`11-search-design.md`](11-search-design.md) §7 (P@10, NDCG, typo-success) | eval notebook + qrels |
| a11y | no critical axe violations on key pages | `@axe-core/playwright` |

## 7. CI gates

| Workflow | Runs | Blocks merge on |
|---|---|---|
| `web-ci` | lint, typecheck, `vitest`, `next build` | any failure |
| `core-api-ci` | `ruff`, `mypy`, `pytest` (testcontainers), `alembic check` (no pending autogen) | any failure |
| `ml-ci` | `ruff`, `pytest`, notebook smoke (`nbmake` on a tiny fixture) | unit failure |
| `e2e-ci` | `docker compose up` + Playwright | happy-path + resilience specs |

Coverage target: core-api services/repos ≥ 80%, ml-service feature/scoring modules ≥ 80%. Postman collection (`tests/postman`) kept in sync for manual/demo checks and report screenshots.
