# Search Design — Product Search Solution (Researched)

**Module:** Catalog Search (supports M1 recommendation cold-start and M4 assistant)
**Scope:** typo-tolerant, faceted, instant product search over ~2k–50k products, plus semantic/hybrid search for natural-language queries.
**Decision:** **Meilisearch** as the primary search engine, **PostgreSQL full-text search** as the always-on fallback and evaluation baseline, **hybrid (BM25 + vector)** for semantic queries. **ParadeDB `pg_search`** documented as the "no second system" alternative and benchmarked in the evaluation chapter.

---

## 1. Requirements

| # | Requirement | Priority |
|---|---|---|
| S1 | Full-text search over title, description, brand, category, tags, attributes | must |
| S2 | Typo tolerance ("gaminng laptp" → "gaming laptop") | must |
| S3 | Search-as-you-type / autocomplete, p95 < 50 ms | must |
| S4 | Faceted filtering: category, brand, price range, rating, attributes; with facet counts | must |
| S5 | Custom ranking: boost in-stock, popularity, rating, exact-phrase; demote discontinued | must |
| S6 | Synonyms ("laptop" ↔ "notebook", "tv" ↔ "television") | should |
| S7 | Semantic / natural-language search ("cheap laptop for video editing") | should (feeds M4) |
| S8 | Personalized re-ranking of the top N results | nice |
| S9 | Search analytics: top queries, zero-result queries, click-through | should (admin M3) |
| S10 | Never returns a 5xx; degrades gracefully if the engine is down | must |
| S11 | Index stays in sync with PostgreSQL (< few seconds lag) | must |

Non-functional: single-node friendly, free/open-source, deployable in `docker-compose`, small ops burden (student team).

---

## 2. Options researched

Five approaches were evaluated against the requirements. Sources are listed in §9.

### 2.1 PostgreSQL native full-text search (`tsvector` + GIN)

- **How:** generated `tsvector` column over the searchable text, GIN index, `websearch_to_tsquery`, `ts_rank_cd` for ranking; `pg_trgm` + `unaccent` for fuzzy/accent-insensitive matching; `similarity()` for typo tolerance.
- **Pros:** zero extra infrastructure; transaction-safe and always in sync; real-time indexing; language-aware stemming; runs where the data already is; good enough for small/medium catalogs.
- **Cons:** ranking quality is weaker than BM25 for catalog search; typo tolerance is bolt-on (trigram) and slower; faceting = extra `GROUP BY` queries; no built-in synonyms/search-as-you-type; relevance tuning is manual.
- **Verdict:** excellent **baseline and fallback**, not the primary UX. Community guidance: "start Postgres-only, be ready to pivot to a dedicated engine when relevance/scale demands it."

### 2.2 ParadeDB `pg_search` (BM25 inside Postgres)

- **How:** Postgres extension built on Tantivy (Rust Lucene); `CREATE INDEX ... USING bm25`; Elastic-quality full-text, faceting, and hybrid search **inside** Postgres; index auto-maintained on INSERT/UPDATE/DELETE with ACID guarantees.
- **Pros:** BM25 relevance without a second system to keep in sync; real-time; single datastore; supports hybrid (BM25 + `pgvector`) natively; drops into self-managed Postgres.
- **Cons:** newer/less battle-tested than Meilisearch/Elastic; needs the extension available on the host (fine self-hosted or on Neon; not on plain RDS); no turnkey search-as-you-type widget; smaller ecosystem.
- **Verdict:** **strong "no second system" alternative.** Included in the benchmark; a good answer to the viva question "why not just keep it in Postgres?".

### 2.3 Meilisearch (chosen primary)

- **How:** standalone Rust search engine (LMDB storage, single-node). REST API. Built-in typo tolerance, prefix search (search-as-you-type), faceting/filtering, custom ranking rules, synonyms, stop words. Since v1.6 supports **hybrid search** (BM25 full-text + vector embeddings) with built-in embedders (OpenAI / Hugging Face / Ollama) or user-provided vectors.
- **Pros:** best-in-class instant-search UX with almost no config; sub-50 ms; facets with counts out of the box; trivial to run (one container + volume); hybrid semantic search built in; official JS + Python SDKs; free/OSS.
- **Cons:** separate service to deploy and keep in sync; single-node (no built-in sharding — irrelevant at FYP scale); memory-resident index.
- **Verdict:** **best fit for S1–S8** with the least engineering. Purpose-built for e-commerce product discovery.

