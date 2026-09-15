# FYP Jira Backlog — AI-Powered E-Commerce Recommendation & Demand Prediction System

Generated from `guide/ecommerce-ai-fyp-setup-guide.md`.

**14 epics · 120 issues · 700 story points**

## How to import into Jira

The file to import is **`jira-import.csv`** (in this same folder).

**Company-managed (classic) project — one pass:**

1. Jira → **Settings (gear) → System → External System Import → CSV**.
2. Upload `jira-import.csv`, select your project, set delimiter `,` and encoding `UTF-8`.
3. Map the columns: `Issue Type`→Issue Type, `Summary`→Summary, `Description`→Description, `Priority`→Priority, `Epic Name`→Epic Name, `Epic Link`→Epic Link, `Story Points`→Story Points, all five `Labels` columns→Labels.
4. Run the import. Epics are created first and stories attach to them by epic name automatically.

**Team-managed (next-gen) project — two passes** (it has no `Epic Link` field):

1. Filter the CSV to the 14 `Epic` rows, import those first.
2. Note each epic's new issue key (e.g. `SCRUM-1`).
3. In the remaining rows, replace the `Epic Link` text with the matching issue key, rename that column header to `Parent`, and import the rest — mapping `Parent`→Parent.

> Alternative if the mapping gets awkward: import everything without the parent column, then drag issues onto their epic in the Backlog view, or use **Bulk change → Edit → Parent**.

**After import:** switch the board to the `w1`…`w16` labels to build sprints — each issue is already labelled with the week it belongs to in the 16-week roadmap.

## Summary

| Epic | Issues | Points |
|---|---:|---:|
| EP1 Project Setup & Planning | 6 | 16 |
| EP2 Architecture & System Design | 8 | 45 |
| EP3 Data Strategy & Dataset Pipeline | 9 | 47 |
| EP4 Backend Core (NestJS) | 14 | 70 |
| EP5 ML Service Foundation (FastAPI) | 6 | 23 |
| EP6 M1 Recommendation Engine | 13 | 93 |
| EP7 M2 Demand Forecasting Engine | 10 | 73 |
| EP8 M3 Customer Behavior Analytics | 4 | 29 |
| EP9 Frontend Customer App (React) | 11 | 68 |
| EP10 Admin Dashboard | 9 | 63 |
| EP11 M4 Generative AI Shopping Assistant | 5 | 34 |
| EP12 Evaluation & Testing | 11 | 62 |
| EP13 Deployment & DevOps | 7 | 32 |
| EP14 Documentation & FYP Report | 7 | 45 |

---

## EP1 Project Setup & Planning

*Scope freeze, repository, toolchain and proposal for the FYP.*

`Epic` · Priority **Highest** · Labels: `fyp`, `planning`

### Freeze project scope: 4 modules and in/out-of-scope table

`Task` · Priority **Highest** · 3 pts · Labels: `planning`, `w1`

```text
Lock the scope so it cannot creep later.

Scope:
- M1 Personalized Recommendation Engine (core, graded)
- M2 Demand Forecasting Engine (core, graded)
- M3 Customer Behavior Analytics (medium priority)
- M4 Generative AI Shopping Assistant (optional extension, only if time allows)

Acceptance criteria:
- In-scope list written: catalog, cart, orders, event tracking, hybrid recommendation,
  30-day per-product forecast, admin analytics dashboard.
- Out-of-scope list written explicitly: real payment gateway, real-time streaming (Kafka),
  multi-language/multi-currency, mobile app, delivery/rider tracking.
- Both tables committed to docs/01-proposal.md and shown to the supervisor.
```

### Define user roles and permission matrix

`Task` · Priority **High** · 2 pts · Labels: `planning`, `w1`

```text
Define Customer and Admin roles (Seller only if the team has 3+ members).

Acceptance criteria:
- Role x capability matrix documented (browse, cart, order, recommendations, assistant vs
  products CRUD, orders, analytics, forecast, stock alerts).
- Route-level permissions listed so the NestJS roles guard can be built directly from it.
```

### Create GitHub monorepo and commit folder structure

`Task` · Priority **Highest** · 2 pts · Labels: `setup`, `w1`

```text
Create ecommerce-ai-platform repo with the agreed monorepo layout.

Acceptance criteria:
- Folders created: docs/, frontend/, backend/, ml-service/, data/{raw,processed,seed}/.
- .gitignore excludes .env, node_modules, venv, data/raw large files, models/*.joblib.
- README.md explains how to run each of the three services.
- Branching convention agreed (feature/*, one branch per module) and written in README.
```

### Install and verify the development toolchain

`Task` · Priority **High** · 2 pts · Labels: `setup`, `w1`

```text
Day-1 environment setup on every team machine.

Acceptance criteria:
- Node.js 20 LTS, Python 3.11+, MongoDB Community 7 (or Atlas M0), Git verified by version output.
- VS Code extensions installed: ESLint, Prettier, Tailwind, Python, Thunder Client.
- MongoDB Compass connects; Postman/Thunder Client can hit a test endpoint.
- npm i -g @nestjs/cli succeeds.
- Figma, draw.io and Jupyter available for design and experiments.
```

### Write the FYP proposal with measurable objectives

`Task` · Priority **Highest** · 5 pts · Labels: `planning`, `docs`, `w1`

```text
Draft docs/01-proposal.md.

Acceptance criteria:
- Title, problem statement (over-stock / under-stock and generic non-personalized catalogs).
- Four measurable objectives:
  1. Hybrid recommender achieving >= 25% Precision@10 improvement over the popularity baseline.
  2. Demand forecasting model achieving >= 30% MAE improvement over the naive baseline.
  3. 30-day forecast plus automatic restocking alerts for admins.
  4. Customer behavior analytics producing actionable segments.
- Scope tables, tech stack and 16-week plan included.
- Supervisor feedback captured in the ticket comments.
```

### Set up the Jira board and 16-week milestone plan

`Task` · Priority **Medium** · 2 pts · Labels: `planning`, `w1`

```text
Configure this board so progress is demonstrable to the supervisor.

Acceptance criteria:
- Board columns: Backlog / To Do / In Progress / In Review / Done.
- Sprints or week labels (w1..w16) mapped to the roadmap in the guide.
- Milestones flagged: Week 4 vertical slice, Week 9 hybrid recommender, Week 12 admin
  forecast dashboard, Week 15 deployment, Week 16 final submission.
```

---

## EP2 Architecture & System Design

*All Week-2 design deliverables: architecture, database, API contract, wireframes, ML design.*

`Epic` · Priority **Highest** · Labels: `fyp`, `design`

### ARCHITECTURE SOLUTION: end-to-end system design, dataset selection and data integration plan

`Story` · Priority **Highest** · 13 pts · Labels: `design`, `architecture`, `data`, `w2`

