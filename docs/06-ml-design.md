# ML Design — Recommendation + Forecasting

**Service:** `ml-service` (FastAPI, Python 3.12) · **Data source:** PostgreSQL (`ml_ro`), artifacts in object storage, outputs upserted via `ml_rw`.
This revises the v1 ML plan for the PostgreSQL + pgvector stack. The methodology (baseline → advanced, temporal evaluation) is unchanged from `../guide/ecommerce-ai-fyp-setup-guide.md` §9–14; that guide stays the long-form reference.

---

## 1. Problems

| Module | Formulation | Output |
|---|---|---|
| M1 Recommendation | top-N ranking over the catalog per user | `recommendations.items`, `product_similarity` |
| M2 Forecasting | per-product daily demand, 30-day horizon, time-series regression | `forecasts.series` |
| M3 Behaviour analytics | unsupervised segmentation + funnel aggregation | `user_profiles.segment`, admin analytics |
| M4 Assistant | NL query → structured filter → semantic retrieval → explanation | via `/search/semantic` |

---

## 2. M1 — Recommendation

### 2.1 Levels (build in order)

| Level | Method | Serves | Week |
|---|---|---|---|
| L0 | Popularity score `f(purchase_count, view_count, rating, recency)` | baseline, cold start | 4 |
| L1 | **Content-based** — TF-IDF(title+brand+category+tags+desc) + normalised numeric attrs → `products.embedding` (also from a sentence-transformer, 384-d); cosine → `product_similarity(kind='content')` | "Similar products", new products, session-based | 7 |
| L2 | **Collaborative filtering** — implicit ALS on the user×item weight matrix; item-item cosine → `product_similarity(kind='cf_item')` ("also bought") | users with history | 8 |
| L3 | **Hybrid + re-rank** — the contribution | everyone | 9 |

Interaction weights (from `user_events`, time-decayed): `search 1 · click 2 · view 3 (+2 if dwell>30s) · wishlist 5 · add_to_cart 8 · purchase 15`, `w_final = w · exp(-0.05 · days_ago)`.

### 2.2 Candidate generation (L3)

For a user, union of:
- ALS top-100,
- neighbours of recently-interacted items from `product_similarity`,
- **pgvector ANN**: `SELECT id FROM products WHERE is_active ORDER BY embedding <=> :taste_vector LIMIT 100` (`taste_vector` = decayed mean of interacted `products.embedding`),
- category-affinity best-sellers,
- global trending (guarantees non-empty).

### 2.3 Re-ranking

```
score = 0.40·CF_norm + 0.25·Content_norm + 0.20·CategoryAffinity + 0.10·Popularity + 0.05·Recency
        − penalty(already_purchased) − penalty(out_of_stock) + boost(price_in_user_range)
```

Starting weights above → grid-search tuned; report a weight-sensitivity table. Diversity: MMR or "max 3 per category". Persist top-30 to `recommendations` nightly; attach `reason` = the dominant component.

### 2.4 Cold start

| Case | Strategy |
|---|---|
| new user, 0 events | trending + category best-sellers; onboarding asks 3 interests → seeds `category_affinity` |
| new user, 1–3 views | content-based / pgvector ANN from the viewed items (session recommendation, real-time) |
| new product | content similarity + "new arrivals" boost |
| anonymous | `anon_id` cookie session; merge on login |

### 2.5 Serving

| Task | Cadence | Path |
|---|---|---|
| ALS + hybrid precompute | nightly (Arq/cron) | write `recommendations` |
| `product_similarity` | on product change + nightly | write table |
| embeddings backfill | nightly for new/changed products | `ml-service /embed` → `products.embedding` → search sync |
| session recommendation | real-time | `core-api` → `ml-service /recommend` with `context.recent_product_ids` (800–1200 ms timeout, fallback) |

---

## 3. M2 — Demand forecasting

### 3.1 Levels

| Level | Method | Week |
|---|---|---|
| L0 | naive (last week avg), moving average (7/14/28), seasonal naive | 10 |
| L1 | SARIMA (`statsmodels`) for long-history products; Prophet with custom PK holidays / Ramzan | 11 |
| L2 | **LightGBM global model** (one model, all products) — recommended final | 11–12 |

### 3.2 Features (from `sales_daily`)

| Group | Features |
|---|---|
| Lags | `units_lag_{1,7,14,28}` |
| Rolling | `roll_mean_{7,28}`, `roll_std_7`, `roll_max_7` |
| Calendar | `dayofweek, weekofyear, month, is_weekend, is_holiday, days_to_holiday` |
| Price | `avg_price, discount_pct, price_vs_28d_avg` |
| Promo | `promo_flag, promo_intensity` |
| Product | `category_id, brand, price_band, product_age_days` |
| Behaviour (edge) | `views_lag_7, cart_adds_lag_7` — strong leading signal, project plus-point |

