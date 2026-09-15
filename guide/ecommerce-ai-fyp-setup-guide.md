# AI-Powered E-Commerce Recommendation & Demand Prediction System
## Complete Setup, Design & Build Guide (FYP Roadmap)

> **⚠️ STACK UPDATE (v2).** Yeh guide originally **React+Vite / NestJS / MongoDB** ke liye likhi gayi thi. Architecture ab **Next.js 16 (App Router) / FastAPI ×2 / PostgreSQL 17 + Meilisearch** par shift ho chuki hai.
> - Authoritative design ab in docs mein hai: [`../docs/03-architecture.md`](../docs/03-architecture.md), [`../docs/04-api-contract.md`](../docs/04-api-contract.md), [`../docs/05-database-design.md`](../docs/05-database-design.md), [`../docs/06-ml-design.md`](../docs/06-ml-design.md), [`../docs/11-search-design.md`](../docs/11-search-design.md), [`../docs/08-deployment.md`](../docs/08-deployment.md), aur [`architure-solution/project-file-structure.md`](architure-solution/project-file-structure.md).
> - **Jo cheezein wesi hi valid hain:** 4 modules aur scope (§1), data strategy (§7), ML methodology — recommendation levels, forecasting levels, features, evaluation protocol (§9–§14, §17). In sections ko stack-agnostic samajh kar parhein.
> - **Jo replace ho gaya:** §2 tech stack, §4 repo structure, §6.2 architecture diagram, §6.3 "MongoDB collections", §8 "NestJS build order", §11 "React/Vite build order", §6.4 endpoint list ka NestJS phrasing. In ke liye upar-wale docs dekhein.
> - Mapping table: MongoDB collections → PostgreSQL tables `../docs/05-database-design.md` §9 mein hai.

**Stack (v1, historical):** React + NestJS + MongoDB + Python (FastAPI ML Service)
**Guide ka maqsad:** aap ko step-by-step batana ke project kahan se start karna hai, kya kya design karna hai, kis order mein banana hai, aur kis cheez par kitna time dena hai.

---

## 0. Sab se pehle 3 golden rules

Ye 3 rules poore project ka result decide karenge:

1. **Vertical slice pehle, perfection baad mein.**
   Week 4 tak aap ke paas ek chhoti si working chain honi chahiye:
   `React page → NestJS API → MongoDB → Python ML service → recommendation wapas screen par`.
   Chahe recommendation "top 10 most popular products" jaisi bewakoof-si ho — chain zaroor chalni chahiye. Baad mein sirf model badalna hai, architecture nahi.

2. **Data pehle, model baad mein.**
   Nayi website par koi user history nahi hoti. Agar aap ne data ka intezaam pehle nahi kiya to Week 10 par aap ke paas train karne ke liye kuch nahi hoga. (Section 7 sab se important section hai — usko skip na karein.)

3. **Baseline zaroor banayein.**
   Har AI module ka pehle ek "dumb baseline" banayein (popularity-based recommendation, aur moving-average forecast). FYP report mein aap ka contribution isi baseline ke against measure hoga: *"hamara model baseline se X% behtar hai"*. Baseline ke baghair aap ke numbers ka koi matlab nahi.

---

## 1. Project scope freeze (Week 1 mein karein)

### 1.1 Final 4 modules

| # | Module | Input | Output | Kis ke liye |
|---|--------|-------|--------|-------------|
| M1 | Personalized Recommendation Engine | user behavior + product features | ranked product list | Customer |
| M2 | Demand Forecasting Engine | historical sales + calendar/price | next 30 days demand per product | Admin |
| M3 | Customer Behavior Analytics | event stream | segments, funnel, interest profile | Admin |
| M4 | Generative AI Shopping Assistant | natural language query | filtered + explained products | Customer |

> **Advice:** M1 + M2 core hain (inhi par grading hogi). M3 medium. M4 sab se aakhir mein — agar time bacha to. Proposal mein M4 ko "optional/extension module" likhein.

### 1.2 User roles

```
Customer  → browse, search, cart, order, recommendations, assistant
Admin     → products, orders, analytics, demand forecast, stock alerts
(Optional) Seller → apne products aur unka forecast
```

Teesra role sirf tab add karein jab team mein 3+ log hain.

### 1.3 In-scope vs Out-of-scope (proposal mein likhna zaroori hai)

| In scope | Out of scope (clearly likh dein) |
|---|---|
| Product catalog, cart, orders, order status | Real payment gateway (sirf dummy/COD/sandbox) |
| Event tracking + interest profile | Real-time streaming (Kafka etc.) |
| Recommendation (hybrid) | Multi-language / multi-currency |
| Demand forecast (30-day, per product) | Mobile app |
| Admin analytics dashboard | Delivery/rider tracking |

Out-of-scope likhne se supervisor ke sawaal kam ho jate hain aur scope creep nahi hota.

---

## 2. Tech stack — final decision