```text
PURPOSE
Single source of truth for the technical solution: what we build, which datasets power it,
and exactly how every dataset flows into the running system. Supervisor sign-off on this
ticket gates the start of heavy feature coding.

====================================================================
1. SOLUTION OVERVIEW
====================================================================
Loosely-coupled 3-tier system plus a dedicated ML microservice:

    React SPA (Customer UI + Admin UI)
          |  REST + JWT
    NestJS API Gateway  --Mongoose-->  MongoDB
          |  internal HTTP (x-api-key)
    Python FastAPI ML Service  --pymongo-->  MongoDB
          ^
          +--- nightly batch training job (cron)

Why a separate Python service instead of ML inside NestJS:
 - The mature ML stack (pandas, scikit-learn, implicit, LightGBM, statsmodels) is Python only.
 - Training is CPU-heavy and must never block API request handling.
 - Gives the report a genuine microservice architecture with an explicit service contract.

Serving model = batch + real-time hybrid:
 - Batch (nightly): user recommendations, item-item neighbours, 30-day forecasts, user profiles.
 - Real-time: session-based recommendations from the last 5 events, similar-items lookup,
   assistant queries.

====================================================================
2. COMPONENT RESPONSIBILITIES
====================================================================
React SPA       - rendering, client state, event tracking calls, charts (Recharts).
NestJS gateway  - authN/authZ (JWT + role guards), DTO validation, business rules, Mongo
                  access, ML client with timeout + fallback chain, cron schedulers.
MongoDB         - single shared datastore: users, products, categories, cart, wishlist,
                  orders, reviews, user_events, user_profiles, recommendations,
                  sales_daily, forecasts, stock_alerts.
FastAPI ML      - feature engineering, training, inference, model artifacts (.joblib),
                  model versioning. No business logic and never exposed to the browser.

====================================================================
3. DATASET SELECTION (decision + justification)
====================================================================
A new platform has zero history, so models are bootstrapped from public datasets plus a
calibrated synthetic generator. Final selection:

[PRIMARY - RECOMMENDATION]  RetailRocket Recommender System Dataset (Kaggle)
  Why: ~2.7M real implicit-feedback events with exactly the event types we track
       (view / addtocart / transaction), plus item property and category-tree files.
       Closest public match to our user_events schema, so the recommender trains on
       realistic behaviour rather than invented data.
  Feeds: user_events, products (item properties), user_profiles, recommender training.

[PRIMARY - FORECASTING]  Online Retail II (UCI)
  Why: ~2 years of real transactional invoices with quantity, unit price and timestamps.
       Long enough per-SKU history to build lag and rolling features, capture weekly
       seasonality, and support a fair time-based split for a 30-day horizon.
  Feeds: sales_daily, forecasting training and evaluation.

[SECONDARY - CATALOG ENRICHMENT]  Olist Brazilian E-Commerce (Kaggle)
  Why: complete relational e-commerce schema (orders, order_items, customers, reviews)
       used as the reference model for our order status flow and to enrich the catalog
       with realistic review and rating distributions.
  Feeds: reviews, products.ratingAvg / ratingCount, orders.status state machine.

[DEMO + LOCAL SEASONALITY]  Custom synthetic generator (data/seed/05_synthetic_generator.py)
  Why: public datasets are anonymised and non-local. The generator produces 12-24 months of
       demo-ready history with Zipf popularity (80/20), realistic funnel drop-off
       (view 100% -> cart ~10% -> purchase ~3%), session-based browsing, weekend and promo
       spikes, and local seasonality (Ramzan, Eid, summer, school season) that the demo and
       the Pakistani-holiday Prophet configuration need.
  Feeds: demo seeding of user_events and sales_daily. Never used for headline metrics.

[LEARNING ONLY]  MovieLens 100k - CF concept practice, not shipped.

Honesty rule for the report: state explicitly that models were trained and evaluated on the
public RetailRocket and Online Retail II datasets, with a calibrated synthetic generator used
for demo seeding only. All headline evaluation numbers must come from real public data.

====================================================================
4. DATASET -> COLLECTION FIELD MAPPING
====================================================================
RetailRocket events.csv
  visitorid    -> user_events.userId / anonId
  itemid       -> user_events.productId
  event        -> user_events.eventType  (view -> view, addtocart -> add_to_cart,
                                          transaction -> purchase)
  timestamp    -> user_events.timestamp  (epoch ms -> ISO Date)
  derived      -> user_events.sessionId  (30-minute inactivity gap)

RetailRocket item_properties + category_tree
  itemid       -> products._id / sku
  categoryid   -> products.categoryId  (category_tree -> categories)
  available    -> products.isActive and initial stock
  hashed props -> products.attributes, products.tags

Online Retail II
  StockCode    -> products.sku (joined onto the catalog)
  Description  -> products.title / description (content-based text source)
  InvoiceDate  -> sales_daily.date (bucketed per day)
  Quantity     -> sales_daily.unitsSold (sum per product per day)
  Price        -> sales_daily.avgPrice, sales_daily.revenue
  derived      -> isWeekend, isHoliday, promoFlag, discountPct, stockOutHours

Olist
  reviews      -> reviews collection, products.ratingAvg / ratingCount
  order flow   -> orders.status reference states

Synthetic generator
  produces     -> user_events + sales_daily rows in the same schema, tagged
                  source: "synthetic" so evaluation queries can exclude them.

====================================================================
5. INTEGRATION PIPELINE (raw dataset -> screen)
====================================================================
  data/raw/                    downloaded archives (git-ignored)
        |   01_load_products.py, 02_load_users.py
  MongoDB catalog              products, categories, users
        |   03_load_events.py
  MongoDB user_events          unified implicit-feedback stream
        |   04_build_sales_daily.py  (aggregate per product, per day)
  MongoDB sales_daily          forecasting training table
        |   ml-service/features/*  (event weighting + decay | lag/rolling/calendar features)
  Feature matrices             user-item CSR matrix | LightGBM tabular frame
        |   training/train_recommender.py, training/train_forecast.py  (nightly cron)
  models/*.joblib              versioned artifacts, loaded once at FastAPI startup
        |   batch inference
  MongoDB recommendations + forecasts   (precomputed cache collections)
        |   NestJS reads cache, or calls ML live for session-based recommendations
  React UI                     Recommended For You, Similar Products, Admin Forecast page

Event weighting that converts the raw stream into implicit feedback:
  search 1 | click 2 | view 3 (+2 if dwellTimeSec > 30) | wishlist 5 | add_to_cart 8 | purchase 15
  time decay:  weight_final = weight * exp(-0.05 * days_ago)

====================================================================
6. SERVICE CONTRACT (NestJS -> FastAPI, never exposed to the browser)
====================================================================
  POST /ml/recommend      { userId, limit, context }
                          -> { items: [{ productId, score, reason }], modelVersion }
  POST /ml/similar-items  { productId, limit }  -> { items: [...] }
  POST /ml/forecast       { productId, days }
                          -> { predictions: [{ date, predictedUnits, lower, upper }], metrics }
  POST /ml/train/recommender   (admin / cron only)
  POST /ml/train/forecast      (admin / cron only)
  GET  /ml/health              -> { status, models: { name: version } }

Transport: internal HTTP, shared secret in the x-api-key header, 800ms-1500ms client timeout.

====================================================================
7. RESILIENCE AND GRACEFUL DEGRADATION
====================================================================
Recommendation fallback chain (the site must never render an empty rail):
  ML personalized -> cached recommendations collection -> category-affinity picks
  -> global popular products (Mongo aggregation)
The forecast page degrades to the last persisted forecasts document with a "stale as of"
banner. ML outages are logged and surfaced on the admin health card, never to the customer.

====================================================================
8. MODEL LIFECYCLE
====================================================================
Versioning: a modelVersion string (e.g. als_v2, lgbm_v3) is stored on every recommendations
and forecasts document so any result is traceable to the artifact that produced it.
Retrain cadence: recommender weekly plus nightly user-profile refresh; forecasting daily
batch over the 30-day horizon. Triggered by cron, plus POST /admin/ml/retrain for demos.

====================================================================
9. NON-FUNCTIONAL TARGETS
====================================================================
 - Recommendation API p95 < 500ms with cache, at 100 concurrent users.
 - ML call timeout <= 1.5s; zero user-visible errors when the ML service is down.
 - Indexes in place before demo: user_events{userId:1,timestamp:-1},
   sales_daily{productId:1,date:1} unique, recommendations{userId:1} unique,
   products{categoryId:1,price:1} and a text index on title+tags.
 - Secrets only in .env; ML service not publicly reachable; CORS restricted to the
   frontend origin; throttling on auth and assistant endpoints.

====================================================================
ACCEPTANCE CRITERIA
====================================================================
 - docs/03-architecture.png committed and matching the diagram above.
 - docs/06-ml-design.md records dataset choice, justification and the integration pipeline.
 - Dataset -> collection mapping verified against the real dataset column names.
 - Service contract agreed and stubbed in both NestJS and FastAPI.
 - Fallback chain and non-functional targets written into the SRS.
 - Supervisor sign-off recorded before backend feature work starts.
```

### Use case diagram for Customer, Admin and ML Service actors

`Task` · Priority **High** · 3 pts · Labels: `design`, `w2`

```text
Model actors and use cases in draw.io.

Acceptance criteria:
- Actors: Customer, Admin, ML Service (system actor).
- Use cases covered: Register/Login, Browse, Search, View Product, Add to Cart, Checkout,
  Get Recommendations, Ask Assistant, Manage Products, View Analytics, View Demand Forecast,
  Receive Stock Alert.
- Exported to docs/ and referenced from the SRS.
```

### System architecture diagram

`Task` · Priority **Highest** · 3 pts · Labels: `design`, `w2`

```text
Produce docs/03-architecture.png from the agreed solution.

Acceptance criteria:
- Shows React SPA, NestJS gateway, MongoDB, FastAPI ML service and the nightly training job.
- Protocol on every edge (REST+JWT, Mongoose, internal HTTP+API key).
- Annotated with the terms used in the report: loosely coupled microservice,
  batch + real-time hybrid serving.
```

### MongoDB collection schemas and index plan

`Task` · Priority **Highest** · 5 pts · Labels: `design`, `database`, `w2`

```text
Design all collections and the indexes they need.

Collections: users, products, categories, cart, wishlist, orders (embedded order_items),
reviews, user_events, user_profiles, recommendations, sales_daily, forecasts, stock_alerts.

Acceptance criteria:
- Field-level schema written for products, user_events, user_profiles, sales_daily,
  forecasts and recommendations.
- Index plan documented and justified:
  user_events {userId:1, timestamp:-1} and {productId:1, eventType:1};
  products {categoryId:1, price:1} plus text index on title+tags;
  sales_daily {productId:1, date:1} unique compound;
  recommendations {userId:1} unique; orders {userId:1, createdAt:-1}.
- ER/collection diagram exported to docs/04-er-diagram.png.
```

### REST API contract (public and internal)

`Task` · Priority **Highest** · 5 pts · Labels: `design`, `api`, `w2`

```text
Write docs/05-api-contract.md so frontend and backend can be built in parallel.

Acceptance criteria:
- Public endpoints specified with request/response shapes and status codes for:
  auth, products, categories, cart, wishlist, orders, events, recommendations,
  assistant and all /admin/* routes.
- Internal NestJS -> FastAPI endpoints specified (/ml/recommend, /ml/similar-items,
  /ml/forecast, /ml/train/*, /ml/health) and marked as not browser-exposed.
- Error envelope and pagination convention agreed.
```

