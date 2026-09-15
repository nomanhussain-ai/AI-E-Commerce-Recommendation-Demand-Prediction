# Database Design — PostgreSQL 17

**Engine:** PostgreSQL 17 · **ORM:** SQLModel + async SQLAlchemy 2.0 (asyncpg) · **Migrations:** Alembic (single head)
**Extensions:** `pgvector`, `pg_trgm`, `unaccent`, `citext`, (optional `pg_search`)
**Replaces:** the MongoDB collection design from the v1 guide. Event streams and daily aggregates map cleanly to partitioned tables.

---

## 1. Conventions

- Primary keys: `id` = `TEXT` ULID (sortable, URL-safe) generated app-side, or `BIGINT GENERATED ALWAYS AS IDENTITY` for high-volume append tables (`user_events`).
- Timestamps: `TIMESTAMPTZ`, `created_at`/`updated_at` default `now()`, `updated_at` maintained by a trigger.
- Money: integer **minor units** (paisa) — `BIGINT`, never float.
- Soft delete: `is_active BOOLEAN` on catalog entities; hard delete elsewhere.
- Enums: Postgres `ENUM` types (`user_role`, `order_status`, `event_type`, `reco_reason`).
- JSON: `JSONB` for flexible attributes only; anything queried/faceted gets promoted to a column.
- All FKs indexed; see §7 for the full index list.

Roles: `app_rw` (core-api), `ml_ro` (ml-service inference reads), `ml_rw` (batch upserts to `recommendations`/`forecasts`/`product_similarity`/`user_profiles`/`products.embedding`).

---

## 2. Entity overview

```
users ──1:1── user_profiles                 categories ──self FK (parent_id)
  │                                              │
  ├─1:N─ addresses                           products ──N:1── categories
  ├─1:N─ carts ──1:N── cart_items ──N:1── products
  ├─1:N─ wishlist_items ──N:1── products
  ├─1:N─ orders ──1:N── order_items ──N:1── products
  ├─1:N─ reviews ──N:1── products
  ├─1:N─ user_events ──N:1?── products
  └─1:1?─ recommendations (precomputed)

products ──1:N── product_images
products ──1:N── inventory_ledger
products ──1:N── sales_daily            (forecasting training data)
products ──1:N── forecasts              (model output)
products ──M:N── product_similarity     (precomputed neighbours)
products ── embedding vector(384)       (content/semantic)

search_outbox      search_events        stock_alerts       notifications
refresh_tokens     model_registry       job_runs
```

---

## 3. Core tables (DDL sketch)

### 3.1 Identity & auth

```sql
CREATE TYPE user_role AS ENUM ('customer', 'admin');

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,               -- argon2id
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'customer',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE refresh_tokens (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,                 -- sha256 of the refresh JWT id
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  line1 TEXT NOT NULL, line2 TEXT, city TEXT NOT NULL,
  region TEXT, postal_code TEXT, country TEXT NOT NULL DEFAULT 'PK',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.2 User profile (nightly compute — M1/M3)

```sql
CREATE TABLE user_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  category_affinity JSONB NOT NULL DEFAULT '{}',   -- {"laptops":0.9,"audio":0.4}
  brand_affinity    JSONB NOT NULL DEFAULT '{}',
  price_min BIGINT, price_max BIGINT, price_avg BIGINT,
  segment TEXT,                                    -- 'high_intent' | 'window_shopper' | 'loyal' | 'at_risk' | 'new'
  taste_vector vector(384),                        -- mean of interacted product embeddings (for ANN reco)
  last_active_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 Catalog

```sql
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  path TEXT[] NOT NULL DEFAULT '{}',               -- ['Electronics','Computers','Laptops']
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL REFERENCES categories(id),
  brand TEXT,
  price BIGINT NOT NULL,                           -- minor units
  discount_price BIGINT,
  currency TEXT NOT NULL DEFAULT 'PKR',
  attributes JSONB NOT NULL DEFAULT '{}',          -- {"ram_gb":16,"cpu":"i7"}
  tags TEXT[] NOT NULL DEFAULT '{}',
  stock INT NOT NULL DEFAULT 0,
  rating_avg NUMERIC(2,1) NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  view_count BIGINT NOT NULL DEFAULT 0,
  purchase_count BIGINT NOT NULL DEFAULT 0,
  popularity REAL NOT NULL DEFAULT 0,              -- normalized, nightly
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- search (see 11-search-design.md)
  search_tsv tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', unaccent(coalesce(title,''))),'A') ||
      setweight(to_tsvector('simple', unaccent(coalesce(brand,''))),'B') ||
      setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(tags,' '),''))),'B') ||
      setweight(to_tsvector('english', coalesce(description,'')),'D')
  ) STORED,
  embedding vector(384)                            -- content/semantic vector
);

CREATE TABLE product_images (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false
);
```

### 3.4 Cart / wishlist

