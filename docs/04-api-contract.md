# API Contract

**core-api:** FastAPI, base path `/api/v1`, OpenAPI at `/docs` · JSON only · auth via httpOnly cookie (`access_token`) forwarded as `Authorization: Bearer` by Next.js, or sent directly in dev.
**ml-service:** internal only, base path `/`, protected by `X-Internal-Key`.

---

## 1. Conventions

- **Success:** `2xx` with the resource, or `{ "data": …, "meta": { pagination } }` for lists.
- **Error envelope:**
  ```json
  { "error": { "code": "OUT_OF_STOCK", "message": "…", "details": {} }, "request_id": "req_…" }
  ```
- **Codes:** `VALIDATION_ERROR` 422 · `UNAUTHENTICATED` 401 · `FORBIDDEN` 403 · `NOT_FOUND` 404 · `CONFLICT` 409 · `OUT_OF_STOCK` 409 · `RATE_LIMITED` 429 · `UPSTREAM_UNAVAILABLE` 503.
- **Pagination:** `?page=1&page_size=24` (max 100) → `meta.pagination { page, page_size, total, total_pages }`.
- **IDs:** ULID strings. **Money:** integer minor units + `currency`.
- **Idempotency:** `POST /orders` accepts `Idempotency-Key` header.
- **RBAC:** `customer` default; `/admin/**` requires `admin`.

---

## 2. Auth (`/api/v1/auth`)

| Method | Path | Body | Response | Notes |
|---|---|---|---|---|
| POST | `/auth/register` | `{email, password, full_name}` | `201 {user}` | password ≥ 8, argon2id |
| POST | `/auth/login` | `{email, password}` | `200 {user, access_token, refresh_token}` | Next Route Handler moves tokens into cookies |
| POST | `/auth/refresh` | `{refresh_token}` (or cookie) | `200 {access_token, refresh_token}` | rotates refresh token, revokes old |
| POST | `/auth/logout` | – | `204` | revokes refresh token |
| GET | `/auth/me` | – | `200 {user}` | used by Next DAL in Server Components |
| POST | `/auth/forgot-password` | `{email}` | `202` | emails a reset token (dev: logs it) |
| POST | `/auth/reset-password` | `{token, password}` | `204` | |

Access token TTL 15 min, refresh 7 days. Rate limit: 10/min/IP on `login`, `register`, `forgot-password`.

---

## 3. Catalog

| Method | Path | Query / Body | Response |
|---|---|---|---|
| GET | `/categories` | – | `200 [{id, name, slug, parent_id, path}]` (tree) |
| GET | `/products` | `category, brand, price_min, price_max, rating_min, in_stock, sort(price|-price|rating|-created|popularity), page, page_size` | `200 {data:[ProductCard], meta}` |
| GET | `/products/{idOrSlug}` | – | `200 {...Product, images[], attributes, category}` |
| GET | `/products/{id}/similar` | `limit=10` | `200 [ProductCard]` — from `product_similarity` (content + cf_item), pgvector fallback |
| GET | `/products/{id}/frequently-bought` | `limit=6` | `200 [ProductCard]` — `also_bought` |

### 3.1 Search (full spec: [`11-search-design.md`](11-search-design.md))

| Method | Path | Query / Body | Response |
|---|---|---|---|
| GET | `/products/search` | `q, category, brand, price_min, price_max, rating_min, in_stock, sort, page, page_size` | `200 {data:[ProductCard], facets:{brand[],category[],price_buckets[],rating[]}, meta, engine}` |
| GET | `/products/suggest` | `q` | `200 {suggestions:[string], products:[{id,title,slug,image,price}]}` |
| POST | `/search/semantic` | `{query, filters?}` | `200 {data:[ProductCard], engine:"hybrid"}` |

`engine` ∈ `"meili" | "hybrid" | "pg-fts"` (tells the client which path served the request; `pg-fts` = degraded mode).

---

## 4. Cart / wishlist / orders (auth or `anon_id`)

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/cart` | – | `200 {id, items:[{product, quantity, unit_price, line_total}], subtotal}` |
| POST | `/cart/items` | `{product_id, quantity}` | `200 {cart}` |
| PATCH | `/cart/items/{product_id}` | `{quantity}` | `200 {cart}` (quantity 0 = remove) |
| DELETE | `/cart/items/{product_id}` | – | `200 {cart}` |
| POST | `/cart/merge` | `{anon_id}` | `200 {cart}` (called on login) |
| GET | `/wishlist` | – | `200 [ProductCard]` |
| POST | `/wishlist` | `{product_id}` | `204` |
| DELETE | `/wishlist/{product_id}` | – | `204` |
| POST | `/orders` | `{address_id | address, payment_method}` + `Idempotency-Key` | `201 {order}` — ACID: stock check + decrement + events. `409 OUT_OF_STOCK {details:{product_id, available}}` |
| GET | `/orders` | `page, page_size` | `200 {data:[OrderSummary], meta}` |
| GET | `/orders/{id}` | – | `200 {order, items[]}` |
| POST | `/orders/{id}/cancel` | – | `200 {order}` (only while `pending`/`paid`) |

---

## 5. Events (behaviour tracking — M1/M3)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/events` | `{event_type, session_id, product_id?, category_id?, search_query?, dwell_ms?, quantity?, price?, device?, source?}` | `202` |
| POST | `/events/bulk` | `{events:[…]}` (≤ 50) | `202` |