### Low-fidelity wireframes for all screens in Figma

`Task` · Priority **High** · 8 pts · Labels: `design`, `ui`, `w2`

```text
Wireframe before coding so the UI is consistent.

Acceptance criteria:
- 11 customer screens: Home, Category listing + filters, Search results, Product detail,
  Cart, Checkout, Order success, My orders, Wishlist, Profile, AI Assistant chat.
- 8 admin screens: Overview KPIs, Products list + add/edit, Orders, Customers + segments,
  Sales analytics, Demand Forecast, Inventory & stock alerts, Recommendation performance.
- A single colour and typography system chosen and applied.
- Exported to docs/ for the report.
```

### ML design document

`Task` · Priority **Highest** · 5 pts · Labels: `design`, `ml`, `w2`

```text
Write docs/06-ml-design.md - the first thing the supervisor asks for.

Acceptance criteria:
- Problem formulation: recommendation as top-N ranking, forecasting as time-series regression.
- Data sources and features per module.
- Algorithm ladder: baseline -> content-based -> collaborative -> hybrid;
  naive -> moving average -> SARIMA/Prophet -> LightGBM.
- Train/test split strategy (temporal, rolling origin) and leakage rules.
- Evaluation metrics per module.
- Serving strategy (batch vs real-time) and cold-start handling.
```

### Sequence diagrams for recommendation and forecast flows

`Task` · Priority **Medium** · 3 pts · Labels: `design`, `w2`

```text
Document the runtime interaction between the three services.

Acceptance criteria:
- Sequence diagram: user opens Home -> NestJS -> cache hit/miss -> ML service -> response,
  including the fallback branch when ML is unavailable.
- Sequence diagram: nightly cron -> aggregate sales_daily -> train -> write forecasts ->
  admin loads Forecast page.
- Both exported to docs/ and used in report chapter 4.
```

---

## EP3 Data Strategy & Dataset Pipeline

*Public dataset selection, exploration, seeding scripts and synthetic data generation.*

`Epic` · Priority **Highest** · Labels: `fyp`, `data`

### Download and licence-check the public datasets

`Task` · Priority **Highest** · 2 pts · Labels: `data`, `w2`

```text
Acquire the datasets chosen in the architecture ticket.

Acceptance criteria:
- RetailRocket Recommender System Dataset (Kaggle) downloaded to data/raw/.
- Online Retail II (UCI) downloaded to data/raw/.
- Olist dataset downloaded if catalog/review enrichment is used.
- Licence and attribution recorded in docs/ for the report.
- data/raw/ confirmed git-ignored; a README documents how to re-download.
```

### Exploration notebook for RetailRocket (recommendation data)

`Task` · Priority **Highest** · 5 pts · Labels: `data`, `ml`, `w2`

```text
Create ml-service/notebooks/01_data_exploration.ipynb.

Acceptance criteria:
- Reports row count, unique visitors, unique items, events per type and full date range.
- Funnel conversion rates (view -> addtocart -> transaction) computed.
- Long-tail / popularity distribution plotted.
- Sparsity of the user-item matrix computed and noted (drives CF feasibility).
- Findings summarised in markdown cells - this notebook is report evidence.
```

### Exploration notebook for Online Retail II (forecasting data)

`Task` · Priority **Highest** · 5 pts · Labels: `data`, `ml`, `w2`

```text
Create ml-service/notebooks/02_forecast_data_exploration.ipynb.

Acceptance criteria:
- Daily and weekly aggregation of quantity per StockCode.
- Date range, number of SKUs with sufficient history, and intermittent-demand SKUs identified.
- Seasonality and weekday effects plotted; returns/negative quantities and cancellations handled.
- Decision recorded on which SKU subset is used for modelling.
```

### Seed script 01: load products into the catalog

`Task` · Priority **High** · 5 pts · Labels: `data`, `w3`

```text
Build data/seed/01_load_products.py.

Acceptance criteria:
- Maps dataset item properties into the products schema (sku, title, description,
  categoryId, brand, price, attributes, tags, images, stock).
- Categories created from the dataset category tree.
- Idempotent (safe to re-run) and logs inserted/updated counts.
- At least 2000 products present in MongoDB afterwards.
```

### Seed script 02: load anonymized users

`Task` · Priority **Medium** · 3 pts · Labels: `data`, `w3`

```text
Build data/seed/02_load_users.py.

Acceptance criteria:
- Dataset visitor ids mapped to user documents with synthetic emails and hashed passwords.
- No real personal data imported; anonymisation approach noted in docs.
- A known demo customer and demo admin account created for the presentation.
```

### Seed script 03: load events into user_events

`Task` · Priority **Highest** · 8 pts · Labels: `data`, `w3`

```text
Build data/seed/03_load_events.py.

Acceptance criteria:
- RetailRocket event types mapped to our vocabulary
  (view -> view, addtocart -> add_to_cart, transaction -> purchase).
- Epoch timestamps converted to Date; sessionId derived using a 30-minute inactivity gap.
- Bulk-insert in batches so a multi-million-row load completes without exhausting memory.
- Post-load counts per eventType printed and validated against the notebook figures.
```

### Seed script 04: build the sales_daily aggregate table

`Task` · Priority **Highest** · 8 pts · Labels: `data`, `w3`

```text
Build data/seed/04_build_sales_daily.py - the forecasting training table.

Acceptance criteria:
- One document per productId per date with unitsSold, revenue, avgPrice, discountPct.
- Calendar flags computed: isWeekend, isHoliday, promoFlag.
- Zero-sales days explicitly filled (a gap is not the same as zero demand).
- stockOutHours populated where derivable so censored demand can be masked later.
- Unique compound index {productId:1, date:1} enforced.
```

### Seed script 05: calibrated synthetic data generator

`Task` · Priority **High** · 8 pts · Labels: `data`, `w3`

```text
Build data/seed/05_synthetic_generator.py for demo seeding and local seasonality.

Acceptance criteria:
- Zipf (80/20) popularity distribution across products.
- Funnel probabilities: view 100% -> cart ~10% -> purchase ~3%.
- Session-based browsing (1-2 categories per session).
- Seasonality rules: summer -> cooling appliances up, winter -> jackets up,
  Ramzan -> food/dates up, school season -> bags/stationery up.
- Weekly pattern (weekend spike) plus promo days (Black Friday style spike).
- Random noise of +/-10%.
- Generates 12-24 months of history; every row tagged source:"synthetic".
```

### Data quality validation and dataset documentation

`Task` · Priority **High** · 3 pts · Labels: `data`, `w3`

```text
Verify the seeded data before any model is trained on it.

Acceptance criteria:
- Referential checks: every user_events.productId exists in products.
- No duplicate {productId,date} rows in sales_daily; no negative unitsSold.
- Date ranges continuous; outliers reported.
- Row counts per collection recorded in docs/ for the report.
- Synthetic vs real rows separable by the source field.
```

---

## EP4 Backend Core (NestJS)

*NestJS API gateway: auth, catalog, cart, orders, event tracking, cross-cutting concerns.*

`Epic` · Priority **Highest** · Labels: `fyp`, `backend`

### Bootstrap NestJS app with config and MongoDB connection

`Task` · Priority **Highest** · 3 pts · Labels: `backend`, `w3`

```text
nest new backend, then wire configuration and the database.

Acceptance criteria:
- @nestjs/config loads .env (MONGO_URI, JWT secrets, ML_URL, ML_API_KEY).
- MongooseModule.forRootAsync connects successfully on boot.
- Health endpoint returns app + database status.
- Prettier/ESLint configured and passing.
```

### Auth module: register, login, refresh with JWT

`Story` · Priority **Highest** · 8 pts · Labels: `backend`, `auth`, `w3`

```text
As a user I want to register and log in so my activity and orders are tied to my account.

Acceptance criteria:
- POST /auth/register, POST /auth/login, POST /auth/refresh, GET /auth/me implemented.
- Passwords hashed with bcrypt; access + refresh token pair issued.
- JWT guard protects private routes; invalid/expired tokens return 401.
- DTO validation with class-validator on every input.
- Verified end to end in Postman.
```

### Roles guard and RBAC for customer vs admin

`Task` · Priority **High** · 3 pts · Labels: `backend`, `auth`, `w3`

```text
Add role-based authorization.

Acceptance criteria:
- @Roles('admin') decorator plus a RolesGuard registered globally.
- All /admin/* routes reject customer tokens with 403.
- Role stored on the user document and carried in the JWT payload.
- Covered by unit tests.
```

### Categories module

`Story` · Priority **Medium** · 3 pts · Labels: `backend`, `w4`

```text
As a customer I want to browse products by category.

Acceptance criteria:
- GET /categories returns the category tree.
- Admin CRUD for categories behind the roles guard.
- Seeded categories returned correctly.
```

### Products module with filtering, sorting, pagination and search

`Story` · Priority **Highest** · 8 pts · Labels: `backend`, `w4`