| Layer | Choice | Kyun |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | fast dev server, TS se bugs kam |
| UI | Tailwind CSS + shadcn/ui ya MUI | dashboard jaldi ban jata hai |
| Charts | Recharts | forecast graphs ke liye simple |
| Data fetching | TanStack Query (React Query) | caching + loading states free |
| Backend | NestJS + TypeScript | modular architecture, FYP report mein achha lagta hai |
| ODM | Mongoose | schema + indexes |
| DB | MongoDB (local dev + Atlas free tier prod) | flexible event documents |
| Auth | JWT (access + refresh) + bcrypt | standard |
| ML service | Python 3.11 + FastAPI + Uvicorn | ML libraries sirf Python mein hain |
| ML libs | pandas, numpy, scikit-learn, implicit, lightgbm, statsmodels/prophet | Section 10 dekhein |
| Cache (optional) | Redis | recommendation cache |
| Containers (optional) | Docker Compose | Mongo + Redis + ML service ek command mein |

**Zaroori baat:** ML ko NestJS ke andar `tensorflow.js` se karne ki koshish na karein. Alag Python service rakhna hi correct engineering hai aur report mein "microservice architecture" ke tor par likha ja sakta hai.

---

## 3. Tools install checklist (Day 1)

```bash
# Core
Node.js 20 LTS         # node -v
Python 3.11+           # python --version
MongoDB Community 7    # ya seedha MongoDB Atlas free cluster
Git + GitHub account

# GUI / helper tools
VS Code  (extensions: ESLint, Prettier, Tailwind, Python, Thunder Client)
MongoDB Compass        # data dekhne ke liye
Postman ya Thunder Client   # API testing
Figma (free)           # wireframes
draw.io / Mermaid      # architecture + ER diagrams
Jupyter Notebook       # ML experiments (VS Code ke andar chal jata hai)
```

Global installs:

```bash
npm i -g @nestjs/cli
```

---

## 4. Repository structure (monorepo — ek hi GitHub repo)

```
ecommerce-ai-platform/
├── README.md
├── docs/                        # FYP documentation (bohat important)
│   ├── 01-proposal.md
│   ├── 02-srs.md
│   ├── 03-architecture.png
│   ├── 04-er-diagram.png
│   ├── 05-api-contract.md
│   ├── 06-ml-design.md
│   └── 07-evaluation-results.md
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── api/                 # axios instance + endpoints
│   │   ├── components/
│   │   ├── features/            # products, cart, orders, admin, recommendations
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── store/               # auth/cart state
│   │   └── types/
├── backend/                     # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/  users/  products/  categories/
│   │   │   ├── cart/  wishlist/  orders/
│   │   │   ├── events/          # behavior tracking
│   │   │   ├── recommendations/ # ML service ka client
│   │   │   ├── forecast/        # ML service ka client
│   │   │   ├── analytics/  notifications/  admin/
│   │   ├── common/              # guards, interceptors, dto, filters
│   │   └── config/
├── ml-service/                  # Python FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── routers/             # recommend.py, forecast.py
│   │   ├── services/            # recommender.py, forecaster.py
│   │   ├── features/            # feature engineering
│   │   └── models/              # trained .pkl / .joblib files
│   ├── notebooks/               # experiments (report ke evidence)
│   ├── training/                # train_recommender.py, train_forecast.py
│   └── requirements.txt
├── data/                        # datasets + seed scripts (gitignore large files)
│   ├── raw/
│   ├── processed/
│   └── seed/
└── docker-compose.yml           # optional
```

**Rule:** `docs/` folder ko din pehle din se maintain karein. Report likhne ka 60% kaam yahi se ho jata hai.

---

## 5. Phase-wise roadmap (16 weeks — apni deadline ke hisaab se adjust karein)

| Week | Phase | Deliverable (proof) |
|---|---|---|
| 1 | Requirements + scope freeze | proposal, module list, in/out scope |
| 2 | Design | use case, architecture, ER/collections, API contract, wireframes |
| 2 | **Data strategy** | dataset download + inspection notebook |
| 3 | Environment + repo + auth | login/signup working, JWT |
| 4 | Products + categories + seed data | catalog page real data se |
| 4 | **Vertical slice** | popularity recommendation end-to-end |
| 5 | Cart, wishlist, orders | order place ho jata hai |
| 6 | Event tracking | `user_events` collection bhar rahi hai |
| 7–8 | Recommendation: content-based + collaborative | offline metrics table |
| 9 | Hybrid + cold start handling | scoring formula + results |
| 10 | Sales aggregation + forecasting baseline | MAE/RMSE baseline |
| 11 | Forecasting ML model (LightGBM/Prophet) | improved MAE/RMSE/MAPE |
| 12 | Admin dashboard + stock alerts | forecast graphs + risk table |
| 13 | Behavior analytics + segments | segment charts |
| 14 | AI shopping assistant (optional) | NL query → products |
| 15 | Testing, evaluation, deployment | live URLs + test report |
| 16 | Report + slides + demo rehearsal | final documents |

---

## 6. Design phase — kya kya design karna hai

Ye 6 design deliverables Week 2 mein banane hain. Coding se pehle.

### 6.1 Use case diagram
Actors: Customer, Admin, ML Service (system actor).
Key use cases: Register/Login, Browse, Search, View Product, Add to Cart, Checkout, Get Recommendations, Ask Assistant, Manage Products, View Analytics, View Demand Forecast, Receive Stock Alert.

### 6.2 System architecture diagram