```sql
CREATE TABLE carts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  anon_id TEXT,                                    -- guest cart, merged on login
  status TEXT NOT NULL DEFAULT 'active',           -- 'active' | 'converted' | 'abandoned'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR anon_id IS NOT NULL)
);
CREATE UNIQUE INDEX carts_one_active_per_user ON carts(user_id) WHERE status='active' AND user_id IS NOT NULL;

CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  cart_id TEXT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL,                      -- snapshot at add time
  UNIQUE (cart_id, product_id)
);

CREATE TABLE wishlist_items (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
```

### 3.5 Orders

```sql
CREATE TYPE order_status AS ENUM ('pending','paid','shipped','delivered','cancelled','refunded');

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status order_status NOT NULL DEFAULT 'pending',
  subtotal BIGINT NOT NULL,
  discount_total BIGINT NOT NULL DEFAULT 0,
  shipping_total BIGINT NOT NULL DEFAULT 0,
  grand_total BIGINT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',      -- dummy / COD / sandbox
  shipping_address JSONB NOT NULL,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  title_snapshot TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL,
  line_total BIGINT NOT NULL
);
```

**Order placement is one transaction:** insert `orders` + `order_items`, `UPDATE products SET stock = stock - qty WHERE id=? AND stock >= qty` (row lock), insert `user_events(type='purchase')` per item, mark cart `converted`. Any shortfall → `ROLLBACK` → `409 OUT_OF_STOCK`.

### 3.6 Reviews

```sql
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
```

`rating_avg` / `rating_count` on `products` refreshed by trigger or nightly job.

---

## 4. Behaviour & ML tables

### 4.1 `user_events` — the system's fuel (M1 + M3)

```sql
CREATE TYPE event_type AS ENUM
  ('view','click','search','add_to_cart','remove_from_cart','wishlist','purchase','rate');

CREATE TABLE user_events (
  id           BIGINT GENERATED ALWAYS AS IDENTITY,
  user_id      TEXT REFERENCES users(id) ON DELETE SET NULL,
  anon_id      TEXT,
  session_id   TEXT NOT NULL,
  event_type   event_type NOT NULL,
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  search_query TEXT,
  dwell_ms     INT,
  quantity     INT,
  price        BIGINT,
  device       TEXT,
  source       TEXT,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, ts)
) PARTITION BY RANGE (ts);
-- monthly partitions: user_events_2026_01, … (pg_partman or Alembic-managed)
```

Interest-weight scheme (materialised into `user_profiles.category_affinity` nightly):

```
search 1 · click 2 · view 3 (+2 if dwell>30s) · wishlist 5 · add_to_cart 8 · purchase 15
weight_final = weight * exp(-0.05 * days_ago)
```

### 4.2 `sales_daily` — forecasting training data (M2)

```sql
CREATE TABLE sales_daily (
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  day         DATE NOT NULL,
  units_sold  INT NOT NULL DEFAULT 0,
  revenue     BIGINT NOT NULL DEFAULT 0,
  avg_price   BIGINT,
  discount_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_weekend  BOOLEAN NOT NULL,
  is_holiday  BOOLEAN NOT NULL DEFAULT false,
  promo_flag  BOOLEAN NOT NULL DEFAULT false,
  stockout_hours NUMERIC(4,1) NOT NULL DEFAULT 0,   -- demand censoring
  views       INT NOT NULL DEFAULT 0,               -- behaviour features
  cart_adds   INT NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, day)
);
```

Built nightly by `worker` from `order_items` + `user_events`; backfilled once from the seed datasets.

### 4.3 Model outputs (written by `ml_rw`)

```sql
CREATE TYPE reco_reason AS ENUM ('similar_users','content','popular','category','also_bought');

CREATE TABLE recommendations (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,                 -- [{"product_id":"…","score":0.83,"reason":"similar_users"}]
  strategy TEXT NOT NULL,               -- 'hybrid'
  model_version TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_similarity (
  product_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  similar_id  TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  score       REAL NOT NULL,
  kind        TEXT NOT NULL,            -- 'content' | 'cf_item'
  PRIMARY KEY (product_id, similar_id, kind)
);

CREATE TABLE forecasts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  horizon_days INT NOT NULL DEFAULT 30,
  series JSONB NOT NULL,                -- [{"date":"2026-09-01","yhat":12.4,"lower":8.1,"upper":17.0}]
  total_predicted NUMERIC(10,2) NOT NULL,
  model_version TEXT NOT NULL,
  mae NUMERIC, rmse NUMERIC, mape NUMERIC,
  UNIQUE (product_id, generated_at)
);

CREATE TABLE model_registry (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,                   -- 'recommender' | 'forecaster' | 'embedder'
  version TEXT NOT NULL,
  artifact_uri TEXT NOT NULL,           -- s3://… or file://…
  metrics JSONB NOT NULL DEFAULT '{}',
  trained_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (kind, version)
);
```

### 4.4 Inventory & alerts