```text
As a customer I want to search and filter the catalog.

Acceptance criteria:
- GET /products supports category, q, minPrice, maxPrice, sort, page and limit.
- Text search backed by the products text index on title+tags.
- GET /products/:id returns full detail; 404 handled cleanly.
- Admin CRUD for products behind the roles guard.
- Response times acceptable on the seeded 2000+ product catalog.
```

### Cart module

`Story` · Priority **High** · 5 pts · Labels: `backend`, `w5`

```text
As a customer I want a persistent cart across sessions.

Acceptance criteria:
- GET / POST / PATCH / DELETE /cart scoped to the authenticated user.
- Quantity update and item removal supported; totals computed server-side.
- Cart survives logout/login.
- Stock availability checked when items are added.
```

### Wishlist module

`Story` · Priority **Medium** · 3 pts · Labels: `backend`, `w5`

```text
As a customer I want to save products for later.

Acceptance criteria:
- GET / POST / DELETE /wishlist scoped to the user.
- Duplicate additions are idempotent.
- Wishlist actions also emit a wishlist event for the recommender.
```

### Orders module with stock decrement and status flow

`Story` · Priority **Highest** · 8 pts · Labels: `backend`, `w5`

```text
As a customer I want to place an order and track its status.

Acceptance criteria:
- POST /orders creates an order from the cart with embedded order_items.
- Stock decremented atomically (transaction / findOneAndUpdate guard); overselling impossible.
- Order status flow implemented (placed -> confirmed -> shipped -> delivered / cancelled).
- GET /orders and GET /orders/:id return only the caller's orders.
- Placing an order emits purchase events per item with quantity and price.
```

### Events module for behavior tracking

`Story` · Priority **Highest** · 8 pts · Labels: `backend`, `tracking`, `w6`

```text
As the system I need every meaningful user action captured, because user_events is the
fuel for M1 and M3.

Acceptance criteria:
- POST /events and POST /events/bulk implemented with DTO validation.
- Accepts view, click, search, add_to_cart, remove_from_cart, wishlist, purchase, rate.
- Optional fields honoured: searchQuery, dwellTimeSec, quantity, price, device, source.
- Works for anonymous visitors via anonId and for logged-in users via userId.
- Writes are non-blocking and never fail the originating user action.
- Indexes created; ingestion verified under a burst of bulk writes.
```

### ML client with timeout, retry and fallback

`Task` · Priority **Highest** · 5 pts · Labels: `backend`, `ml`, `w6`

```text
Build the common HttpService wrapper that every ML call goes through.

Acceptance criteria:
- Wraps @nestjs/axios with an 800ms-1500ms timeout and the x-api-key header.
- Returns null instead of throwing when the ML service is down, and logs a warning.
- Callers implement the fallback chain rather than surfacing an error.
- Unit tested with the ML service stubbed as unavailable.
```

### Cross-cutting concerns: validation, error filter, logging

`Task` · Priority **High** · 3 pts · Labels: `backend`, `w6`

```text
Harden the API surface.

Acceptance criteria:
- Global ValidationPipe with whitelist and forbidNonWhitelisted.
- Global exception filter producing the agreed error envelope.
- Request logging interceptor with correlation id.
- Consistent 4xx/5xx behaviour verified in Postman.
```

### Scheduler module for nightly jobs

`Task` · Priority **Medium** · 5 pts · Labels: `backend`, `w6`

```text
Add @nestjs/schedule and register the batch jobs.

Acceptance criteria:
- Nightly: rebuild sales_daily aggregates, refresh user_profiles, trigger recommendation
  precompute, trigger daily forecast batch.
- Each job is idempotent, logs start/end/duration, and can be triggered manually by an admin.
- Job failures raise an admin notification rather than failing silently.
```

### Notifications module for stock alerts and order status

`Story` · Priority **Medium** · 5 pts · Labels: `backend`, `w13`

```text
As an admin I want to be alerted when a product is at risk of stocking out.

Acceptance criteria:
- Low-stock and forecast-risk alerts written to stock_alerts.
- Order status change notifications for customers.
- GET /admin/forecast/alerts returns the active alert list.
- Alerts deduplicated so the same product does not spam the list daily.
```

### Security hardening: rate limiting, CORS, secrets

`Task` · Priority **Medium** · 3 pts · Labels: `backend`, `security`, `w15`

```text
Production-safety pass on the API.

Acceptance criteria:
- @nestjs/throttler applied to auth and assistant endpoints.
- CORS restricted to the frontend origin only.
- Helmet-style headers enabled; no secrets in the repository.
- ML service reachable only with the shared API key.
```

---

## EP5 ML Service Foundation (FastAPI)

*Python FastAPI microservice skeleton, model registry, internal contract and security.*

`Epic` · Priority **High** · Labels: `fyp`, `ml`

### Bootstrap the FastAPI ML service

`Task` · Priority **Highest** · 3 pts · Labels: `ml`, `w4`

```text
Create the ml-service skeleton.

Acceptance criteria:
- venv created; fastapi, uvicorn, pymongo, pandas, numpy, scikit-learn, implicit, lightgbm,
  statsmodels, joblib and python-dotenv installed; requirements.txt frozen.
- App structure in place: app/main.py, app/routers/, app/services/, app/features/, app/models/,
  training/, notebooks/.
- uvicorn app.main:app --reload --port 8000 serves successfully.
```

### MongoDB access layer for the ML service

`Task` · Priority **High** · 5 pts · Labels: `ml`, `w4`

```text
Give the ML service read/write access to the shared database.

Acceptance criteria:
- pymongo client configured from environment variables with connection pooling.
- Helper functions to read user_events, products and sales_daily into pandas DataFrames.
- Helper functions to upsert into recommendations and forecasts.
- Large reads are chunked so memory stays bounded.
```

### Model registry: startup loading and versioning

`Task` · Priority **High** · 5 pts · Labels: `ml`, `w4`

```text
Load model artifacts once, not per request.

Acceptance criteria:
- Models loaded with joblib at application startup and held in memory.
- A version string per model (als_v2, lgbm_v3, content_v1) exposed through the registry.
- Hot-reload endpoint or restart-on-retrain strategy documented.
- Missing artifacts degrade gracefully instead of crashing the service.
```

### Health endpoint reporting loaded model versions

`Task` · Priority **Medium** · 2 pts · Labels: `ml`, `w4`

```text
Implement GET /ml/health.

Acceptance criteria:
- Returns status plus a map of model name to loaded version and last-trained timestamp.
- Reports database connectivity.
- Consumed by the NestJS admin health card.
```

### API-key authentication between NestJS and the ML service

`Task` · Priority **High** · 3 pts · Labels: `ml`, `security`, `w4`

```text
The ML service must never be callable from a browser.

Acceptance criteria:
- x-api-key header required on every /ml/* route except health.
- Key sourced from environment variables on both sides.
- Requests without a valid key are rejected with 401.
- Documented in the API contract as internal-only.
```

### Training entrypoints runnable from CLI and cron

`Task` · Priority **High** · 5 pts · Labels: `ml`, `w4`

```text
Make training reproducible - an explicit FYP requirement.

Acceptance criteria:
- python training/train_recommender.py and python training/train_forecast.py run end to end
  from a clean checkout.
- Each writes a versioned artifact into app/models/ and logs the metrics it achieved.
- POST /ml/train/recommender and POST /ml/train/forecast trigger the same code paths.
- Run duration and dataset snapshot recorded in the training log.
```

---

## EP6 M1 Recommendation Engine

*Popularity baseline through to hybrid recommender with cold-start handling and caching.*

`Epic` · Priority **Highest** · Labels: `fyp`, `ml`, `M1`

### Level 0 popularity baseline recommender

`Story` · Priority **Highest** · 5 pts · Labels: `ml`, `M1`, `baseline`, `w4`

```text
As a customer I want to see popular products so the site is never empty - and as the team
we need the baseline that every later model is measured against.

Acceptance criteria:
- Score combines purchaseCount, viewCount, rating and recency.
- Implemented as a MongoDB aggregation exposed through GET /recommendations/trending.
- Metrics computed and recorded as the first row of the evaluation table.
- Documented in docs/06-ml-design.md as the baseline.
```

### MILESTONE: end-to-end vertical slice working

`Story` · Priority **Highest** · 8 pts · Labels: `milestone`, `M1`, `w4`

```text
The Week-4 milestone from the guide: React page -> NestJS API -> MongoDB -> Python ML
service -> recommendation rendered on screen.

The recommendation quality is irrelevant at this stage; the chain must exist. Everything
afterwards only swaps the model, never the architecture.

Acceptance criteria:
- Home page renders a recommendation rail sourced through the full chain.
- The ML service is genuinely called (visible in its logs), not stubbed in NestJS.
- Fallback verified: with the ML service stopped, the page still renders popular products.
- Screenshot and short screen recording attached for the report.
```

### Event weighting and time-decay feature pipeline

`Task` · Priority **Highest** · 5 pts · Labels: `ml`, `M1`, `w7`

```text
Convert the raw event stream into implicit feedback.

Acceptance criteria:
- Weights applied: search 1, click 2, view 3 (+2 when dwellTimeSec > 30), wishlist 5,
  add_to_cart 8, purchase 15.
- Time decay applied: weight_final = weight * exp(-lambda * days_ago) with lambda ~ 0.05.
- Produces the user-item weight table used by CF and by user_profiles.
- Weighting table reproduced in the report.
```