```
        ┌──────────────────────────────┐
        │      React Frontend (SPA)     │
        │  Customer UI  |  Admin UI     │
        └──────────────┬───────────────┘
                       │ REST (JWT)
        ┌──────────────▼───────────────┐
        │        NestJS API Gateway     │
        │ auth users products orders    │
        │ events recommendations        │
        │ forecast analytics            │
        └───┬──────────────────┬────────┘
            │ Mongoose         │ HTTP (internal)
   ┌────────▼────────┐   ┌─────▼─────────────────┐
   │    MongoDB       │   │  Python FastAPI ML    │
   │ users products   │   │  /recommend/{userId}  │
   │ orders events    │◄──┤  /forecast/{prodId}   │
   │ sales_daily      │   │  /train (admin only)  │
   │ recommendations  │   │  models/*.joblib      │
   └──────────────────┘   └───────────────────────┘
                                   ▲
                          nightly batch training job
```

Report mein isi diagram ko explain karein: "loosely coupled microservice", "batch + real-time hybrid serving".

### 6.3 Database design (MongoDB collections)

```
users            products         categories
orders           order_items(embedded)
cart             wishlist         reviews
user_events      user_profiles    recommendations
sales_daily      forecasts        stock_alerts
```

Core schemas (Mongoose style):

```ts
// products
{
  _id, sku, title, description,
  categoryId, brand, price, discountPrice,
  attributes: { ram: "16GB", processor: "i7", color: "black" },
  tags: ["gaming", "laptop"],
  images: [String],
  stock: Number,
  ratingAvg: Number, ratingCount: Number,
  viewCount: Number, purchaseCount: Number,
  contentVector: [Number],        // content-based similarity ke liye
  isActive: Boolean, createdAt, updatedAt
}

// user_events  (system ka fuel — sab se important collection)
{
  _id, userId | anonId, sessionId,
  productId, categoryId,
  eventType: "view" | "click" | "search" | "add_to_cart"
           | "remove_from_cart" | "wishlist" | "purchase" | "rate",
  searchQuery: String,            // sirf search events par
  dwellTimeSec: Number,           // view par
  quantity: Number, price: Number,// purchase par
  device, source,
  timestamp: Date
}

// user_profiles  (nightly compute)
{
  userId,
  categoryAffinity: { "laptops": 0.90, "accessories": 0.80, "clothing": 0.10 },
  brandAffinity: { "dell": 0.7, "asus": 0.5 },
  priceRange: { min: 80000, max: 300000, avg: 165000 },
  segment: "high_intent_electronics",
  lastActiveAt, updatedAt
}

// sales_daily  (forecasting ka training data)
{
  productId, date,               // ek din ka aggregate
  unitsSold, revenue,
  avgPrice, discountPct,
  isWeekend, isHoliday, promoFlag,
  stockOutHours                  // demand censoring handle karne ke liye
}

// forecasts
{
  productId, generatedAt, horizonDays: 30,
  predictions: [{ date, predictedUnits, lower, upper }],
  totalPredicted: Number,
  modelVersion: "lgbm_v3",
  metrics: { mae: 8.2, rmse: 11.4, mape: 9.7 }
}

// recommendations (precomputed cache)
{
  userId, generatedAt,
  items: [{ productId, score, reason: "similar_users" | "content" | "popular" }],
  modelVersion, strategy: "hybrid"
}
```

**Indexes (skip na karein, warna dashboard slow hoga):**

```js
user_events:  { userId: 1, timestamp: -1 }, { productId: 1, eventType: 1 }
products:     { categoryId: 1, price: 1 }, text index on title+tags
sales_daily:  { productId: 1, date: 1 }   // unique compound
recommendations: { userId: 1 } unique
orders:       { userId: 1, createdAt: -1 }
```

### 6.4 API contract (Week 2 mein likh lein — frontend/backend parallel chal sakte hain)

```
AUTH        POST /auth/register  /auth/login  /auth/refresh   GET /auth/me
PRODUCTS    GET  /products?category=&q=&minPrice=&maxPrice=&sort=&page=
            GET  /products/:id        GET /products/:id/similar
CATEGORIES  GET  /categories
CART        GET/POST/PATCH/DELETE /cart
WISHLIST    GET/POST/DELETE /wishlist
ORDERS      POST /orders   GET /orders   GET /orders/:id
EVENTS      POST /events              (batch bhi: POST /events/bulk)
RECO        GET  /recommendations/me?limit=10
            GET  /recommendations/product/:id/related
            GET  /recommendations/trending
ASSISTANT   POST /assistant/query
ADMIN       CRUD /admin/products
            GET  /admin/analytics/overview
            GET  /admin/analytics/funnel
            GET  /admin/analytics/segments
            GET  /admin/forecast?productId=&days=30
            GET  /admin/forecast/alerts
            POST /admin/ml/retrain
```

Internal (NestJS → Python, browser se expose nahi):

```
POST /ml/recommend        { userId, limit, context }
POST /ml/similar-items    { productId, limit }
POST /ml/forecast         { productId, days }
POST /ml/train/recommender
POST /ml/train/forecast
GET  /ml/health
```

### 6.5 UI design — screens ki list (Figma mein wireframe banayein)

**Customer (11 screens):** Home (recommended + trending), Category listing + filters, Search results, Product detail (+ "Similar products", "Customers also bought"), Cart, Checkout, Order success, My orders, Wishlist, Profile, AI Assistant chat.

**Admin (8 screens):** Overview KPIs, Products list + add/edit, Orders, Customers + segments, Sales analytics, **Demand Forecast** (per-product graph + table), Inventory & stock alerts, Recommendation performance (CTR, conversion).

