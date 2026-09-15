# Data — sources, licensing, layout

Feeds the ML modules (M1 recommendation, M2 forecasting) and the demo catalog. Target datastore: **PostgreSQL** (see [`../docs/05-database-design.md`](../docs/05-database-design.md)).

## Layout

```
data/
├── raw/                     # downloaded datasets — gitignored (large)
│   ├── retailrocket/        # RetailRocket Recommender System Dataset (Kaggle) — events + item properties → recommendation
│   ├── online-retail-ii/    # Online Retail II (UCI) — 2 yr invoices → demand forecasting
│   └── olist/               # Olist Brazilian E-Commerce (Kaggle) — full schema + reviews
├── processed/               # cleaned parquet/csv, gitignored
│   ├── products/  events/  sales/  features/
├── eval/
│   └── search_qrels.csv     # labelled query→relevant-product-ids set for the search bake-off (docs/11)
└── seed/                    # PostgreSQL loaders (SQLAlchemy) — run in order
    ├── 01_load_categories_products.py
    ├── 02_load_users.py
    ├── 03_load_events.py
    ├── 04_build_sales_daily.py
    ├── 05_synthetic_generator.py     # Zipf popularity, funnel probs, seasonality, promo spikes, noise; 12–24 months
    ├── 06_bootstrap_embeddings.py    # ml-service /embed → products.embedding (pgvector)
    └── 07_index_search.py            # push active products → Meilisearch
```

Run all: `task seed` (or `scripts/seed-all.sh`).

## Datasets

| Dataset | Use | Licence note |
|---|---|---|
| RetailRocket Recommender System | recommendation (2.7M view/addtocart/transaction events + item props) | Kaggle — research use; cite in report |
| Online Retail II | demand forecasting (real invoices, daily/weekly aggregation) | UCI ML Repository — CC BY 4.0 |
| Olist Brazilian E-Commerce | e-commerce schema, reviews, geo | Kaggle CC BY-NC-SA 4.0 — non-commercial |
| (optional) H&M, M5, Amazon Reviews | extra recommendation / forecasting benchmarks | per-source |

**Report statement:** *"Due to cold-start constraints of a new platform, models were trained and evaluated on the public RetailRocket and Online Retail II datasets, with a calibrated synthetic generator used for demo seeding."*

Large files are git-ignored — keep a `data/raw/**/SOURCE.md` per dataset with the download URL, version, and access date.