### Level 1 content-based recommender (TF-IDF + cosine)

`Story` · Priority **Highest** · 8 pts · Labels: `ml`, `M1`, `w7`

```text
As a customer with little history I still want relevant suggestions.

Acceptance criteria:
- Corpus built from title + description + tags + brand + category.
- TF-IDF vectorised (max_features ~5000, English stop words); numeric attributes normalised
  and concatenated.
- Cosine similarity computed; only the top-50 neighbours per product are persisted (full
  matrix does not scale).
- Neighbours stored in MongoDB and refreshed when products change.
- Offline metrics recorded as the second row of the evaluation table.
```

### Similar-items endpoint and Similar Products API

`Story` · Priority **High** · 5 pts · Labels: `ml`, `M1`, `w7`

```text
As a customer on a product page I want to see similar products.

Acceptance criteria:
- POST /ml/similar-items returns ranked neighbours for a productId.
- GET /products/:id/similar and GET /recommendations/product/:id/related exposed by NestJS.
- Served from the precomputed neighbour cache, not computed per request.
- Out-of-stock and inactive products filtered out of results.
```

### Level 2 collaborative filtering with implicit ALS

`Story` · Priority **Highest** · 13 pts · Labels: `ml`, `M1`, `w8`

```text
As a customer I want recommendations based on what similar users bought.

Acceptance criteria:
- User-item CSR matrix built from the weighted implicit feedback.
- AlternatingLeastSquares trained (factors 64, regularization 0.05, iterations 20) as a
  starting configuration, then tuned.
- Recommendations exclude items the user already purchased.
- Training time and matrix sparsity recorded.
- Offline metrics recorded as the third row of the evaluation table.
```

### Item-item collaborative filtering for Customers Also Bought

`Story` · Priority **High** · 8 pts · Labels: `ml`, `M1`, `w8`

```text
As a customer I want to see what other buyers of this product also bought.

Acceptance criteria:
- Item-item cosine similarity computed over the transposed interaction matrix.
- Top-N co-purchase neighbours precomputed per product.
- Exposed through the related-products endpoint alongside content-based neighbours.
- Compared against content-based similarity in the report.
```

### Level 3 hybrid scoring and re-ranking - the project contribution

`Story` · Priority **Highest** · 13 pts · Labels: `ml`, `M1`, `hybrid`, `w9`

```text
Combine the signals into the proposed model. This is the FYP contribution and must beat
every baseline.

Scoring:
  final_score = w1*CF + w2*Content + w3*CategoryAffinity + w4*Popularity + w5*Recency
                - penalty(already_purchased) - penalty(out_of_stock)
                + boost(price_in_user_range)

Acceptance criteria:
- Starting weights w1=0.40, w2=0.25, w3=0.20, w4=0.10, w5=0.05 implemented and configurable.
- Grid search performed over the weights; a weight-sensitivity table produced for the report.
- Penalties and boosts verified with unit tests.
- Beats the popularity baseline by >= 25% Precision@10 (proposal objective 1).
```

### Diversity re-ranking (MMR / category cap)

`Task` · Priority **Medium** · 5 pts · Labels: `ml`, `M1`, `w9`

```text
Stop the rail filling with near-identical products.

Acceptance criteria:
- MMR re-ranking or a max-3-items-per-category rule applied to the final list.
- Catalog coverage measured before and after; improvement reported.
- Diversity trade-off against precision documented.
```

### Cold-start handling strategies

`Story` · Priority **Highest** · 8 pts · Labels: `ml`, `M1`, `cold-start`, `w9`

```text
A viva question that must have a demonstrable answer.

Acceptance criteria:
- New user with 0 events -> trending plus category best sellers, and a 3-interest onboarding prompt.
- New user with 1-3 views -> session-based content recommendations.
- New product -> content similarity plus a New Arrivals boost.
- Anonymous visitor -> anonId cookie tracking, merged into the user profile on login.
- Each case demonstrable in the running app and covered in docs/06-ml-design.md.
```

### Recommendation precompute batch job and cache collection

`Task` · Priority **High** · 5 pts · Labels: `ml`, `M1`, `w9`

```text
Serve recommendations from cache so the API stays fast.

Acceptance criteria:
- Nightly job writes one recommendations document per active user with items, scores,
  reasons, modelVersion and strategy.
- Unique index on userId; documents carry generatedAt and a TTL of 6-12 hours.
- NestJS reads the cache first and only calls ML live for session-based refreshes.
- Job runtime measured and acceptable for the seeded user base.
```

### Recommendation fallback chain in NestJS

`Task` · Priority **Highest** · 5 pts · Labels: `backend`, `M1`, `resilience`, `w9`

```text
Guarantee the site never renders an empty recommendation rail.

Acceptance criteria:
- Chain implemented: ML personalized -> cached recommendations -> category-affinity picks
  -> global popular.
- Each fallback level logged so degradation is observable.
- Verified by stopping the ML service and by wiping the cache.
- Reason label returned to the UI so the explanation badge stays truthful.
```

### Anonymous visitor tracking and merge on login

`Task` · Priority **Medium** · 5 pts · Labels: `backend`, `M1`, `w9`

```text
Capture pre-login behaviour and keep it.

Acceptance criteria:
- anonId cookie issued on first visit and attached to all events.
- On login, anonymous events are re-attributed to the user id.
- Merge is idempotent and does not duplicate events.
- Session-based recommendations work for logged-out visitors.
```

---

## EP7 M2 Demand Forecasting Engine

*Sales aggregation, baselines, classical time series and LightGBM 30-day forecasting.*

`Epic` · Priority **Highest** · Labels: `fyp`, `ml`, `M2`

### Nightly sales_daily aggregation pipeline in the backend

`Task` · Priority **Highest** · 5 pts · Labels: `backend`, `M2`, `w10`

```text
Keep the forecasting training table current from live orders.

Acceptance criteria:
- Aggregation over orders produces per-product per-day unitsSold, revenue, avgPrice, discountPct.
- Calendar flags recomputed; missing days filled with explicit zeros.
- Upsert keyed on {productId, date} so re-runs are safe.
- Runs nightly via the scheduler and is manually triggerable.
```

### Level 0 forecasting baselines

`Story` · Priority **Highest** · 5 pts · Labels: `ml`, `M2`, `baseline`, `w10`

```text
Build the baselines that the proposed model must beat.

Acceptance criteria:
- Naive (last week average), moving average (7/14/28 day) and seasonal naive implemented.
- MAE and RMSE computed for each on the held-out period.
- Results recorded as the baseline rows of the forecasting evaluation table.
- Baseline code kept runnable for the report comparison.
```

### Time-based split and rolling-origin cross validation framework

`Task` · Priority **Highest** · 8 pts · Labels: `ml`, `M2`, `evaluation`, `w10`

```text
Evaluate honestly - random splits on time series are the classic FYP failure.

Acceptance criteria:
- Temporal split implemented: train on the first 80% of days, test on the last 20%.
- Rolling-origin cross validation with 3-4 folds implemented and reused by every model.
- A leakage check asserts that no feature uses data from on or after the prediction date.
- The protocol is documented in docs/06-ml-design.md and used for all reported numbers.
```

### Level 1 classical time series (SARIMA / Prophet)

`Story` · Priority **High** · 8 pts · Labels: `ml`, `M2`, `w11`

```text
Add the classical comparison models.

Acceptance criteria:
- SARIMA (statsmodels) fitted for products with sufficiently long history.
- Prophet configured with weekly and yearly seasonality plus custom Pakistani holidays
  (Ramzan, Eid) as holiday regressors.
- Both evaluated under the same rolling-origin protocol.
- Results added to the comparison table; per-model fit time recorded.
```

### Feature table builder for the LightGBM model

`Task` · Priority **Highest** · 8 pts · Labels: `ml`, `M2`, `w11`

```text
Engineer the tabular features from sales_daily plus behaviour signals.

Feature groups:
- Lags: units_lag_1, 7, 14, 28
- Rolling: roll_mean_7, roll_mean_28, roll_std_7, roll_max_7
- Calendar: dayofweek, weekofyear, month, is_weekend, is_holiday, days_to_holiday
- Price: price, discount_pct, price_vs_28day_avg
- Promo: promo_flag, promo_intensity
- Product: categoryId, brand, price_band, product_age_days
- Behaviour: views_lag_7, cart_adds_lag_7 (strong signal and a differentiator for this project)

Acceptance criteria:
- All lag features correctly shifted so no future information leaks.
- Behaviour features joined from user_events aggregates.
- Feature importance plot produced after training.
```

### Level 2 LightGBM global forecasting model

`Story` · Priority **Highest** · 13 pts · Labels: `ml`, `M2`, `w11`

```text
Train the proposed final model - one global model across all products.

Acceptance criteria:
- LGBMRegressor trained (n_estimators 800, learning_rate 0.05, num_leaves 63 as the starting
  point) with early stopping on a validation fold.
- Evaluated with the rolling-origin protocol; MAE, RMSE and MAPE reported per fold.
- Beats the naive baseline by >= 30% MAE (proposal objective 2).
- Model artifact versioned as lgbm_vN and loaded by the ML service.
- Feature importance and error analysis by category included.
```