Design tips: pehle low-fidelity wireframe (boxes), phir ek consistent color/typography system chunein, uske baad code. Direct coding karne se UI bikhri hui lagti hai.

### 6.6 ML design document (`docs/06-ml-design.md`)
Ye likhna zaroori hai — supervisor sab se pehle yahi poochta hai:
- problem formulation (recommendation = top-N ranking; forecasting = time-series regression)
- data sources aur features
- algorithms (baseline → advanced)
- train/test split strategy
- evaluation metrics
- serving strategy (batch vs real-time)
- cold-start handling

---

## 7. Data strategy — sab se important section

Aap ki website nayi hai, uske paas history nahi. Solution 3 layers mein hai:

### 7.1 Public datasets (in ko base banayein)

| Dataset | Kis kaam ka | Kya milta hai |
|---|---|---|
| **RetailRocket Recommender System Dataset** (Kaggle) | recommendation (best fit) | 2.7M events: view / addtocart / transaction + item properties |
| **Online Retail II** (UCI) | demand forecasting (best fit) | 2 saal ke real invoices, daily/weekly aggregation possible |
| **Olist Brazilian E-Commerce** (Kaggle) | full e-commerce schema, reviews | orders, items, customers, reviews, geo |
| **Amazon Reviews / product metadata** (UCSD McAuley) | content-based | title, category, description, price, reviews |
| **H&M Personalized Fashion** (Kaggle) | recommendation + images | transactions + article metadata |
| **M5 Forecasting Accuracy** (Kaggle) | forecasting benchmark | Walmart daily sales, calendar, prices |
| MovieLens 100k | sirf seekhne ke liye | CF concepts 1 din mein samajh aa jate hain |

**Plan:** RetailRocket + Online Retail II se kaam ho jayega. Ek ko recommendation, doosre ko forecasting ke liye use karein — aur report mein yeh clearly mention karein.

### 7.2 Seeding pipeline (ye scripts banayein)

```
data/seed/
├── 01_load_products.py      # dataset → products collection (catalog)
├── 02_load_users.py         # anonymized users
├── 03_load_events.py        # dataset events → user_events
├── 04_build_sales_daily.py  # transactions → per-product per-day aggregate
└── 05_synthetic_generator.py# demo ke liye realistic naya data
```

`05_synthetic_generator.py` mein realism ke liye ye rules dalein:
- 80/20 popularity (Zipf distribution) — kuch products bohat popular
- funnel probabilities: view 100% → cart ~10% → purchase ~3%
- session-based browsing (ek session mein 1–2 categories)
- seasonality: summer → AC/fans ↑, winter → jackets ↑, Ramzan → food/dates ↑, school season → bags/stationery ↑
- weekly pattern (weekend spike) + promo days (Black Friday spike)
- noise (random ±10%)

Isi generator se aap 12–24 mahine ka artificial history bana sakte hain — forecasting model ke liye kaafi.

### 7.3 Live tracking (real data)
Deployment ke baad jo real users aayein, un ke events `user_events` mein jate rahen. Report mein likh dein: "system real events par retrain hota hai; initial cold-start phase ke liye public + synthetic data use kiya gaya".

**Report mein honesty rakhein.** Synthetic data use karna ghalat nahi hai — chhupana ghalat hai. Likhein: *"Due to cold-start constraints of a new platform, models were trained and evaluated on the public RetailRocket and Online Retail II datasets, with a calibrated synthetic generator used for demo seeding."*

---

## 8. Backend build order (NestJS) — is exact sequence mein banayein

```bash
# project init
nest new backend
cd backend
npm i @nestjs/mongoose mongoose @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer @nestjs/axios axios
npm i -D @types/passport-jwt @types/bcrypt

# har module ek command se
nest g resource modules/products
nest g resource modules/events
```

Build order (har step ko Postman se test karein, phir agla step):

| # | Module | Kya banana hai | Done ka matlab |
|---|---|---|---|
| 1 | config + database | `.env`, MongooseModule.forRoot | app Mongo se connect |
| 2 | auth + users | register, login, JWT guard, roles guard (`@Roles('admin')`) | protected route chal raha hai |
| 3 | categories + products | CRUD, pagination, filter, sort, text search | catalog API ready |
| 4 | seed | products dataset se import | DB mein 2000+ products |
| 5 | **recommendations (stub)** | trending/popular endpoint (Mongo aggregation) | vertical slice complete |
| 6 | cart + wishlist | user-scoped operations | cart persist ho raha hai |
| 7 | orders | order create + stock decrement (transaction), status flow | order place ho gaya |
| 8 | events | POST /events, bulk insert, validation | events collection bhar rahi hai |
| 9 | ml-client (common) | HttpService wrapper + timeout + fallback | ML down ho to bhi site chalti rahe |
| 10 | recommendations (real) | ML service call + Mongo cache + fallback to popular | personalized list aa rahi hai |
| 11 | analytics | aggregation pipelines (funnel, top products, segments) | admin charts ke numbers |
| 12 | forecast | ML forecast call + `forecasts` collection + alerts | forecast table + risk flags |
| 13 | notifications | low-stock alert, order status | admin ko alert dikh raha hai |
| 14 | scheduler | `@nestjs/schedule` cron: nightly aggregate + retrain trigger | automation |