Fire-and-forget; never blocks UX. `event_type` ∈ `view|click|search|add_to_cart|remove_from_cart|wishlist|purchase|rate`.

---

## 6. Recommendations (M1)

| Method | Path | Query | Response |
|---|---|---|---|
| GET | `/recommendations/me` | `limit=12` | `200 {items:[{product, score, reason}], strategy, model_version}` — cache → precomputed → ml-service → category → trending |
| GET | `/recommendations/trending` | `limit=12, category?` | `200 {items:[ProductCard]}` |
| GET | `/recommendations/because-you-viewed/{product_id}` | `limit=10` | `200 {items, anchor_product}` |
| POST | `/recommendations/feedback` | `{product_id, action:"click"|"dismiss"}` | `202` (online eval signal) |

`reason` ∈ `similar_users | content | popular | category | also_bought`.

---

## 7. Assistant (M4 — optional)

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/assistant/query` | `{message, session_id}` | `200 {reply, products:[ProductCard], filters_used}` |
| GET | `/assistant/history` | `session_id` | `200 [{role, content, ts}]` |

Flow: LLM → structured `{category, tags, max_price}` → `/search/semantic` → LLM explains top 3. Guardrails: only catalog products; price/stock from DB. Rate limit 20/min/user.

---

## 8. Admin (`/api/v1/admin`, role `admin`)

### 8.1 Catalog & inventory
| Method | Path | Notes |
|---|---|---|
| POST/PUT/PATCH/DELETE | `/admin/products[/{id}]` | CRUD; write triggers `search_outbox` |
| POST | `/admin/products/import` | CSV bulk upload |
| GET | `/admin/inventory` | stock levels + coverage + risk |
| POST | `/admin/inventory/{product_id}/restock` | `{delta, reason}` → `inventory_ledger` |

### 8.2 Analytics (M3)
| Method | Path | Response |
|---|---|---|
| GET | `/admin/analytics/overview` | revenue, orders, AOV, conversion, active users, reco CTR |
| GET | `/admin/analytics/sales?granularity=day\|week&from=&to=` | time series |
| GET | `/admin/analytics/funnel` | view → cart → purchase with drop-off % |
| GET | `/admin/analytics/segments` | segment sizes + definitions |
| GET | `/admin/analytics/top-products?metric=revenue\|units&limit=10` | |
| GET | `/admin/analytics/search` | top queries, zero-result queries, CTR, latency |

### 8.3 Forecasting (M2)
| Method | Path | Response |
|---|---|---|
| GET | `/admin/forecast?product_id=&days=30` | `{series:[{date,yhat,lower,upper}], stock, coverage, risk, reorder_qty, metrics:{mae,rmse,mape}, model_version}` |
| GET | `/admin/forecast/alerts` | open `stock_alerts` ordered by risk |
| GET | `/admin/forecast/accuracy` | backtest table (actual vs predicted) |

### 8.4 ML ops
| Method | Path | Notes |
|---|---|---|
| POST | `/admin/ml/retrain` | `{target:"recommender"\|"forecaster"}` → enqueues Arq job → `job_runs` |
| GET | `/admin/ml/models` | `model_registry` list |
| POST | `/admin/ml/models/{id}/activate` | switch active version |
| POST | `/admin/search/reindex` | full Meilisearch rebuild |
| GET/PUT | `/admin/search/synonyms` | edit synonym map |

---

## 9. Internal — core-api → ml-service

`Base` internal URL, header `X-Internal-Key: <shared secret>`, timeout 1200 ms, ret/fallback in `MLClient`.

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/health` | – | `{status, models:{recommender, forecaster, embedder}}` |
| POST | `/recommend` | `{user_id, limit, context?}` | `{items:[{product_id, score, reason}], model_version}` |
| POST | `/similar-items` | `{product_id, limit}` | `{items:[{product_id, score, kind}]}` |
| POST | `/forecast` | `{product_id, days}` | `{series:[{date, yhat, lower, upper}], total_predicted, model_version, metrics}` |
| POST | `/embed` | `{texts:[string]}` | `{vectors:[[float; 384]], model_version}` |
| POST | `/train/{recommender\|forecast}` | `{}` | `202 {job_id}` |

---

## 10. Next.js Route Handlers (BFF — `app/api`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/login` | proxy `core-api /auth/login`, set httpOnly cookies, return `{user}` |
| POST | `/api/auth/logout` | proxy logout, clear cookies |
| POST | `/api/auth/refresh` | rotate cookies (also called from a fetch interceptor) |
| GET | `/api/search/suggest` | proxy Meilisearch with the scoped **search key** (no core-api hop, < 50 ms) |

Everything else is called from Server Components / Server Actions directly against `core-api` with the cookie's access token.

---

## 11. Shared shapes

```ts
type ProductCard = {
  id: string; slug: string; title: string; brand?: string;
  price: number; discount_price?: number; currency: string;
  image?: string; rating_avg: number; rating_count: number; in_stock: boolean;
};

type User = { id: string; email: string; full_name: string; role: "customer" | "admin" };

type Paginated<T> = { data: T[]; meta: { pagination: { page: number; page_size: number; total: number; total_pages: number } } };
```

OpenAPI is the source of truth; a typed client (`openapi-typescript` / `openapi-fetch`) is generated into `packages/api-client` for the Next.js app.
