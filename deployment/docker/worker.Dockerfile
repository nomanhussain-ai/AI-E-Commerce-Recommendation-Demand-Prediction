# worker — Arq background jobs (search index sync, nightly rollups)
# Placeholder until Phase 6 (search) — services/worker/ does not exist yet.
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

COPY services/worker/ ./
RUN pip install --upgrade pip && pip install -e "." || echo "worker not scaffolded yet"

CMD ["python", "-c", "print('worker placeholder — scaffolded in Phase 6'); import time; time.sleep(1e9)"]