**Zaroori engineering details (report mein points milte hain):**
- **Fallback chain:** `ML service se personalized → agar fail/khali → category-based → agar wo bhi nahi → global popular`. Kabhi khali screen nahi.
- **Timeout:** ML call par 800ms–1.5s timeout rakhein, warna page hang karega.
- **DTO validation:** `class-validator` har request par.
- **Roles:** customer vs admin guard alag.
- **Cache:** recommendations 6–12 ghante ke liye Mongo/Redis mein.

Example ML client (NestJS):

```ts
@Injectable()
export class MlClient {
  constructor(private http: HttpService) {}

  async recommend(userId: string, limit = 10) {
    try {
      const { data } = await firstValueFrom(
        this.http.post(`${process.env.ML_URL}/ml/recommend`,
          { userId, limit },
          { timeout: 1200 }),
      );
      return data.items;               // [{ productId, score, reason }]
    } catch (e) {
      this.logger.warn(`ML down, fallback: ${e.message}`);
      return null;                     // caller popular products dega
    }
  }
}
```

---

## 9. Behavior tracking design (M1 aur M3 ka foundation)

Frontend par ek chhota helper banayein aur **har meaningful action** par call karein:

```ts
// frontend/src/api/track.ts
export const track = (eventType: string, payload: object) =>
  api.post('/events', { eventType, sessionId: getSessionId(), ...payload })
     .catch(() => {});     // tracking kabhi UX ko block na kare
```

Kahan call karna hai:

| Screen/Action | Event |
|---|---|
| product card click | `click` |
| product detail open + 3s se zyada ruka | `view` (+ dwellTimeSec) |
| search submit | `search` (+ searchQuery) |
| add/remove cart | `add_to_cart` / `remove_from_cart` |
| wishlist toggle | `wishlist` |
| order placed | `purchase` (per item, quantity + price) |
| rating submit | `rate` |

**Weighting scheme** (interest profile banane ke liye — report mein table ke tor par dikhayein):

```
search      1
click       2
view        3   (+2 agar dwellTime > 30s)
wishlist    5
add_to_cart 8
purchase   15
```

Aur **time decay** lagayein (purani activity kam important):

```
weight_final = weight * exp(-lambda * days_ago),   lambda ≈ 0.05
```

Isi se `user_profiles.categoryAffinity` banega — ye nightly job Python ya NestJS dono mein ho sakta hai (Python recommend karta hoon, kyunki pandas se aasan hai).

---

## 10. ML service build (Python FastAPI)

```bash
cd ml-service
python -m venv venv
# Windows: venv\Scripts\activate   |  Linux/Mac: source venv/bin/activate
pip install fastapi uvicorn[standard] pymongo pandas numpy scikit-learn implicit lightgbm statsmodels joblib python-dotenv
# optional: prophet, sentence-transformers
pip freeze > requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 10.1 Recommendation engine — 4 levels (isi order mein banayein)

**Level 0 — Popularity baseline (Week 4)**
`purchaseCount`, `viewCount`, rating aur recency ka simple score. Ye aap ka baseline hai — metrics table mein ye pehli row banegi.

**Level 1 — Content-Based (Week 7)**
```
title + description + tags + brand + category  →  TF-IDF vector
price aur numeric attributes → normalize karke concat
similarity = cosine(product_i, product_j)
```
Use: "Similar products" section + naye user ke liye (jab history na ho) uske dekhe hue 1–2 products se similar nikalna.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

corpus = (df.title + ' ' + df.brand + ' ' + df.category + ' ' + df.tags_joined)
X = TfidfVectorizer(max_features=5000, stop_words='english').fit_transform(corpus)
sim = cosine_similarity(X)          # chhote catalog ke liye theek
# bare catalog par: sirf top-50 neighbours save karein (precompute + Mongo mein)
```

**Level 2 — Collaborative Filtering (Week 8)**
User-item interaction matrix banayein (values = Section 9 ke weights = implicit feedback).

```python
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares

matrix = sp.csr_matrix((weights, (user_idx, item_idx)))
model = AlternatingLeastSquares(factors=64, regularization=0.05, iterations=20)
model.fit(matrix)
ids, scores = model.recommend(user_idx_of_user, matrix[user_idx_of_user], N=20)
```

Item-item CF (aur simple, "customers also bought" ke liye behtar):
```python
from sklearn.metrics.pairwise import cosine_similarity
item_sim = cosine_similarity(matrix.T)   # item vectors ke darmiyan similarity
```

**Level 3 — Hybrid + re-ranking (Week 9)** — yehi aap ka "contribution" hai

```
final_score = w1*CF + w2*Content + w3*CategoryAffinity + w4*Popularity + w5*Recency
              - penalty(already_purchased)
              - penalty(out_of_stock)
              + boost(price_in_user_range)
```
Starting weights: `w1=0.40, w2=0.25, w3=0.20, w4=0.10, w5=0.05` — phir grid search se tune karein aur report mein "weight sensitivity" table dikhayein. Diversity ke liye MMR ya "ek category se max 3 items" rule lagayein.

**Cold start handling (viva mein poocha jata hai — jawab tayyar rakhein):**
| Case | Strategy |
|---|---|
| New user, 0 events | trending + category-wise best sellers, onboarding mein 3 interests poochein |
| New user, 1–3 views | content-based (session-based recommendation) |
| New product | content-based similarity + "New arrivals" boost |
| Anonymous visitor | `anonId` cookie se session tracking, login par merge |

