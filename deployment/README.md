# Deployment

Full guide: [`../docs/08-deployment.md`](../docs/08-deployment.md).

```
deployment/
├── docker/
│   ├── web.Dockerfile          # Next.js 16 (standalone build → next start)
│   ├── core-api.Dockerfile     # FastAPI business API (uv, python:3.12-slim, non-root)
│   ├── ml.Dockerfile           # FastAPI ml-service (+ lightgbm/implicit build deps)
│   └── worker.Dockerfile       # Arq worker
├── postgres/
│   └── init.sql                # extensions (vector, pg_trgm, unaccent, citext) + ml_ro/ml_rw roles
├── meilisearch/
│   └── settings.products.json  # index settings-as-code (searchable/filterable/sortable/ranking/synonyms)
├── nginx/
│   └── default.conf            # reverse proxy for docker-compose.prod.yml
├── production/
│   ├── web.env.example  core-api.env.example  ml.env.example  worker.env.example
└── monitoring/
    ├── health-check.sh         # pings /health on every service
    └── backup.sh               # nightly pg_dump → object storage
```

Target hosts: web → Vercel or Node container; core-api / ml-service / worker → Render / Railway / Fly.io; PostgreSQL → Neon / Supabase / RDS (must support `pgvector`); Meilisearch → Meilisearch Cloud or container + volume; Redis → Upstash / managed.

> The old `backend.Dockerfile` / `frontend.Dockerfile` / `ml.Dockerfile` names are from the v1 (NestJS/React) layout and are superseded by the files above.