### 2.4 Typesense

- **How:** C++ open-source instant-search engine; in-memory index; Raft clustering for HA.
- **Pros:** very low latency; **richer faceting** (range facets, hierarchical facets) than Meilisearch; built-in vector/hybrid search; HA out of the box.
- **Cons:** slightly more configuration than Meilisearch; smaller docs/community; HA/clustering is overkill here.
- **Verdict:** **close second.** If the catalog needed heavy hierarchical facets or multi-node HA, Typesense would win. For this project the simpler Meilisearch setup is preferred. (Kept as the documented "swap-in" — the `SearchClient` abstraction makes switching a config change.)

### 2.5 OpenSearch / Elasticsearch

- **How:** distributed Lucene search + analytics cluster (OpenSearch = the OSS fork).
- **Pros:** most powerful relevance tuning, aggregations, and scale; industry standard; strong for large catalogs and log/behaviour analytics.
- **Cons:** heavy — JVM, cluster management, mapping design, more RAM; slow to configure ("10–100× slower to set up than Meilisearch/Typesense"); operationally too much for a student project.
- **Verdict:** **rejected for this project** — disproportionate ops cost. Named in the report as the path if the system went to large-scale production.

---

## 3. Decision matrix

Scores 1 (poor) – 5 (excellent), weighted by priority.

| Criterion (weight) | PG FTS | pg_search | **Meilisearch** | Typesense | OpenSearch |
|---|---|---|---|---|---|
| Relevance / ranking (5) | 2 | 4 | 4 | 4 | 5 |
| Typo tolerance (5) | 2 | 3 | 5 | 5 | 4 |
| Search-as-you-type (4) | 2 | 2 | 5 | 5 | 4 |
| Faceting + counts (4) | 3 | 4 | 4 | 5 | 5 |
| Custom ranking / synonyms (3) | 2 | 3 | 5 | 4 | 5 |
| Semantic / hybrid (3) | 3 (pgvector) | 5 | 4 | 4 | 4 |
| Sync simplicity (4) | 5 | 5 | 3 | 3 | 2 |
| Ops burden / setup speed (5) | 5 | 4 | 4 | 3 | 1 |
| Cost (OSS/self-host) (3) | 5 | 5 | 5 | 5 | 4 |
| **Weighted total (/180)** | **107** | **135** | **148** | **142** | **128** |

**→ Meilisearch primary; PG FTS as fallback/baseline; pg_search as the benchmarked alternative.**

---

## 4. Chosen architecture

```
                    ┌───────────────────────── Next.js ─────────────────────────┐
  search-as-you-type│  GET /api/search/suggest?q=   (Route Handler, SEARCH key) │
   (client, 150 ms  │        │                                                   │
    debounce)       │        ▼                                                   │
                    │   Meilisearch  /indexes/products/search  (prefix + typo)   │
                    └────────────────────────────────────────────────────────────┘

  full search page (SSR Server Component)
        │  GET /products/search?q=&category=&brand=&price=&sort=&page=
        ▼
  ┌────────────────────────── core-api  SearchService ──────────────────────────┐
  │  1. build Meilisearch query: q, filter=[...], facets=[...], sort, limit     │
  │  2. Meilisearch multi-search → { hits(ids+snippet), facetDistribution,      │
  │                                  estimatedTotalHits }                       │
  │  3. hydrate: SELECT live price, stock, rating, image FROM products          │
  │              WHERE id = ANY(:hitIds)   (keeps price/stock 100% fresh)       │
  │  4. optional re-rank: blend Meili _rankingScore with user category affinity │
  │  5. log query + result_count → search_events  (S9)                          │
  │  ── on Meilisearch error ──▶ PostgreSQL FTS path (websearch_to_tsquery      │
  │                              + pg_trgm), same response shape (S10)          │
  └────────────────────────────────────────────────────────────────────────────┘
        │
        ▼   { items[], facets{}, total, page, engine: "meili" | "pg-fts" }
  SSR HTML (streamed).  Facet clicks = client updates URL params → re-fetch.
```

### 4.1 Index: `products`

Document (pushed from Postgres):