### 10.2 Demand forecasting engine — 3 levels

**Level 0 — Baseline (Week 10)**
- Naive: last week ka average
- Moving average (7/14/28 din)
- Seasonal naive: pichhle saal isi hafte ka value
Yehi baseline metrics report mein comparison ke liye chahiye.

**Level 1 — Classical time series (Week 11)**
- SARIMA (`statsmodels`) — jab per-product history lambi ho
- Prophet — holidays + weekly/yearly seasonality automatically handle karta hai (Pakistani holidays/Ramzan dates custom holidays ke tor par dein)

**Level 2 — ML regression (recommended final model)**
LightGBM ek hi model se saare products handle kar leta hai (global model) — kam data walay products ke liye behtar.

Feature table (`sales_daily` se banti hai):

| Group | Features |
|---|---|
| Lags | units_lag_1, 7, 14, 28 |
| Rolling | roll_mean_7, roll_mean_28, roll_std_7, roll_max_7 |
| Calendar | dayofweek, weekofyear, month, is_weekend, is_holiday, days_to_holiday |
| Price | price, discount_pct, price_vs_28day_avg |
| Promo | promo_flag, promo_intensity |
| Product | categoryId, brand, price_band, product_age_days |
| Behavior (extra edge) | views_lag_7, cart_adds_lag_7 — *bohat strong signal, ye aap ke project ka plus point hai* |

```python
import lightgbm as lgb
model = lgb.LGBMRegressor(n_estimators=800, learning_rate=0.05, num_leaves=63)
model.fit(X_train, y_train, eval_set=[(X_valid, y_valid)],
          callbacks=[lgb.early_stopping(50)])
```

**Critical rules (warna results fake honge):**
1. **Time-based split** karein, random split **nahi**. e.g. train = pehle 80% din, test = aakhri 20% din.
2. **Rolling-origin cross validation** (3–4 folds) use karein.
3. **Data leakage** se bachein: feature banate waqt future ka data use na ho (lag features hamesha shifted).
4. **Stock-out censoring:** jab product out-of-stock tha, sales 0 thi lekin demand 0 nahi thi — us din ko mask karein ya flag dein. Ye baat report mein likhna aap ko strong dikhata hai.

### 10.3 FastAPI endpoints

```python
# app/main.py
app = FastAPI(title="ML Service")

@app.get("/ml/health")
def health(): return {"status": "ok", "models": loaded_versions()}

@app.post("/ml/recommend")
def recommend(req: RecommendRequest):
    items = recommender.recommend(req.userId, req.limit)
    return {"items": items, "modelVersion": recommender.version}

@app.post("/ml/similar-items")
def similar(req: SimilarRequest): ...

@app.post("/ml/forecast")
def forecast(req: ForecastRequest):
    return forecaster.predict(req.productId, req.days)
```

Models startup par `joblib.load()` se memory mein aa jayen — har request par load na karein.

### 10.4 Serving strategy (report mein likhein)

| Kaam | Kab | Kaise |
|---|---|---|
| Model training | nightly / weekly | `training/*.py` script, cron |
| User recommendations | nightly precompute + on-demand refresh | `recommendations` collection |
| Similar items | precompute (per product top-50) | one-time + product update par |
| Session-based reco | real-time | last 5 events se content-based |
| Forecast | daily batch (30-day horizon) | `forecasts` collection |

---

## 11. Frontend build order (React)

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm i axios react-router-dom @tanstack/react-query recharts
npm i -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
```

Build order:

| # | Kaam | Detail |
|---|---|---|
| 1 | Layout + routing | Navbar, Footer, protected routes, admin layout |
| 2 | Auth pages | login/register, token storage, axios interceptor (401 → refresh) |
| 3 | Product listing | grid, filters (category/price/brand), sort, pagination, skeleton loaders |
| 4 | Product detail | images, specs, add to cart, **Similar Products** carousel |
| 5 | Cart + checkout + orders | quantity update, totals, order place, order history |
| 6 | Home page | hero, **Recommended For You**, Trending, Category tiles |
| 7 | Recommendation UI | explanation badge: *"Because you viewed Gaming Laptops"* |
| 8 | Wishlist + profile | interests edit (cold start ke liye) |
| 9 | Admin dashboard | KPIs, products CRUD, orders table |
| 10 | Analytics + Forecast pages | Recharts line/bar, forecast vs actual overlay, alerts table |
| 11 | AI Assistant chat | message list, streaming/typing state, product cards inline |

**Reusable components:** `ProductCard`, `ProductCarousel`, `RecommendationSection`, `FilterSidebar`, `StatCard`, `ForecastChart`, `StockRiskBadge`, `EmptyState`, `Skeleton`.

**UX details jo marks dilate hain:** loading skeletons, empty states, error boundaries, "why this recommendation" explanation, mobile responsive admin tables.

---

## 12. Admin dashboard — kya kya dikhana hai

**Overview KPIs:** total revenue, orders, AOV, conversion rate, active users, recommendation CTR.

**Sales analytics:** revenue trend (daily/weekly), top 10 products, category-wise share, funnel (views → cart → purchase with drop-off %).

**Demand Forecast page (project ka star feature):**
```
Product       Stock   Predicted 30-day   Coverage   Risk    Action
Headphones     100          190            0.53     HIGH    Restock ~110
Keyboard       150          210            0.71     MEDIUM  Restock ~70
Mouse          300          250            1.20     LOW     OK
Laptop         120          180            0.67     HIGH    Restock ~70
```
- Graph: past actual sales (solid line) + forecast (dashed) + confidence band
- Risk rule: `coverage = stock / predicted`; `<0.7 = HIGH`, `0.7–1.0 = MEDIUM`, `>1.0 = LOW`
- Reorder suggestion: `predicted + safety_stock(= z * std_error) - stock`
- Model accuracy card: MAE / RMSE / MAPE + "last trained at"

**Behavior analytics (M3):** customer segments (new / window shopper / high-intent / loyal / at-risk), category heatmap, session duration distribution, cart abandonment rate.

**Recommendation performance:** impressions, clicks, CTR, add-to-cart rate from recommendations vs non-recommended — ye online evaluation ban jata hai.

---

## 13. AI Shopping Assistant (M4 — optional, aakhir mein)

Flow:
```
User: "Mujhe 150,000 ke andar gaming laptop chahiye"
   ↓
