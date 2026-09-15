# FINAL YEAR PROJECT (FYP) CONCEPT FORM

## 1. Project Title

**AI-Powered E-Commerce Recommendation and Demand Prediction System**

## 2. Project Category

**Artificial Intelligence / Machine Learning / Web Application / E-Commerce / Data Analytics**

## 3. Project Type

**Software-Based Final Year Project**

## 4. Introduction

E-commerce platforms generate valuable customer, product, browsing, and sales data. However, many businesses still depend on generic product listings and manual inventory analysis.

The proposed **AI-Powered E-Commerce Recommendation and Demand Prediction System** is a web-based platform that combines e-commerce functionality with Artificial Intelligence, Machine Learning, and customer behavior analytics. It will recommend relevant products to customers, support intelligent product search, analyze customer behavior, and help administrators forecast product demand and plan inventory.

The system will forecast daily product demand for the next 30 days, identify stock-out risk, and calculate restocking quantities using current stock, predicted demand, and forecast uncertainty. The project therefore supports both sides of e-commerce: personalized customer experience and data-driven inventory management.

## 5. Problem Statement

Traditional e-commerce systems often do not understand individual customer preferences and do not provide reliable demand visibility for store administrators. Customers may struggle to discover relevant products, while administrators may face:

- Low product discovery and generic recommendations.
- Overstocking products with low demand.
- Stock-outs for products with increasing demand.
- Difficulty analyzing customer behavior and sales trends.
- Manual and time-consuming inventory planning.

An integrated system is required to use customer events and historical sales data for personalized recommendations, behavior analytics, demand forecasting, stock-out risk detection, and restocking support.

## 6. Proposed Solution

The system will provide a customer storefront and an administrator dashboard. It will collect events such as searches, clicks, product views, wishlist actions, cart additions, and purchases. These events will be time-decayed and converted into customer-product interest signals.

The recommendation engine will combine popularity, product content similarity, collaborative filtering, category affinity, and vector similarity to produce ranked recommendations. A fallback chain will ensure that customers receive category best-sellers or trending products when there is insufficient personal history.

The demand forecasting module will use historical daily sales, calendar information, price and promotion data, product attributes, and selected behavior signals to produce a 30-day forecast. The system will derive coverage, risk level, and reorder quantity for administrators.

The platform will also provide typo-tolerant search, product facets, customer behavior analytics, sales funnels, user segments, and an optional generative AI shopping assistant that converts natural-language requests into catalog filters and explanations.

## 7. Project Objectives

1. Develop a functional web-based e-commerce platform.
2. Implement secure customer and administrator authentication with role-based access.
3. Track customer events and calculate product interest profiles.
4. Generate personalized, similar-product, and also-bought recommendations.
5. Implement typo-tolerant and hybrid product search.
6. Forecast daily product demand for a 30-day horizon.
7. Identify stock-out risk from predicted demand and current inventory.
8. Generate data-driven restocking recommendations.
9. Provide customer behavior, funnel, sales, and inventory analytics.
10. Evaluate recommendation and forecasting models against suitable baselines.

## 8. Target Users

### 8.1 Customers

- Register, log in, and manage a profile.
- Browse, search, filter, and view products.
- Add products to a cart and place orders.
- Receive personalized and similar-product recommendations.
- View relevant product explanations where available.

### 8.2 Administrators / Store Managers

- Manage products, categories, prices, and inventory.
- Manage customer and order information.
- Monitor sales and customer behavior analytics.
- View demand forecasts and model metrics.
- Monitor stock-out risk and recommended reorder quantities.
- Trigger or monitor model training and background jobs where permitted.

## 9. Major System Modules

### 9.1 Authentication and User Management

Registration, login, token refresh, logout, password reset, profile management, and role-based access control.

### 9.2 Product, Category, and Inventory Management

Administrators can create, update, and manage product catalog data, categories, prices, stock levels, images, and product attributes. Customers can browse active products.

### 9.3 Search and Discovery

Meilisearch will provide autocomplete, typo-tolerant search, filters, facets, and hybrid keyword/vector retrieval. PostgreSQL full-text search with trigram matching will provide a fallback path.

### 9.4 Cart and Order Management

Customers can maintain carts and place orders. The system will store customer, product, quantity, price, date, and order status data. Order data will contribute to demand forecasting.

### 9.5 Customer Behavior Analytics

The system will record search, click, view, wishlist, cart, purchase, and other relevant events. It will produce interest profiles, RFM/intent-based segments, and a view-to-purchase funnel.

### 9.6 Recommendation Engine

The recommendation engine will be developed in stages:

- Popularity baseline for cold-start users.
- Content-based similarity using product text, categories, brands, tags, and embeddings.
- Collaborative filtering using implicit user-item interactions.
- Hybrid re-ranking using content, collaborative, category-affinity, popularity, recency, stock, and purchase-history signals.

Recommendations will be precomputed nightly where possible and served in real time for recent session context. Results will include a relevance reason and will apply diversity and out-of-stock rules.