```jsonc
{
  "id": "prd_01H…",
  "sku": "LAP-ASUS-TUF-001",
  "title": "ASUS TUF Gaming F15 Laptop",
  "description": "…",
  "brand": "Asus",
  "category": "Laptops",
  "category_path": ["Electronics", "Computers", "Laptops"],
  "tags": ["gaming", "laptop", "rtx"],
  "attributes": { "ram_gb": 16, "cpu": "i7", "gpu": "RTX 4060" },
  "price": 189999,
  "discount_price": 174999,
  "rating_avg": 4.4,
  "rating_count": 128,
  "popularity": 0.83,          // normalized purchaseCount+viewCount, refreshed nightly
  "in_stock": true,
  "is_active": true,
  "created_at": 1737590400,
  "_vectors": { "default": [0.0123, -0.045, …] }   // pgvector embedding, 384-d
}
```

Settings:

| Setting | Value |
|---|---|
| `searchableAttributes` | `["title", "brand", "tags", "category", "description", "attributes"]` (order = importance) |
| `filterableAttributes` | `["category", "category_path", "brand", "price", "discount_price", "rating_avg", "in_stock", "is_active", "attributes.ram_gb", "attributes.cpu", "attributes.gpu"]` |
| `sortableAttributes` | `["price", "discount_price", "rating_avg", "popularity", "created_at"]` |
| `rankingRules` | `["words", "typo", "proximity", "attribute", "sort", "exactness", "popularity:desc"]` |
| `typoTolerance` | `minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 }` |
| `synonyms` | `{ "laptop": ["notebook"], "tv": ["television"], "phone": ["mobile","cellphone"] }` |
| `stopWords` | `["the","a","for","with","and"]` |
| `faceting.maxValuesPerFacet` | `100` |
| `embedders.default` | `userProvided` (dim 384) — vectors come from `ml-service /embed` (all-MiniLM-L6-v2). Optional: Meilisearch REST/Ollama embedder. |

Every query filters `is_active = true`. Out-of-stock items are shown but demoted (`popularity` + `in_stock` in ranking), not hidden.

### 4.2 Hybrid / semantic search (S7)

- Request adds `hybrid: { semanticRatio: 0.5, embedder: "default" }` and, for a pure NL query from the assistant, a query vector from `ml-service /embed`.
- Meilisearch fuses BM25 + vector similarity internally.
- Used by: (a) the storefront when a query yields few keyword hits, (b) **M4 assistant** — LLM turns "cheap laptop for video editing under 150k" into `{ semantic query, filter: price < 150000 }`, Meilisearch returns candidates, LLM explains the top 3.
- If not using Meilisearch hybrid: `core-api` does its own RRF — run Meilisearch keyword search **and** `pgvector` `ORDER BY embedding <=> :qvec LIMIT 50`, then **Reciprocal Rank Fusion** `score(d) = Σ 1/(k + rank_i(d))`, `k = 60`. This RRF path is the documented DB-side alternative and is used in the evaluation.

### 4.3 Sync (S11) — see also `03-architecture.md` §5

- **Outbox (default):** product write → `search_outbox(op, product_id, payload, created_at)` in the same transaction → Arq worker every 2 s pushes batched add/update/delete to Meilisearch → nightly full `rebuild_search_index` safety net.
- **CDC (upgrade):** `wal_level=logical` + **meilisync** / **meilibridge** stream WAL → Meilisearch, sub-second, no app sync code. Documented as production hardening.
- Embedding refresh: nightly `ml-service` job computes embeddings for new/changed products → writes `products.embedding` → outbox/CDC carries `_vectors` to Meilisearch.

### 4.4 Fallback (S10)

`SearchService.search()`:

```
try Meilisearch (timeout 800 ms)
except (timeout, connection, 5xx):
    log.warning("search fallback → pg-fts")
    return postgres_fts_search(...)   # websearch_to_tsquery + ts_rank_cd, pg_trgm for fuzzy
```

Both branches return the identical `SearchResponse` schema; the response carries `engine` so the UI/tests can tell which path served the request.

### 4.5 Security

| Key | Holder | Scope |
|---|---|---|
| `MEILI_MASTER_KEY` | ops only | never in app code |
| Admin API key | `core-api`, Arq worker | create/update index + settings + documents |
| Search API key | Next.js Route Handler (and, if ever client-side, the browser) | `search` action on `products` only, `is_active = true` filter baked in |

The browser never talks to Meilisearch directly except through `/api/search/suggest`, which injects the scoped search key server-side.

---

## 5. API surface

Customer-facing (via `core-api`, documented in [`04-api-contract.md`](04-api-contract.md)):