```sql
CREATE TABLE inventory_ledger (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta INT NOT NULL,                   -- +restock / -sale / -adjustment
  reason TEXT NOT NULL,
  ref_id TEXT,                          -- order id etc.
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stock_alerts (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  risk TEXT NOT NULL,                   -- 'HIGH' | 'MEDIUM' | 'LOW'
  coverage NUMERIC(5,2) NOT NULL,       -- stock / predicted_30d
  reorder_qty INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,   -- null = admin broadcast
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 4.5 Operations

```sql
CREATE TABLE job_runs (
  id TEXT PRIMARY KEY,
  job TEXT NOT NULL,                    -- 'nightly_sales_rollup' | 'train_forecast' | 'rebuild_search_index' …
  status TEXT NOT NULL,                 -- 'running' | 'ok' | 'failed'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  detail JSONB
);
```

`search_outbox` and `search_events` are defined in [`11-search-design.md`](11-search-design.md) §6.

---

## 5. pgvector usage (M1)

| Vector | Where | Use |
|---|---|---|
| `products.embedding` (384-d) | products | content similarity, semantic search, "similar products" |
| `user_profiles.taste_vector` (384-d) | user_profiles | user→item ANN retrieval: `ORDER BY p.embedding <=> up.taste_vector` |

```sql
CREATE INDEX products_embedding_hnsw
  ON products USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

Recommendation candidate generation blends: ALS collaborative scores + `product_similarity` + pgvector ANN on `taste_vector` + `popularity`. Final re-ranking formula in [`06-ml-design.md`](06-ml-design.md).

---

## 6. Guest → user merge

On login with an `anon_id` cookie: reassign `carts`, `wishlist_items`(dedupe), and `user_events` (`SET user_id = :uid WHERE anon_id = :anon`), then drop the cookie. One transaction.

---

## 7. Index list (do not skip — dashboards depend on these)

```sql
-- catalog / search
CREATE INDEX products_category_price_idx ON products (category_id, price) WHERE is_active;
CREATE INDEX products_brand_idx          ON products (brand) WHERE is_active;
CREATE INDEX products_popularity_idx     ON products (popularity DESC) WHERE is_active;
CREATE INDEX products_search_tsv_gin     ON products USING GIN (search_tsv);
CREATE INDEX products_title_trgm         ON products USING GIN (title gin_trgm_ops);
-- events
CREATE INDEX events_user_ts_idx     ON user_events (user_id, ts DESC);
CREATE INDEX events_product_type_idx ON user_events (product_id, event_type);
CREATE INDEX events_session_idx     ON user_events (session_id, ts);
CREATE INDEX events_search_idx      ON user_events (lower(search_query)) WHERE event_type='search';
-- sales / forecast
CREATE INDEX sales_daily_day_idx    ON sales_daily (day);
CREATE INDEX forecasts_product_idx  ON forecasts (product_id, generated_at DESC);
-- orders
CREATE INDEX orders_user_placed_idx ON orders (user_id, placed_at DESC);
CREATE INDEX order_items_product_idx ON order_items (product_id);
-- misc
CREATE INDEX reviews_product_idx    ON reviews (product_id);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id) WHERE revoked_at IS NULL;
CREATE INDEX stock_alerts_open_idx  ON stock_alerts (product_id) WHERE resolved_at IS NULL;
```

---

## 8. Migration & seeding

- `alembic init`, one head; every schema change = a reviewed migration; enums created in migration `0001`.
- Enable extensions in `0001`: `CREATE EXTENSION IF NOT EXISTS vector, pg_trgm, unaccent, citext;`
- Seed pipeline (`data/seed/`, rewritten for Postgres — see [`06-ml-design.md`](06-ml-design.md) §7):
  1. `01_load_categories_products.py` — dataset → `categories`, `products`, `product_images`
  2. `02_load_users.py` — anonymised users (+ argon2 demo password)
  3. `03_load_events.py` — dataset events → `user_events`
  4. `04_build_sales_daily.py` — transactions → `sales_daily`
  5. `05_synthetic_generator.py` — Zipf popularity, funnel probs, seasonality (Ramzan/summer/school), weekend + promo spikes, ±10% noise; 12–24 months
  6. `06_bootstrap_embeddings.py` — call `ml-service /embed`, fill `products.embedding`
  7. `07_index_search.py` — push all active products to Meilisearch
- ERD image: regenerate `docs/diagrams/database-erd.*` from this schema.

---

## 9. Mapping from the v1 MongoDB design

| v1 Mongo collection | v2 Postgres | Notes |
|---|---|---|
| `users` | `users` + `addresses` | addresses normalised out |
| `products` (embedded attributes) | `products` (JSONB `attributes`) | faceted attrs promoted as needed |
| `categories` | `categories` | `path TEXT[]` instead of denormalised strings |
| `cart`, `wishlist` | `carts`/`cart_items`, `wishlist_items` | proper rows |
| `orders` + embedded `order_items` | `orders` + `order_items` | items normalised (queryable for ML) |
| `user_events` | `user_events` (partitioned) | monthly range partitions |
| `user_profiles` | `user_profiles` | + `taste_vector` |
| `sales_daily` | `sales_daily` | unchanged shape |
| `forecasts` | `forecasts` | `series` as JSONB |
| `recommendations` | `recommendations` (+ `product_similarity`) | split precomputed neighbours |
| `stock_alerts` | `stock_alerts` (+ `inventory_ledger`) | ledger added |
| `contentVector` field | `products.embedding vector(384)` | native pgvector |
