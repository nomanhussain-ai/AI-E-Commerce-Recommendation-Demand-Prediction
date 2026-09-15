# Project File Structure — `ecommerce-ai-platform` (v2)

Monorepo layout for the **Next.js 16 + FastAPI ×2 + PostgreSQL + Meilisearch** stack.
Supersedes the v1 React+Vite / NestJS / MongoDB layout. See [`../../docs/03-architecture.md`](../../docs/03-architecture.md) for the rationale.

**Workspaces:** pnpm workspace for JS (`web`, `packages/*`), `uv`/`pip` per Python service. Root `Makefile` / `Taskfile` drives everything.

```
ecommerce-ai-platform/
├── README.md
├── LICENSE
├── .editorconfig  .prettierrc  .prettierignore  .gitattributes  .gitignore
├── .env.example                     # every service's vars, documented
├── pnpm-workspace.yaml              # web + packages/*
├── package.json                     # root scripts (turbo/concurrently)
├── Taskfile.yml                     # task dev | task seed | task test | task migrate
├── docker-compose.yml               # web + core-api + ml-service + worker + postgres + meilisearch + redis + minio
├── docker-compose.prod.yml
│
├── .github/workflows/
│   ├── web-ci.yml                   # lint + typecheck + build + Playwright
│   ├── core-api-ci.yml              # ruff + mypy + pytest + alembic check
│   ├── ml-ci.yml                    # ruff + pytest + notebook smoke
│   ├── e2e-ci.yml                   # docker-compose up + integration suite
│   └── cd.yml                       # build images, deploy staging/prod
│
├── docs/                            # FYP documentation (see docs/README below)
│   ├── 01-proposal.md   02-srs.md   03-architecture.md   04-api-contract.md
│   ├── 05-database-design.md   06-ml-design.md   07-evaluation-results.md
│   ├── 08-deployment.md   09-testing.md   10-user-manual.md
│   ├── 11-search-design.md          # researched search solution
│   ├── diagrams/                    # system-architecture, ERD, sequence, deployment (drawio + png)
│   └── screenshots/{customer,admin}/
│
├── web/                             # ── Next.js 16 (App Router) — storefront + admin ──
│   ├── package.json  tsconfig.json  next.config.ts  postcss.config.mjs
│   ├── tailwind.config.ts  components.json          # shadcn/ui
│   ├── .env.development  .env.production
│   ├── middleware.ts                # optimistic auth redirect only (NOT the security boundary)
│   ├── public/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx  globals.css  error.tsx  not-found.tsx
│       │   ├── (shop)/                              # customer route group
│       │   │   ├── layout.tsx                       # storefront chrome (Navbar, Footer)
│       │   │   ├── page.tsx                         # Home: hero + streamed reco rails
│       │   │   ├── c/[category]/page.tsx            # category listing + facets (SSR)
│       │   │   ├── search/page.tsx                  # search results (SSR, calls core-api)
│       │   │   ├── p/[slug]/page.tsx                # PDP (SSR + ISR) + Similar / Also-bought
│       │   │   ├── cart/page.tsx                    # client-heavy
│       │   │   ├── checkout/page.tsx
│       │   │   ├── orders/[[...id]]/page.tsx
│       │   │   ├── wishlist/page.tsx
│       │   │   ├── account/page.tsx                 # requireUser() in the page
│       │   │   └── assistant/page.tsx               # M4 chat
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx  register/page.tsx  forgot-password/page.tsx
│       │   ├── (admin)/admin/
│       │   │   ├── layout.tsx                       # requireAdmin() + AdminShell
│       │   │   ├── page.tsx                         # overview KPIs
│       │   │   ├── products/[[...id]]/page.tsx      # CRUD
│       │   │   ├── orders/page.tsx
│       │   │   ├── analytics/page.tsx               # funnel, segments, sales (client charts)
│       │   │   ├── forecast/page.tsx                # M2 graph + risk table + reorder
│       │   │   ├── inventory/page.tsx
│       │   │   ├── search/page.tsx                  # search analytics + reindex + synonyms
│       │   │   └── ml/page.tsx                      # model registry + retrain
│       │   └── api/                                 # ── BFF Route Handlers ──
│       │       ├── auth/login/route.ts              # proxy core-api, set httpOnly cookies
│       │       ├── auth/logout/route.ts   auth/refresh/route.ts
│       │       └── search/suggest/route.ts          # proxy Meilisearch w/ scoped search key
│       ├── components/
│       │   ├── ui/                                  # shadcn primitives
│       │   ├── product/  ProductCard  ProductGrid  ProductCarousel  PriceTag  RatingStars
│       │   ├── search/   SearchBox (client, debounced)  Facets (client, URL-param driven)  ActiveFilters
│       │   ├── reco/     RecoRail  RecoReasonBadge  SimilarProducts
│       │   ├── cart/     CartDrawer  CartLineItem  MiniCart
│       │   ├── admin/    StatCard  SalesChart  FunnelChart  SegmentChart  ForecastChart  StockRiskBadge  DataTable
│       │   └── layout/   Navbar  Footer  AdminShell  Breadcrumbs
│       ├── lib/
│       │   ├── api.ts                               # server-side fetch wrapper → core-api (adds Bearer from cookie)
│       │   ├── dal.ts                               # getCurrentUser / requireUser / requireAdmin (Server Components)
│       │   ├── session.ts                           # cookie read/write helpers
│       │   ├── query-client.ts                      # TanStack Query (client islands)
│       │   ├── track.ts                             # POST /events helper (fire-and-forget)
│       │   └── format.ts                            # currency / date
│       ├── actions/                                 # Server Actions
│       │   ├── cart.ts  order.ts  wishlist.ts  review.ts  profile.ts  auth.ts
│       ├── hooks/        useCart  useDebouncedSearch  useFacets
│       └── types/        index.ts (re-export from packages/api-client)
│
├── services/
│   ├── core-api/                    # ── FastAPI business API ──
│   │   ├── pyproject.toml  uv.lock  ruff.toml  mypy.ini
│   │   ├── .env.example  Dockerfile  README.md
│   │   ├── alembic.ini
│   │   ├── migrations/              # Alembic; 0001 = extensions + enums + core tables
│   │   │   ├── env.py  versions/
│   │   ├── app/
│   │   │   ├── main.py              # FastAPI app, lifespan (DB pool, Redis, Meili bootstrap), routers, middleware
│   │   │   ├── api/
│   │   │   │   └── v1/router.py     # include_router for every module
│   │   │   ├── core/
│   │   │   │   ├── config.py        # pydantic-settings
│   │   │   │   ├── db.py            # async engine + session dependency
│   │   │   │   ├── redis.py  security.py (argon2 + JWT)  rate_limit.py
│   │   │   │   ├── logging.py       # structlog, request-id middleware
│   │   │   │   ├── errors.py        # exception handlers → error envelope
│   │   │   │   └── deps.py          # get_current_user, require_role, pagination
│   │   │   ├── clients/
│   │   │   │   ├── ml_client.py     # httpx, X-Internal-Key, timeout + fallback
│   │   │   │   └── search_client.py # Meilisearch SDK (admin key), index settings-as-code
│   │   │   ├── models/              # SQLModel tables (one file per aggregate)
│   │   │   │   ├── user.py  product.py  category.py  cart.py  order.py  review.py
│   │   │   │   ├── event.py  recommendation.py  forecast.py  inventory.py  search.py  ops.py
│   │   │   ├── schemas/             # Pydantic DTOs mirroring models/
│   │   │   ├── repositories/        # DB queries only
│   │   │   │   ├── product_repo.py  order_repo.py  event_repo.py  …
│   │   │   ├── modules/             # router + service per feature
│   │   │   │   ├── auth/            router.py  service.py
│   │   │   │   ├── users/  categories/  products/  search/  cart/  wishlist/
│   │   │   │   ├── orders/  events/  recommendations/  forecast/  analytics/
│   │   │   │   ├── inventory/  notifications/  admin/  assistant/
│   │   │   ├── services/            # cross-module: cache_service.py  outbox_service.py
│   │   │   └── config/search/       synonyms.json  stopwords.json
│   │   ├── scripts/                 seed_demo_users.py  create_admin.py
│   │   └── tests/                   conftest.py  unit/  integration/ (testcontainers: pg + redis + meili)
│   │
│   ├── ml-service/                  # ── FastAPI models ──
│   │   ├── pyproject.toml  uv.lock  Dockerfile  README.md  .env.example
│   │   ├── app/
│   │   │   ├── main.py              # lifespan: joblib.load models; X-Internal-Key dep
│   │   │   ├── routers/             health  recommend  similar  forecast  embed  train
│   │   │   ├── schemas/             recommendation  forecast  embedding  training
│   │   │   ├── services/            recommender  content_based  collaborative  hybrid
│   │   │   │                        forecaster  embedder  model_loader
│   │   │   ├── features/            recommendation_features  forecasting_features  feature_utils
│   │   │   ├── data/                db.py (async, ml_ro)  repositories.py
│   │   │   ├── core/                config  logging  storage (s3/minio)
│   │   │   └── models/{recommender,forecasting,embedder}/.gitkeep
│   │   ├── training/               train_content  train_collaborative  train_hybrid
│   │   │                           train_forecast  build_embeddings  evaluate_models
│   │   ├── notebooks/              01_eda … 07_forecasting_lightgbm  08_search_evaluation
│   │   └── tests/                  test_recommender  test_forecaster  test_features
│   │
│   └── worker/                      # ── Arq background jobs ──
│       ├── pyproject.toml  Dockerfile
│       └── app/
│           ├── main.py             # WorkerSettings, cron schedule
│           └── tasks/
│               ├── search_sync.py          # drain search_outbox → Meilisearch; rebuild_search_index
│               ├── nightly_sales_rollup.py # order_items + events → sales_daily
│               ├── nightly_user_profiles.py# affinities, segments, taste_vector
│               ├── nightly_recommendations.py # call ml-service, upsert recommendations
│               ├── nightly_forecasts.py    # call ml-service, upsert forecasts + stock_alerts
│               ├── refresh_popularity.py
│               └── trigger_retrain.py
│
├── packages/                        # shared JS
│   ├── api-client/                  # generated from core-api OpenAPI (openapi-typescript + openapi-fetch)
│   ├── ui/                          # (optional) shared React components if storefront/admin split
│   └── eslint-config/  tsconfig/
│
├── data/
│   ├── README.md                    # datasets, licensing, layout
│   ├── raw/{retailrocket,online-retail-ii,olist}/.gitkeep
│   ├── processed/{products,events,sales,features}/.gitkeep
│   ├── eval/search_qrels.csv        # labelled queries for the search bake-off
│   └── seed/                        # PostgreSQL seeders (SQLAlchemy)
│       ├── 01_load_categories_products.py
│       ├── 02_load_users.py
│       ├── 03_load_events.py
│       ├── 04_build_sales_daily.py
│       ├── 05_synthetic_generator.py
│       ├── 06_bootstrap_embeddings.py
│       └── 07_index_search.py
│
├── deployment/
│   ├── README.md
│   ├── docker/  web.Dockerfile  core-api.Dockerfile  ml.Dockerfile  worker.Dockerfile
│   ├── postgres/  init.sql          # CREATE EXTENSION vector, pg_trgm, unaccent, citext
│   ├── meilisearch/  settings.products.json
│   ├── nginx/  default.conf         # reverse proxy (compose prod)
│   ├── production/  *.env.example
│   └── monitoring/  health-check.sh  backup.sh
│
├── scripts/
│   ├── setup-dev.ps1  setup-dev.sh
│   ├── dev.ps1  dev.sh              # web + core-api + ml + worker + infra
│   ├── seed-all.ps1  seed-all.sh
│   ├── migrate.sh                   # alembic upgrade head
│   └── health-check.ps1
│
└── tests/
    ├── e2e/                         # Playwright: signup→browse→search→cart→order; admin forecast
    ├── integration/                 # cross-service (pytest + httpx): auth flow, reco fallback, search fallback
    └── postman/                     # ecommerce-api collection + local/prod environments
```

## `docs/` — keep updated from day 1

| File | Content | Primary source |
|---|---|---|
| 01-proposal.md | title, problem, 4 objectives, scope | setup guide §1 |
| 02-srs.md | functional + non-functional requirements, use cases | §1, §6.1 |
| 03-architecture.md | components, flows, decision log | **written** |
| 04-api-contract.md | REST + internal + BFF endpoints | **written** |
| 05-database-design.md | PostgreSQL schema, indexes, pgvector | **written** |
| 06-ml-design.md | recommendation + forecasting methodology | **written** + setup guide §9–14 |
| 07-evaluation-results.md | metric tables + plots | filled during build |
| 08-deployment.md | containers, envs, CI/CD | **written** |
| 09-testing.md | test strategy per layer | to write |
| 10-user-manual.md | customer + admin walkthrough | to write |
| 11-search-design.md | search engine research + design + eval | **written** |

## Scope note (carried from v1)

`reviews` are in; real payment gateway, real-time streaming (Kafka), multi-language/currency, mobile app, delivery tracking are **out** — state this in the proposal.