```
GET /products/search?q=&category=&brand=&price_min=&price_max=&rating_min=&in_stock=&sort=&page=&page_size=
      → { items[], facets{brand[],category[],price_buckets[],rating[]}, total, page, engine }
GET /products/suggest?q=            → { suggestions[], products[] }   (lightweight, prefix)
POST /search/semantic  { query, filters }   → hybrid results  (also used internally by assistant)
```

Admin:

```
GET  /admin/search/analytics       → top queries, zero-result queries, CTR, avg latency
POST /admin/search/reindex         → enqueue full rebuild
GET  /admin/search/synonyms  ·  PUT /admin/search/synonyms
```

Next.js Route Handler:

```
GET /api/search/suggest?q=          → proxies Meilisearch with the scoped search key (no core-api hop)
```

---

## 6. Data model additions (see [`05-database-design.md`](05-database-design.md))

```sql
-- searchable text + vector live on products
ALTER TABLE products ADD COLUMN search_tsv tsvector
  GENERATED ALWAYS AS (
      setweight(to_tsvector('simple', unaccent(coalesce(title,''))), 'A') ||
      setweight(to_tsvector('simple', unaccent(coalesce(brand,''))), 'B') ||
      setweight(to_tsvector('simple', unaccent(coalesce(array_to_string(tags,' '),''))), 'B') ||
      setweight(to_tsvector('english', coalesce(description,'')), 'D')
  ) STORED;
CREATE INDEX products_search_tsv_gin ON products USING GIN (search_tsv);
CREATE INDEX products_title_trgm     ON products USING GIN (title gin_trgm_ops);
ALTER TABLE products ADD COLUMN embedding vector(384);
CREATE INDEX products_embedding_hnsw ON products USING hnsw (embedding vector_cosine_ops);

CREATE TABLE search_outbox (
  id BIGSERIAL PRIMARY KEY,
  op TEXT NOT NULL CHECK (op IN ('upsert','delete')),
  product_id TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE search_events (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id TEXT, anon_id TEXT, session_id TEXT,
  query TEXT NOT NULL,
  filters JSONB,
  result_count INT NOT NULL,
  engine TEXT NOT NULL,            -- 'meili' | 'pg-fts' | 'hybrid'
  clicked_product_id TEXT,        -- filled by a follow-up /events click
  latency_ms INT
);
CREATE INDEX search_events_query_idx ON search_events (lower(query), ts DESC);
```

---

## 7. Evaluation plan (FYP results chapter)

Build a **labelled query set** (~50 queries): head terms, long-tail, misspellings, NL queries, and for each 5–20 relevant product IDs (from category + human judgement on the seed catalog).

| System under test | Config |
|---|---|
| B0 Postgres FTS | `ts_rank_cd`, no trigram |
| B1 Postgres FTS + pg_trgm | fuzzy fallback on |
| B2 ParadeDB pg_search | BM25 index |
| **M Meilisearch (keyword)** | tuned ranking rules |
| **H Meilisearch hybrid** | `semanticRatio 0.5` |
| H-RRF | Meili keyword ⊕ pgvector, RRF k=60 |

Metrics: **Precision@10, Recall@10, MRR, NDCG@10**, zero-result rate, **typo-query success rate**, and **p50/p95 latency**. Expected results table:

```
System                       P@10   NDCG@10   Typo-success   p95 (ms)
Postgres FTS (B0)             0.34    0.41         12%           38
Postgres FTS + trgm (B1)      0.39    0.46         61%           55
ParadeDB pg_search (B2)       0.52    0.60         44%           22
Meilisearch keyword (M)       0.58    0.67         95%           11
Meilisearch hybrid (H)        0.63    0.72         96%           17
```

Also report: index size, indexing throughput (docs/s), sync lag under a bulk product update, and a screenshot of the search analytics dashboard (top / zero-result queries).

---

## 8. Implementation checklist

- [ ] `docker-compose`: add `meilisearch` service (v1.4x) + named volume; add `pgvector`/`pg_trgm` to the Postgres init
- [ ] `core-api/common/search_client.py` — Meilisearch SDK wrapper (admin key), index bootstrap (settings as code)
- [ ] `core-api/modules/search/` — `SearchService` (Meili path + PG-FTS fallback + hydrate + log), router, schemas
- [ ] Alembic migration — `search_tsv`, trigram index, `embedding`, `search_outbox`, `search_events`
- [ ] `core-api` product write path — write `search_outbox` in the same transaction
- [ ] `worker/tasks/search_sync.py` — Arq: drain outbox → Meilisearch; `rebuild_search_index`
- [ ] `ml-service` — `/embed` endpoint + nightly embedding backfill job
- [ ] Next.js — `app/api/search/suggest/route.ts`, `<SearchBox>` client component (debounced), `/search` Server Component, `<Facets>` client component driven by URL params
- [ ] Admin — search analytics page + reindex button + synonyms editor
- [ ] Eval — `ml-service/notebooks/08_search_evaluation.ipynb` + labelled query set in `data/eval/search_qrels.csv`
- [ ] Load `synonyms` and `stopWords` from `core-api/config/search/*.json`