### 9.7 Demand Forecasting

The forecasting module will produce per-product daily predictions for the next 30 days. Candidate approaches include naive and moving-average baselines, SARIMA/Prophet, and a LightGBM global model.

Input features may include lagged demand, rolling statistics, calendar and holiday information, price, discounts, promotions, product attributes, views, and cart additions.

### 9.8 Stock-Out Risk and Restocking

The system will calculate inventory coverage by comparing current stock with total predicted 30-day demand. Products will be classified as **Low**, **Medium**, or **High** risk. Reorder quantity will include predicted demand, forecast uncertainty, and current stock.

### 9.9 Administrator Dashboard

The dashboard will display total products, customers, orders, sales trends, best-selling products, low-stock products, forecasts, risk bands, reorder quantities, model metrics, and behavior insights.

### 9.10 Generative AI Shopping Assistant (Optional)

If included within the available project time, a shopping assistant will convert natural-language requests into structured catalog filters, retrieve real products, and provide short comparisons. It will not invent products, prices, or stock information.

## 10. Proposed Technology Stack

### Web Application

**Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, and Recharts**

Next.js will provide the customer storefront, administrator dashboard, server-rendered catalog pages, client-side interactive features, and thin BFF route handlers for authentication and search.

### Business Backend

**Python 3.12, FastAPI, SQLAlchemy 2.0 / SQLModel, Pydantic v2, and Alembic**

The FastAPI `core-api` will manage authentication, catalog, search orchestration, carts, orders, events, analytics, inventory, and administrator operations.

### ML Service

**Python 3.12, FastAPI, pandas, scikit-learn, implicit ALS, LightGBM, Prophet/statsmodels, and sentence-transformers**

The separate `ml-service` will expose internal endpoints for recommendations, similar products, forecasting, embeddings, health checks, and model training. It will be called by `core-api`, not directly by the browser.

### Database and Infrastructure

- **PostgreSQL 17** with SQLModel/SQLAlchemy, `pgvector`, `pg_trgm`, and `unaccent`.
- **Meilisearch** for product search and autocomplete.
- **Redis** for caching, rate limiting, and queues.
- **Arq** for nightly rollups, model batches, retraining triggers, and search synchronization.
- **S3-compatible object storage / MinIO** for product images and model artifacts.
- **Docker and Docker Compose** for local and production-style service orchestration.

## 11. High-Level System Architecture

**Customer / Administrator**

↓

**Next.js storefront and admin application**

↓ REST / BFF routes

**FastAPI `core-api`**

↓ async database access and internal API calls

**PostgreSQL + Redis + Meilisearch + FastAPI `ml-service`**

The `core-api` is the business and security boundary. PostgreSQL stores transactional, behavioral, recommendation, embedding, and forecast data. Redis handles caching and background jobs. Meilisearch indexes product data, while the ML service performs model inference and training tasks.

## 12. Functional Requirements

The system shall:

1. Support customer and administrator registration/authentication.
2. Enforce role-based access to administrator functions.
3. Allow product, category, price, image, and inventory management.
4. Allow customers to browse, search, filter, and view products.
5. Support cart and order workflows.
6. Store customer interaction events.
7. Generate interest profiles and behavior analytics.
8. Generate personalized, similar, and hybrid recommendations.
9. Provide search autocomplete, typo tolerance, and facets.
10. Forecast product demand for the next 30 days.
11. Identify stock-out risk and calculate reorder quantities.
12. Display sales, inventory, forecast, and behavior analytics.
13. Provide model evaluation results and baseline comparisons.

## 13. Non-Functional Requirements

- **Performance:** Common catalog, search, and dashboard requests should respond within an acceptable application response time.
- **Scalability:** The modular services should support additional products, users, events, and sales records.
- **Security:** Use secure password hashing, JWT access/refresh tokens, httpOnly cookies, authorization, validation, internal service keys, and rate limiting.
- **Reliability:** Recommendation and search fallback paths should prevent an empty customer experience or unnecessary service failure.
- **Usability:** Interfaces should be responsive, clear, and usable on desktop and mobile screens.
- **Maintainability:** Use a layered FastAPI structure, documented APIs, migrations, automated tests, and modular ML services.

## 14. AI/ML Methodology

### Step 1 - Data Sources

Use the RetailRocket dataset for recommendation experiments, Online Retail II for forecasting experiments, Olist data where useful, and calibrated synthetic data for demo seeding. The report will clearly distinguish public, synthetic, and application-generated data.

### Step 2 - Preprocessing and Feature Engineering

Clean events and sales data, remove invalid records, aggregate daily sales, create time-decayed interaction weights, and generate lag, rolling, calendar, price, promotion, product, and behavior features.

### Step 3 - Model Development

Compare popularity, content-based, collaborative, and hybrid recommenders. Compare naive, moving-average, statistical, and LightGBM forecasting models. Stock-out risk and reorder quantities will be derived from forecast coverage and uncertainty.