### Stock-out censoring handling

`Task` · Priority **High** · 5 pts · Labels: `ml`, `M2`, `w11`

```text
Zero sales during a stock-out is not zero demand - handling this properly is a strong
report point.

Acceptance criteria:
- Days with stockOutHours above a threshold are masked from training targets or flagged.
- Impact on MAE measured with and without the correction.
- Approach and the measured effect written into the methodology chapter.
```

### Forecast endpoint and forecasts collection persistence

`Story` · Priority **Highest** · 8 pts · Labels: `ml`, `M2`, `w11`

```text
Serve the 30-day forecast to the admin dashboard.

Acceptance criteria:
- POST /ml/forecast returns predictions with date, predictedUnits, lower and upper bounds.
- Prediction intervals derived from residual spread.
- Results persisted to forecasts with generatedAt, horizonDays, totalPredicted, modelVersion
  and metrics {mae, rmse, mape}.
- GET /admin/forecast?productId=&days=30 exposed by NestJS with a cache-first read.
```

### Stock risk scoring and reorder suggestion engine

`Story` · Priority **Highest** · 8 pts · Labels: `backend`, `M2`, `w12`

```text
As an admin I want to know what to restock and by how much.

Acceptance criteria:
- coverage = stock / predicted computed per product.
- Risk banding: < 0.7 HIGH, 0.7-1.0 MEDIUM, > 1.0 LOW.
- Reorder quantity = predicted + safety_stock (z * std_error) - stock.
- Results surfaced through GET /admin/forecast/alerts and written to stock_alerts.
- Worked example matching the guide reproduced in the report.
```

### Daily forecast batch job

`Task` · Priority **Medium** · 5 pts · Labels: `ml`, `M2`, `w12`

```text
Regenerate forecasts on a schedule so the dashboard is never stale.

Acceptance criteria:
- Daily cron regenerates the 30-day horizon for all active products.
- Job logs duration, product count and the model version used.
- Failures raise an admin notification; the previous forecast remains readable.
- Manual trigger available through POST /admin/ml/retrain for the demo.
```

---

## EP8 M3 Customer Behavior Analytics

*Interest profiles, segmentation and funnel analytics from the event stream.*

`Epic` · Priority **Medium** · Labels: `fyp`, `analytics`, `M3`

### Nightly user_profiles computation

`Task` · Priority **High** · 8 pts · Labels: `ml`, `M3`, `w13`

```text
Build the interest profile that powers personalization and segmentation.

Acceptance criteria:
- categoryAffinity and brandAffinity computed from weighted, time-decayed events.
- priceRange {min, max, avg} derived from viewed and purchased products.
- lastActiveAt and updatedAt maintained.
- Job runs nightly in Python (pandas) and upserts into user_profiles.
- Affinity values verified as sane for a hand-checked sample user.
```

### Customer segmentation

`Story` · Priority **Medium** · 8 pts · Labels: `ml`, `M3`, `w13`

```text
As an admin I want customers grouped into actionable segments.

Acceptance criteria:
- Segments assigned: new, window shopper, high intent, loyal, at risk.
- Rules (or clustering) documented with the thresholds used.
- Segment written to user_profiles.segment and refreshed nightly.
- Segment distribution charted for the report.
```

### Funnel and behaviour aggregation pipelines

`Task` · Priority **Medium** · 8 pts · Labels: `backend`, `M3`, `w13`

```text
Produce the numbers behind the admin analytics screens.

Acceptance criteria:
- Funnel aggregation: views -> cart -> purchase with drop-off percentages.
- Top products, category-wise share, session duration distribution and cart abandonment rate.
- Implemented as MongoDB aggregation pipelines using the documented indexes.
- Query latency measured on the full seeded event volume.
```

### Analytics API endpoints

`Story` · Priority **Medium** · 5 pts · Labels: `backend`, `M3`, `w13`

```text
Expose analytics to the admin dashboard.

Acceptance criteria:
- GET /admin/analytics/overview returns revenue, orders, AOV, conversion rate, active users
  and recommendation CTR.
- GET /admin/analytics/funnel returns the funnel stages with drop-off.
- GET /admin/analytics/segments returns segment counts and definitions.
- All routes admin-guarded; responses shaped for direct chart consumption.
```

---

## EP9 Frontend Customer App (React)

*Customer-facing React SPA: catalog, cart, orders, recommendation UI and event tracking.*

`Epic` · Priority **High** · Labels: `fyp`, `frontend`

### Bootstrap React app with routing and layout

`Task` · Priority **Highest** · 5 pts · Labels: `frontend`, `w3`

```text
Set up the frontend shell.

Acceptance criteria:
- Vite + React + TypeScript project created; Tailwind, React Router, TanStack Query, axios
  and Recharts installed.
- Navbar, Footer, customer layout and admin layout implemented.
- Protected routes redirect unauthenticated users; admin routes reject customers.
- Shared axios instance with the base URL from environment variables.
```

### Auth pages with token refresh interceptor

`Story` · Priority **High** · 5 pts · Labels: `frontend`, `auth`, `w3`

```text
As a user I want to log in and stay logged in.

Acceptance criteria:
- Login and register pages with client-side validation and clear error states.
- Tokens stored safely; auth state available app-wide.
- Axios response interceptor refreshes on 401 and retries the original request once.
- Logout clears state and redirects.
```

### Product listing page with filters, sort and pagination

`Story` · Priority **High** · 8 pts · Labels: `frontend`, `w4`

```text
As a customer I want to narrow the catalog down to what I want.

Acceptance criteria:
- Grid layout with category, price range and brand filters plus sorting.
- Pagination wired to the products API; filter state reflected in the URL.
- Skeleton loaders while fetching and an empty state when nothing matches.
- Product card clicks emit click events through the tracking helper.
```

### Product detail page with Similar Products carousel

`Story` · Priority **High** · 8 pts · Labels: `frontend`, `w4`

```text
As a customer I want full product detail plus relevant alternatives.

Acceptance criteria:
- Images, specifications, price, stock status and add-to-cart implemented.
- Similar Products and Customers Also Bought carousels rendered from the recommendation API.
- A view event fires when the page is open for more than 3 seconds, carrying dwellTimeSec.
- Graceful rendering when recommendation data is unavailable.
```

### Cart, checkout, order success and order history

`Story` · Priority **High** · 8 pts · Labels: `frontend`, `w5`

```text
As a customer I want to complete a purchase and review past orders.

Acceptance criteria:
- Cart page with quantity update, removal and server-computed totals.
- Checkout with address form and dummy/COD payment (real gateways are out of scope).
- Order success screen and My Orders history with status.
- Purchase events emitted per item on successful order placement.
```

### Home page with Recommended For You and Trending

`Story` · Priority **Highest** · 8 pts · Labels: `frontend`, `M1`, `w6`

```text
As a customer I want a personalized landing page.

Acceptance criteria:
- Hero section, Recommended For You rail, Trending rail and category tiles.
- Recommendations fetched through TanStack Query with loading and error states.
- Logged-out visitors see trending plus session-based suggestions instead of a blank rail.
- Rail impressions tracked so recommendation CTR can be measured later.
```

### Recommendation explanation badges

`Task` · Priority **Medium** · 3 pts · Labels: `frontend`, `M1`, `w7`

```text
Show why each product was recommended - a visible differentiator and easy marks.

Acceptance criteria:
- Badge rendered from the reason field (similar_users, content, popular).
- Human-readable copy, e.g. "Because you viewed Gaming Laptops".
- Badge text stays truthful when the fallback chain degrades to popular products.
```

### Wishlist, profile and interest onboarding

`Story` · Priority **Medium** · 5 pts · Labels: `frontend`, `w8`

```text
As a new customer I want to declare interests so recommendations start useful.

Acceptance criteria:
- Wishlist page with add/remove; toggles emit wishlist events.
- Profile page allows editing the 3 selected interest categories.
- Interests feed the cold-start strategy for users with no history.
```

### Event tracking helper wired across the app

`Task` · Priority **Highest** · 5 pts · Labels: `frontend`, `tracking`, `w6`

```text
Implement frontend/src/api/track.ts and call it from every meaningful action.

Acceptance criteria:
- track(eventType, payload) posts to /events with a sessionId and swallows errors so
  tracking never blocks the UI.
- Wired to: product card click, product detail view with dwell time, search submit,
  add/remove cart, wishlist toggle, order placed, rating submit.
- Verified by watching user_events fill during a manual walkthrough.
```

### Reusable component library and UX states

`Task` · Priority **Medium** · 8 pts · Labels: `frontend`, `w8`

```text
Build the shared components that keep the UI consistent.

Acceptance criteria:
- ProductCard, ProductCarousel, RecommendationSection, FilterSidebar, StatCard,
  ForecastChart, StockRiskBadge, EmptyState and Skeleton implemented.
- Loading skeletons, empty states and error boundaries used consistently.
- Components documented so the report can show the design system.
```

### Responsive and accessibility pass