---

## 9. Sources

- [Meilisearch — Elasticsearch alternatives (2026)](https://www.meilisearch.com/blog/elasticsearch-alternatives)
- [Meilisearch — Algolia alternatives (2026)](https://www.meilisearch.com/blog/algolia-alternatives)
- [Meilisearch — Typesense alternatives / comparison (2026)](https://www.meilisearch.com/blog/typesense-alternatives)
- [Meilisearch GitHub — AI-powered hybrid search](https://github.com/meilisearch/meilisearch)
- [Meilisearch — Hybrid search product page](https://www.meilisearch.com/products/hybrid-search)
- [Meilisearch — Vector search announcement](https://www.meilisearch.com/blog/vector-search-announcement)
- [Meilisearch docs — Migrating from PostgreSQL full-text search](https://www.meilisearch.com/docs/resources/migration/postgresql_migration)
- [Meilisearch docs — meilisync for PostgreSQL](https://www.meilisearch.com/docs/learn/cookbooks/meilisync_postgresql)
- [meilibridge — PostgreSQL → Meilisearch CDC connector](https://github.com/binary-touch/meilibridge)
- [OSSAlt — Meilisearch vs Typesense vs Elasticsearch (2026)](https://ossalt.com/blog/meilisearch-vs-typesense-vs-elasticsearch-search-2026)
- [Algoroq — Meilisearch vs Typesense for system design](https://algoroq.io/compare-tech/meilisearch-vs-typesense/)
- [Sliplane — Meilisearch alternatives](https://sliplane.io/blog/5-awesome-meilisearch-alternatives)
- [Typesense docs — Syncing data into Typesense](https://typesense.org/docs/guide/syncing-data-into-typesense.html)
- [Supabase — Postgres full-text search vs the rest](https://supabase.com/blog/postgres-full-text-search-vs-the-rest)
- [Xata — Postgres FTS vs Elasticsearch](https://xata.io/blog/postgres-full-text-search-postgres-vs-elasticsearch)
- [Tacnode — Full-text search in PostgreSQL: complete guide](https://tacnode.io/post/full-text-search-postgresql-complete-guide)
- [Nomadz — Postgres FTS or Meilisearch vs Typesense](https://nomadz.pl/en/blog/postgres-full-text-search-or-meilisearch-vs-typesense)
- [ParadeDB — Introduction to pg_search](https://docs.paradedb.com/welcome/introduction)
- [ParadeDB — Hybrid search in PostgreSQL: the missing manual](https://www.paradedb.com/blog/hybrid-search-in-postgresql-the-missing-manual)
- [ParadeDB — Implementing BM25 in PostgreSQL](https://www.paradedb.com/learn/search-in-postgresql/bm25)
- [pg_search on PGXN](https://pgxn.org/dist/pg_search/)
- [Neon docs — pg_search extension](https://neon.com/docs/extensions/pg_search)
- [Supabase docs — Hybrid search (RRF)](https://supabase.com/docs/guides/ai/hybrid-search)
- [dev.to — Hybrid search with pgvector + FTS + Reciprocal Rank Fusion](https://dev.to/lpossamai/building-hybrid-search-for-rag-combining-pgvector-and-full-text-search-with-reciprocal-rank-fusion-6nk)
- [Instaclustr — pgvector hybrid search](https://www.instaclustr.com/education/vector-database/pgvector-hybrid-search-benefits-use-cases-and-quick-tutorial/)
- [Instaclustr — pgvector key features (2026)](https://www.instaclustr.com/education/vector-database/pgvector-key-features-tutorial-and-pros-and-cons-2026-guide/)
- [freeCodeCamp — Build an AI-driven search experience with Meilisearch](https://www.freecodecamp.org/news/how-to-build-an-ai-driven-search-experience-using-meilisearch/)
- [Hexmos — We chose Meilisearch over 10+ other search engines](https://journal.hexmos.com/we-chose-meilisearch-over-10-other-search-engines-despite-a-major-drawback/)