LLM → structured filter nikalta hai (JSON)
   { category: "laptop", tags: ["gaming"], maxPrice: 150000 }
   ↓
NestJS product search + recommendation ranking
   ↓
LLM top 3 products ka comparison + reason likhta hai
   ↓
UI: product cards + explanation
```

Implementation notes:
- **Function calling / structured output** use karein — LLM se seedha product na maangwayein (warna wo products invent kar dega). LLM ka kaam sirf **query → filters** aur **results → explanation** hai.
- Guardrails: sirf apne catalog ke products dikhayein; price/stock DB se lein.
- Cheap alternative agar API budget nahi: rule-based NLP (regex + keyword + price extraction) + optional local model. Report mein "hybrid NLU" likh sakte hain.

---

## 14. Testing & evaluation (ye section aap ka FYP "research" hissa hai)

### 14.1 Offline evaluation — Recommendation

**Protocol:** temporal split (aakhri 20% time test), ya leave-one-out (har user ka aakhri purchase test mein).

| Metric | Kya batata hai |
|---|---|
| Precision@10 | recommended 10 mein se kitne relevant |
| Recall@10 | relevant items mein se kitne pakde |
| MAP@10 / NDCG@10 | ranking quality (order bhi matter karta hai) |
| Hit Rate@10 | kitne % users ko at least 1 correct item mila |
| Coverage | catalog ka kitna % recommend hua (diversity) |

Report mein aisi table banayein:

```
Model                    Precision@10  Recall@10  NDCG@10  Coverage
Popularity (baseline)        0.041       0.088     0.093     2%
Content-Based                0.062       0.121     0.135    38%
Collaborative (ALS)          0.095       0.187     0.212    24%
Hybrid (proposed)            0.118       0.229     0.256    41%
```

### 14.2 Offline evaluation — Forecasting

| Metric | Formula ka matlab | Kab use karein |
|---|---|---|
| MAE | average absolute error (units) | interpret karna aasan |
| RMSE | bade errors ko zyada punish | outliers matter karte hon |
| MAPE | % error | products compare karne ke liye (0 sales par fail hota hai) |
| WAPE/sMAPE | MAPE ka safe version | intermittent demand |

```
Model                      MAE    RMSE   MAPE
Naive (last week)          18.4   26.1   24.8%
Moving Average (7d)        15.2   21.7   20.3%
SARIMA                     12.6   17.9   16.1%
LightGBM (proposed)         8.7   12.4   11.2%
```

Plus: forecast vs actual graph, aur error analysis (kis category mein model kamzor hai aur kyun).

### 14.3 Online / functional testing
- Unit tests: NestJS services (Jest), Python services (pytest) — key modules par
- Integration: auth → cart → order flow
- API tests: Postman collection (report ke appendix mein screenshots)
- Performance: recommendation API p95 < 500ms (cache ke saath), 100 concurrent users
- Usability: 8–10 users se 5-point survey (SUS score) — report mein achha addition

---

## 15. Deployment

| Part | Free/sasta option |
|---|---|
| MongoDB | MongoDB Atlas free M0 |
| NestJS | Render / Railway / Fly.io |
| React | Vercel / Netlify |
| Python ML | Render / Railway / Hugging Face Spaces (Docker) |
| Cron jobs | Render cron / GitHub Actions scheduled workflow |

Checklist:
- `.env` secrets repo mein na jayein (`.gitignore`)
- CORS sirf frontend domain ke liye
- ML service private (API key header se protect karein)
- Model files ke liye persistent volume ya cloud storage
- Rate limiting (`@nestjs/throttler`) auth aur assistant endpoints par
- Demo ke liye seed data zaroor load karein (khali site demo mein bura lagta hai)

Docker compose (local dev ke liye kaafi useful):
```yaml
services:
  mongo:   { image: mongo:7, ports: ["27017:27017"], volumes: ["mongo:/data/db"] }
  ml:      { build: ./ml-service, ports: ["8000:8000"], env_file: .env }
  backend: { build: ./backend, ports: ["3000:3000"], depends_on: [mongo, ml] }