`Task` · Priority **Low** · 5 pts · Labels: `frontend`, `w15`

```text
Make the app presentable on any screen during the demo.

Acceptance criteria:
- Customer pages usable at mobile, tablet and desktop widths.
- Admin tables scroll or collapse rather than breaking layout on small screens.
- Keyboard navigation and alt text on images; colour contrast checked.
```

---

## EP10 Admin Dashboard

*Admin console: KPIs, catalog and order management, analytics, forecast and alerts.*

`Epic` · Priority **High** · Labels: `fyp`, `frontend`, `admin`

### Admin layout and protected admin routing

`Task` · Priority **High** · 3 pts · Labels: `frontend`, `admin`, `w12`

```text
Separate the admin console from the customer app.

Acceptance criteria:
- Admin shell with sidebar navigation to all eight admin screens.
- Routes guarded client-side and enforced server-side by the roles guard.
- Non-admin access attempts redirect cleanly.
```

### Overview KPI dashboard

`Story` · Priority **High** · 5 pts · Labels: `frontend`, `admin`, `w12`

```text
As an admin I want the health of the business at a glance.

Acceptance criteria:
- KPI cards: total revenue, orders, AOV, conversion rate, active users, recommendation CTR.
- Data from GET /admin/analytics/overview with loading and error states.
- Date-range selector applied to all cards.
```

### Products management UI

`Story` · Priority **Medium** · 8 pts · Labels: `frontend`, `admin`, `w12`

```text
As an admin I want to manage the catalog.

Acceptance criteria:
- Paginated, searchable product table with stock and status columns.
- Create and edit forms with validation, image handling and category selection.
- Activate/deactivate rather than hard delete.
```

### Orders management UI

`Story` · Priority **Medium** · 5 pts · Labels: `frontend`, `admin`, `w12`

```text
As an admin I want to process orders.

Acceptance criteria:
- Order table with filters by status and date, and a detail drawer showing items.
- Status transitions triggerable from the UI and reflected for the customer.
```

### Sales analytics page

`Story` · Priority **Medium** · 8 pts · Labels: `frontend`, `admin`, `w13`

```text
As an admin I want to understand sales performance.

Acceptance criteria:
- Revenue trend chart (daily/weekly), top 10 products, category share and the conversion
  funnel with drop-off percentages, all rendered with Recharts.
- Charts read directly from the analytics endpoints without client-side recomputation.
```

### Demand Forecast page - the project's star feature

`Story` · Priority **Highest** · 13 pts · Labels: `frontend`, `admin`, `M2`, `w12`

```text
As an admin I want to see predicted demand and act on it.

Acceptance criteria:
- Table with columns: Product, Stock, Predicted 30-day, Coverage, Risk, Suggested action.
- Chart overlaying past actual sales (solid), forecast (dashed) and the confidence band.
- Risk banding colour-coded (HIGH < 0.7, MEDIUM 0.7-1.0, LOW > 1.0).
- Model accuracy card showing MAE / RMSE / MAPE and last-trained timestamp.
- Product selector and horizon selector wired to the forecast API.
- Degrades to the last persisted forecast with a stale-data banner if ML is down.
```

### Inventory and stock alerts page

`Story` · Priority **Medium** · 5 pts · Labels: `frontend`, `admin`, `M2`, `w12`

```text
As an admin I want a prioritised restocking worklist.

Acceptance criteria:
- Active alerts listed with risk level, coverage and suggested reorder quantity.
- Sorted by urgency; alerts dismissible or markable as actioned.
- Links through to the product record.
```

### Customer segments page

`Story` · Priority **Medium** · 8 pts · Labels: `frontend`, `admin`, `M3`, `w13`

```text
As an admin I want to see who my customers are.

Acceptance criteria:
- Segment distribution chart plus a category interest heatmap.
- Session duration distribution and cart abandonment rate displayed.
- Drill-down list of users per segment.
```

### Recommendation performance page

`Story` · Priority **High** · 8 pts · Labels: `frontend`, `admin`, `M1`, `evaluation`, `w13`

```text
As an admin I want to know whether the recommender actually works - this is the project's
online evaluation.

Acceptance criteria:
- Impressions, clicks, CTR and add-to-cart rate for recommended vs non-recommended products.
- Trend over time and breakdown by strategy (hybrid / content / popular).
- Numbers reusable directly in the evaluation chapter.
```

---

## EP11 M4 Generative AI Shopping Assistant

*Optional extension module: natural-language shopping assistant with catalog guardrails.*

`Epic` · Priority **Low** · Labels: `fyp`, `ml`, `M4`, `optional`

### Natural language query to structured filter

`Story` · Priority **Low** · 8 pts · Labels: `ml`, `M4`, `optional`, `w14`

```text
As a customer I want to ask for products in plain language.

Example: "Mujhe 150,000 ke andar gaming laptop chahiye" ->
{ category: "laptop", tags: ["gaming"], maxPrice: 150000 }

Acceptance criteria:
- LLM used with function calling / structured output to extract filters only - it must never
  invent products.
- Extraction schema validated; unparseable queries fall back to keyword search.
- Prompt and schema documented for the report.
```

### Assistant API with catalog guardrails

`Story` · Priority **Low** · 8 pts · Labels: `backend`, `M4`, `optional`, `w14`

```text
Keep the assistant honest.

Acceptance criteria:
- POST /assistant/query runs the extracted filters through the existing product search and
  recommendation ranking.
- Only real catalog products are returned; price and stock always read from the database.
- Rate limited and admin-observable.
```

### Explanation generation for the top results

`Task` · Priority **Low** · 5 pts · Labels: `ml`, `M4`, `optional`, `w14`

```text
Let the LLM do what it is good at: explaining, not retrieving.

Acceptance criteria:
- Top 3 products passed back to the LLM for a comparison and reasoning summary.
- Output constrained to the supplied product facts.
- Latency measured; response streamed or a typing state shown.
```

### Assistant chat UI

`Story` · Priority **Low** · 8 pts · Labels: `frontend`, `M4`, `optional`, `w14`

```text
As a customer I want a chat interface for shopping help.

Acceptance criteria:
- Message list, input box, typing/streaming state and inline product cards.
- Errors and empty results handled with a helpful message.
- Conversation history retained for the session.
```

### Rule-based NLU fallback for the no-API-budget path

`Task` · Priority **Low** · 5 pts · Labels: `ml`, `M4`, `optional`, `w14`

```text
Ensure M4 is demonstrable even without paid LLM access.

Acceptance criteria:
- Regex and keyword extraction for category, tags and price bounds.
- Same filter schema as the LLM path so the downstream code is unchanged.
- Documented in the report as a hybrid NLU approach.
```

---

## EP12 Evaluation & Testing

*Offline ML evaluation, unit/integration/API tests, performance and usability testing.*

`Epic` · Priority **Highest** · Labels: `fyp`, `evaluation`

### Offline recommendation evaluation harness

`Task` · Priority **Highest** · 8 pts · Labels: `evaluation`, `M1`, `w14`

```text
Build the reusable evaluation script every recommender model is scored with.

Acceptance criteria:
- Temporal split (last 20% of time) and leave-one-out (each user's last purchase) supported.
- Metrics implemented: Precision@10, Recall@10, MAP@10, NDCG@10, Hit Rate@10 and catalog Coverage.
- Runs from one command against any model and emits a comparison row.
- Unit tested against a small hand-computed fixture.
```

### Recommendation results comparison table

`Task` · Priority **Highest** · 5 pts · Labels: `evaluation`, `M1`, `docs`, `w14`

```text
Produce the headline results table for the report.

Acceptance criteria:
- Rows: Popularity (baseline), Content-Based, Collaborative (ALS), Hybrid (proposed).
- Columns: Precision@10, Recall@10, NDCG@10, Coverage.
- Percentage improvement over baseline stated explicitly.
- Objective 1 (>= 25% Precision@10 improvement) confirmed met or the gap explained.
```

### Offline forecasting evaluation and comparison table

`Task` · Priority **Highest** · 8 pts · Labels: `evaluation`, `M2`, `docs`, `w14`

```text
Score every forecasting model under an identical protocol.

Acceptance criteria:
- MAE, RMSE, MAPE and WAPE/sMAPE implemented; MAPE guarded against zero-sales days.
- Rows: Naive, Moving Average (7d), SARIMA/Prophet, LightGBM (proposed).
- Objective 2 (>= 30% MAE improvement over naive) confirmed met or the gap explained.
- All numbers produced by the rolling-origin protocol, never a random split.
```

### Forecast vs actual graphs and error analysis

`Task` · Priority **High** · 5 pts · Labels: `evaluation`, `M2`, `docs`, `w14`

```text
Explain where the model is weak - examiners reward this.

Acceptance criteria:
- Forecast vs actual plots for a representative set of products.
- Error breakdown by category, price band and demand intermittency.
- Written analysis of which segments the model struggles with and why.
```

### Unit tests for NestJS services (Jest)

`Task` · Priority **Medium** · 8 pts · Labels: `testing`, `backend`, `w15`

```text
Cover the logic that would silently corrupt results.

Acceptance criteria:
- Tests for auth, order stock decrement, event validation, ML client fallback and
  risk/reorder calculation.
- Suite runs in CI and passes from a clean checkout.
- Coverage summary captured for the report appendix.
```