### 3.3 Rules (else results are fake)

1. **Time-based split** (train = first 80% days, test = last 20%), never random.
2. **Rolling-origin CV**, 3–4 folds.
3. **No leakage** — lag features always shifted.
4. **Stock-out censoring** — mask/flag days with `stockout_hours > 0` (sales 0 ≠ demand 0). State this in the report.

### 3.4 Output & risk

Nightly Arq job → `ml-service /forecast` per active product → upsert `forecasts`. `core-api` derives:

```
coverage    = stock / total_predicted_30d
risk        = coverage < 0.7 → HIGH ; 0.7–1.0 → MEDIUM ; > 1.0 → LOW
reorder_qty = total_predicted_30d + z·std_error − stock        (z ≈ 1.65)
```

→ `stock_alerts`, surfaced on the admin Forecast + Inventory pages.

---

## 4. M3 — Behaviour analytics

- **Segments** (KMeans / rules on RFM + intent features from `user_events`): `new`, `window_shopper`, `high_intent`, `loyal`, `at_risk`. Persist `user_profiles.segment`.
- **Funnel**: SQL aggregation over `user_events` — view → click → add_to_cart → purchase with drop-off %.
- **Interest profile**: `category_affinity` / `brand_affinity` (weight scheme §2.1).
- Served by `core-api` `/admin/analytics/*` (mostly SQL, no model call).

---

## 5. M4 — Assistant (optional)

`message` → LLM (function-calling / structured output) → `{category?, tags[], max_price?, min_rating?}` → `core-api /search/semantic` (Meilisearch hybrid, query vector from `/embed`) → LLM writes a 3-product comparison. Guardrails: only real catalog products; price/stock from Postgres. Budget-free fallback: regex/keyword + price extraction ("hybrid NLU").

---

## 6. Evaluation (results chapter)

### Recommendation — temporal split (last 20% time) or leave-one-out

```
Model                    P@10   R@10   NDCG@10   Coverage
Popularity (baseline)    …      …      …         …
Content-based            …      …      …         …
Collaborative (ALS)      …      …      …         …
Hybrid (proposed)        …      …      …         …
```
Metrics: Precision@10, Recall@10, MAP@10, NDCG@10, Hit-Rate@10, Coverage. Objective: ≥ 25% Precision@10 over popularity.

### Forecasting

```
Model                 MAE   RMSE   MAPE   WAPE
Naive (last week)     …     …      …      …
Moving average (7d)   …     …      …      …
SARIMA / Prophet      …     …      …      …
LightGBM (proposed)   …     …      …      …
```
Plus forecast-vs-actual plots + per-category error analysis. Objective: ≥ 30% MAE reduction over naive.

### Search — see [`11-search-design.md`](11-search-design.md) §7 (separate bake-off with its own qrels).

---

## 7. Data & seeding (PostgreSQL)

Seed scripts rewritten for SQLAlchemy (`data/seed/`, see [`05-database-design.md`](05-database-design.md) §8). Public datasets: **RetailRocket** (recommendation), **Online Retail II** (forecasting), Olist (schema/reviews). Synthetic generator: Zipf popularity, funnel probabilities (view 100% → cart ~10% → purchase ~3%), session browsing, seasonality (summer AC/fans, winter jackets, Ramzan food, school bags), weekend + Black-Friday spikes, ±10% noise, 12–24 months.

**Report honesty:** *"Due to cold-start constraints of a new platform, models were trained and evaluated on the public RetailRocket and Online Retail II datasets, with a calibrated synthetic generator used for demo seeding."*

---

## 8. `ml-service` layout

```
ml-service/app/
  main.py                 FastAPI, X-Internal-Key dep, model load on lifespan
  routers/                health · recommend · similar · forecast · embed · train
  schemas/                Pydantic request/response
  services/               recommender · content_based · collaborative · hybrid ·
                          forecaster · embedder · model_loader
  features/               recommendation_features · forecasting_features · feature_utils
  data/                   db.py (async engine, ml_ro) · repositories
  core/                   config · logging · storage (s3/minio)
ml-service/training/      train_content · train_collaborative · train_hybrid ·
                          train_forecast · build_embeddings · evaluate_models
ml-service/notebooks/     01_eda … 07_forecasting_lightgbm · 08_search_evaluation
ml-service/tests/         test_recommender · test_forecaster · test_features
```

Training runs as Arq jobs / cron; writes to `model_registry` + upserts output tables; `core-api` flips the active version via `/admin/ml/models/{id}/activate`.