### Step 4 - Evaluation

Use temporal splits and rolling-origin validation. Recommendation metrics will include Precision@10, Recall@10, MAP@10, NDCG@10, Hit Rate@10, and coverage. Forecasting metrics will include MAE, RMSE, MAPE where appropriate, and WAPE. Avoid data leakage and account for censored sales on stock-out days.

### Step 5 - Integration

Load model artifacts at ML-service startup, expose internal FastAPI endpoints, persist recommendation and forecast results, and serve them through `core-api` with caching and fallbacks.

## 15. Expected Outcomes

1. A working Next.js e-commerce storefront and administrator dashboard.
2. A FastAPI business API with secure authentication and e-commerce workflows.
3. A PostgreSQL-backed product, order, event, inventory, and analytics system.
4. Personalized and similar-product recommendations.
5. Search with autocomplete, typo tolerance, and filters.
6. Customer behavior segments and funnel analytics.
7. 30-day product demand forecasts.
8. Stock-out risk alerts and restocking recommendations.
9. Evaluated ML baselines and proposed models.
10. Complete testing, documentation, and final demonstration.

## 16. Project Scope

### Included in Scope

- Customer and administrator authentication.
- Product, category, inventory, cart, and order management.
- Product browsing, search, filters, and recommendations.
- Event tracking and customer behavior analytics.
- Demand forecasting, stock-out risk, and restocking support.
- Administrator dashboard and ML model evaluation.
- Integration of Next.js, FastAPI, PostgreSQL, Redis, Meilisearch, and ML services.

### Outside the Initial Scope

- Real-world payment gateway and shipping/logistics integration.
- Multi-vendor marketplace functionality.
- Fully autonomous purchasing or supplier ordering.
- Advanced fraud detection and production-scale deployment.
- Mobile application and voice-based shopping.
- Deep learning models beyond the evaluated project scope.

## 17. Innovation / Novelty

The project combines customer personalization and inventory intelligence in one platform:

**Customer Events → Interest Profile → Hybrid Recommendation**

and

**Historical Sales and Behavior → 30-Day Forecast → Stock-Out Risk → Restocking Recommendation**

The use of hybrid recommendations, vector-enabled product discovery, behavior analytics, and forecast-based inventory support provides a practical AI solution for both customers and store administrators.

## 18. Benefits

### Customers

- Faster discovery of relevant products.
- More personalized shopping results.
- Better similar-product and search experiences.

### Administrators

- Improved visibility into customers and sales.
- Early warning of potential stock-outs.
- More informed inventory planning.
- Reduced manual analysis.

## 19. Limitations

Recommendation and forecast quality depends on the quantity, quality, and representativeness of available data. Public and synthetic datasets may not fully represent a live commercial store. Results are decision-support outputs, not guaranteed future outcomes. The optional shopping assistant depends on available model access and project time.

## 20. Future Enhancements

- Real-time model updates and online learning.
- Advanced deep learning and transformer recommenders.
- Supplier management and automated purchase orders.
- Dynamic pricing and promotion optimization.
- Real-time payment, shipping, and mobile application support.
- Review sentiment analysis and advanced business intelligence.

## 21. Deliverables

1. Requirements specification and project documentation.
2. System architecture and PostgreSQL database design.
3. Next.js web application.
4. FastAPI `core-api`.
5. FastAPI `ml-service` and training/evaluation code.
6. Search, cache, and background-worker integration.
7. Recommendation and demand forecasting modules.
8. Stock-out and restocking dashboard.
9. Automated and integration test documentation.
10. Final report, presentation, and demonstration.

## 22. Proposed Project Timeline

| Phase | Major Activities |
|---|---|
| 1 | Requirements, problem analysis, and literature review |
| 2 | Architecture, database, API, and UI design |
| 3 | Authentication, catalog, cart, orders, and inventory |
| 4 | Search, event tracking, and customer analytics |
| 5 | Recommendation baselines and hybrid model |
| 6 | Demand forecasting and evaluation |
| 7 | Stock-out, restocking, and administrator dashboard |
| 8 | ML integration, testing, performance evaluation, documentation, and presentation |

## 23. Conclusion

The **AI-Powered E-Commerce Recommendation and Demand Prediction System** is an intelligent web platform that improves product discovery for customers and inventory planning for administrators. Its current architecture uses Next.js, FastAPI, PostgreSQL, Redis, Meilisearch, background workers, and a dedicated ML service. By combining hybrid recommendations, customer behavior analytics, 30-day demand forecasting, stock-out risk analysis, and restocking support, the project demonstrates a practical application of AI and Machine Learning in e-commerce.

## 24. Keywords

**Artificial Intelligence, Machine Learning, E-Commerce, Next.js, FastAPI, PostgreSQL, Product Recommendation, Hybrid Recommendation, Customer Behavior Analytics, Demand Forecasting, Inventory Management, Stock-Out Risk, Meilisearch, pgvector**