### Unit tests for the ML service (pytest)

`Task` · Priority **Medium** · 5 pts · Labels: `testing`, `ml`, `w15`

```text
Cover feature engineering and scoring.

Acceptance criteria:
- Tests for event weighting and time decay, lag feature shifting (leakage guard),
  hybrid score composition and metric implementations.
- pytest passes from a clean venv.
```

### Integration test of the full purchase flow

`Task` · Priority **Medium** · 5 pts · Labels: `testing`, `w15`

```text
Prove the chain works end to end.

Acceptance criteria:
- Automated flow: register -> login -> browse -> add to cart -> place order -> order appears
  in history -> purchase events written.
- Runs against a test database and cleans up after itself.
```

### Postman API collection

`Task` · Priority **Medium** · 3 pts · Labels: `testing`, `docs`, `w15`

```text
Package the API for demonstration and the report appendix.

Acceptance criteria:
- Collection covering every public endpoint plus auth token handling via environment variables.
- Example requests and responses saved.
- Screenshots exported for the appendix.
```

### Performance test of the recommendation API

`Task` · Priority **Medium** · 5 pts · Labels: `testing`, `performance`, `w15`

```text
Validate the non-functional target.

Acceptance criteria:
- Load test at 100 concurrent users against GET /recommendations/me.
- p95 latency < 500ms with the cache warm; results recorded with and without cache.
- Bottlenecks identified and either fixed or documented as future work.
```

### Usability study with 8-10 participants

`Task` · Priority **Low** · 5 pts · Labels: `testing`, `evaluation`, `w15`

```text
Add a human evaluation dimension to the report.

Acceptance criteria:
- 8-10 participants complete a scripted set of tasks.
- 5-point questionnaire administered and the SUS score computed.
- Qualitative feedback themed; at least the top issues fixed before submission.
```

### Online evaluation: recommendation CTR tracking

`Task` · Priority **High** · 5 pts · Labels: `evaluation`, `M1`, `w15`

```text
Measure the recommender in production, not just offline.

Acceptance criteria:
- Impressions and clicks recorded per recommendation rail with the strategy label.
- CTR and add-to-cart rate compared for recommended vs non-recommended products.
- Results feed the admin recommendation performance page and the evaluation chapter.
```

---

## EP13 Deployment & DevOps

*Docker, cloud deployment of all three tiers, scheduled jobs and production hardening.*

`Epic` · Priority **Medium** · Labels: `fyp`, `devops`

### Docker Compose for local development

`Task` · Priority **Medium** · 5 pts · Labels: `devops`, `w15`

```text
One command to bring the whole stack up.

Acceptance criteria:
- docker-compose.yml defines mongo, ml, backend (and optionally redis) with a persistent
  mongo volume.
- docker compose up starts everything and the frontend can talk to the backend.
- Documented in the README.
```

### MongoDB Atlas setup and data migration

`Task` · Priority **Medium** · 3 pts · Labels: `devops`, `w15`

```text
Move from local MongoDB to a hosted cluster.

Acceptance criteria:
- Atlas M0 cluster created with IP allowlist and a least-privilege database user.
- Indexes recreated on the cluster.
- Seed data loaded and verified from the deployed backend.
```

### Deploy the NestJS backend

`Task` · Priority **Medium** · 5 pts · Labels: `devops`, `w15`

```text
Publish the API.

Acceptance criteria:
- Deployed to Render/Railway/Fly.io with environment variables configured.
- Health endpoint reachable over HTTPS; CORS limited to the frontend origin.
- Deployment steps documented for reproducibility.
```

### Deploy the React frontend

`Task` · Priority **Medium** · 3 pts · Labels: `devops`, `w15`

```text
Publish the customer and admin apps.

Acceptance criteria:
- Deployed to Vercel/Netlify with the production API base URL.
- SPA routing fallback configured so deep links work.
- Live URL recorded in the report.
```

### Deploy the Python ML service

`Task` · Priority **Medium** · 8 pts · Labels: `devops`, `ml`, `w15`

```text
Publish the ML microservice privately.

Acceptance criteria:
- Dockerised and deployed to Render/Railway/Hugging Face Spaces.
- Not publicly callable without the API key.
- Model artifacts stored on a persistent volume or object storage, not baked into ephemeral disk.
- Cold-start behaviour measured and acceptable.
```

### Scheduled jobs in production

`Task` · Priority **Medium** · 5 pts · Labels: `devops`, `w15`

```text
Automate retraining and aggregation on the deployed system.

Acceptance criteria:
- Render cron or a scheduled GitHub Actions workflow runs nightly aggregation, profile
  refresh, recommendation precompute and the daily forecast batch.
- Job outcomes logged and visible; failures alert the team.
```

### Production seed data load and demo readiness

`Task` · Priority **High** · 3 pts · Labels: `devops`, `demo`, `w16`

```text
An empty site demos badly.

Acceptance criteria:
- Catalog, users, events, sales history, recommendations and forecasts all populated in production.
- Demo accounts (customer and admin) verified working.
- A scripted demo walkthrough rehearsed against the live URLs.
```

---

## EP14 Documentation & FYP Report

*SRS, design docs, results, final report, slides, demo video and viva preparation.*

`Epic` · Priority **Highest** · Labels: `fyp`, `docs`

### Software Requirements Specification (SRS)

`Task` · Priority **High** · 8 pts · Labels: `docs`, `w14`

```text
Write docs/02-srs.md.

Acceptance criteria:
- Functional requirements derived from the use cases and module list.
- Non-functional requirements including the latency, availability and fallback targets from
  the architecture ticket.
- Traceability from each objective to the requirements that satisfy it.
```

### Evaluation results document

`Task` · Priority **Highest** · 8 pts · Labels: `docs`, `evaluation`, `w15`

```text
Write docs/07-evaluation-results.md.

Acceptance criteria:
- Both comparison tables (recommendation and forecasting) with improvement percentages.
- Forecast vs actual graphs, weight sensitivity table and coverage/diversity discussion.
- Online CTR results and the usability/SUS score.
- Every number traceable to a script or notebook that reproduces it.
```

### Final report chapters 1-8

`Task` · Priority **Highest** · 13 pts · Labels: `docs`, `w16`

```text
Assemble the report using the chapter mapping from the guide.

Chapter sources:
1 Introduction - scope and the over/under-stock problem
2 Literature review - 12-20 papers on CF/content/hybrid recommenders and ARIMA/Prophet/GBDT forecasting
3 Requirements - SRS and use cases
4 System design - architecture, database, API, UI, sequence diagrams
5 Methodology - ML design, features, algorithms, training protocol
6 Implementation - code walkthrough and screenshots
7 Results and evaluation - the evaluation document
8 Conclusion and future work - cold start, synthetic data, real-time streaming limits

Acceptance criteria:
- All chapters drafted, cross-referenced and proofread.
- Every claim backed by a figure, table or screenshot from the repository.
```

### Presentation slides

`Task` · Priority **High** · 5 pts · Labels: `docs`, `w16`

```text
Build the defence deck.

Acceptance criteria:
- Narrative: problem -> solution -> architecture -> demo -> results -> future work.
- Architecture diagram, both results tables and the forecast dashboard screenshot included.
- Timed to the allotted slot in a rehearsal.
```

### Record a backup demo video

`Task` · Priority **High** · 3 pts · Labels: `docs`, `demo`, `w16`

```text
Insurance against live-demo failure.

Acceptance criteria:
- Full walkthrough recorded: signup, browse, search, product detail with similar products,
  cart, order, personalized home page, admin analytics and the demand forecast page.
- Narrated, under the presentation time limit, and stored somewhere accessible offline.
```

### Viva preparation Q&A document

`Task` · Priority **Highest** · 5 pts · Labels: `docs`, `w16`

```text
Prepare answers to the questions that are always asked.

Acceptance criteria:
- Written answers for: cold-start handling, why hybrid over pure CF, why LightGBM over ARIMA,
  how data leakage was prevented, why a temporal split, how the system was evaluated,
  why synthetic data was used and how it was disclosed, what happens when the ML service fails.
- Each answer points to the code or figure that proves it.
- Rehearsed as a mock viva with the team.
```

### Definition of Done final submission checklist

`Task` · Priority **Highest** · 3 pts · Labels: `docs`, `w16`

```text
Verify every deliverable before submitting.

System: customer flow end to end; personalized home recommendations with explanations;
similar and also-bought sections; user_events filling from real usage; admin products,
orders and analytics; 30-day forecast graph, risk table and restock suggestions; behavior
segments page; optional assistant; verified fallbacks with the ML service stopped.

ML: baseline and proposed results for both modules; both metric tables; forecast vs actual
graph; reproducible training scripts; clean commented notebooks.

Docs: SRS, design docs, evaluation results, final report, slides, live URLs or offline demo
plus the backup video, and viva preparation complete.

Acceptance criteria:
- Every line above ticked off and evidenced.
```

---


https://claude.ai/code/artifact/09be83ad-c7b3-4867-b57d-5d78f38a38fb?via=auto_preview