volumes: { mongo: {} }
```

---

## 16. FYP documentation mapping

| Report chapter | Kahan se material milega |
|---|---|
| 1. Introduction, problem statement, objectives | Section 1 + over/under-stock problem |
| 2. Literature review | recommendation systems (CF/content/hybrid), demand forecasting (ARIMA/Prophet/GBDT) ke 12–20 papers |
| 3. Requirements (SRS) | Section 1, 6.1, use cases, functional/non-functional |
| 4. System design | 6.2 architecture, 6.3 database, 6.4 API, 6.5 UI, sequence diagrams |
| 5. Methodology (ML) | 6.6 + Section 10 (features, algorithms, training) |
| 6. Implementation | Sections 8–13, code snippets, screenshots |
| 7. Results & evaluation | Section 14 tables + graphs |
| 8. Conclusion & future work | limitations: cold start, synthetic data, real-time streaming |

**Objectives ko measurable likhein (proposal mein):**
1. Hybrid recommendation engine banana jo popularity baseline se Precision@10 mein **≥25% improvement** de.
2. Demand forecasting model banana jo naive baseline se MAE mein **≥30% improvement** de.
3. Admin ko 30-day forecast + automatic restocking alerts dena.
4. Customer behavior analytics se segments identify karna.

---

## 17. Common mistakes (in se bachein)

| Mistake | Result | Bachao |
|---|---|---|
| Pehle 6 hafte sirf UI banana | AI part reh jata hai | Week 4 tak vertical slice |
| Data ka intezaam na karna | model train nahi hota | Week 2 mein dataset |
| Random train/test split (time series par) | fake achhe results, viva mein pakde jate hain | temporal split |
| Baseline na banana | improvement prove nahi hoti | Level 0 pehle |
| ML ko sync call karna without timeout | site hang | timeout + fallback |
| Cold start ignore karna | naya user khali screen dekhta hai | Section 10.1 table |
| Sab kuch ek hi Nest app mein | messy | modules + alag ML service |
| Report aakhir mein likhna | 2 hafte barbaad | `docs/` roz update |
| Git mein commit na karna | kaam ud jata hai | roz commit + branch per feature |
| 100+ features add karna | kuch bhi complete nahi hota | scope freeze |

---

## 18. Week 1 — aaj se ye karein (concrete to-do)

**Day 1**
- [ ] GitHub repo banayein (`ecommerce-ai-platform`), folder structure (Section 4) commit karein
- [ ] Node, Python, MongoDB, Compass, VS Code install/verify
- [ ] `docs/01-proposal.md` shuru karein — title, problem statement, 4 objectives

**Day 2**
- [ ] Modules aur in/out-of-scope table finalize karein (Section 1)
- [ ] Use case diagram (draw.io) → `docs/`

**Day 3**
- [ ] RetailRocket + Online Retail II download karein
- [ ] Jupyter notebook mein basic inspection: rows, users, items, events per type, date range, top products
- [ ] Notebook `ml-service/notebooks/01_data_exploration.ipynb` mein save karein

**Day 4**
- [ ] Architecture diagram + MongoDB collections final (Section 6.2, 6.3)
- [ ] API contract likhein (`docs/05-api-contract.md`)

**Day 5**
- [ ] Figma mein 5 main screens ke low-fi wireframes (Home, Listing, Detail, Cart, Admin Forecast)
- [ ] `docs/06-ml-design.md` ka draft

**Day 6–7**
- [ ] `nest new backend` + Mongo connection + auth module shuru
- [ ] `npm create vite frontend` + routing + layout
- [ ] Supervisor ko proposal + architecture dikha kar approval lein **(coding zyada karne se pehle)**

---

## 19. Definition of Done (final submission checklist)

**System**
- [ ] Customer flow: signup → browse → search → view → cart → order → order history
- [ ] Home page par personalized recommendations (explanation ke saath)
- [ ] Product page par "Similar" + "Also bought"
- [ ] Events collection real events se bhar rahi hai
- [ ] Admin: products CRUD, orders, analytics
- [ ] Admin: 30-day demand forecast graph + risk table + restock suggestion
- [ ] Behavior segments page
- [ ] (Optional) AI assistant working
- [ ] Fallbacks: ML service band ho to bhi site chalti hai

**ML**
- [ ] Baseline + proposed model dono ke results
- [ ] Recommendation: Precision/Recall/NDCG/Coverage table
- [ ] Forecasting: MAE/RMSE/MAPE table + forecast vs actual graph
- [ ] Training scripts reproducible (`python training/train_forecast.py` chal jaye)
- [ ] Notebooks saaf aur commented

**Docs & demo**
- [ ] SRS + design docs + evaluation results
- [ ] Final report (chapter mapping Section 16)
- [ ] Slides: problem → solution → architecture → demo → results → future work
- [ ] Live URLs ya offline demo (backup video zaroor banayein)
- [ ] Viva prep: cold start, why hybrid, why LightGBM, data leakage, how you evaluated

---

## 20. Ek line ka summary

> Week 1–2 mein **scope + design + data**, Week 3–4 mein **auth + catalog + vertical slice**, Week 5–9 mein **recommendation engine**, Week 10–12 mein **forecasting + admin dashboard**, Week 13–16 mein **analytics, assistant, evaluation aur report**.

Baseline pehle, model baad mein. Data pehle, algorithm baad mein. Chain pehle, polish baad mein.
