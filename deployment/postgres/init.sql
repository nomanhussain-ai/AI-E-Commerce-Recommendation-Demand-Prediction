-- Runs once on first PostgreSQL boot (docker-entrypoint-initdb.d).
-- Extensions + least-privilege roles for the ecommerce-ai-platform.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
-- optional search bake-off (only if the image ships it):
-- CREATE EXTENSION IF NOT EXISTS pg_search;

-- ml-service read-only role
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ml_ro') THEN
    CREATE ROLE ml_ro LOGIN PASSWORD 'ml_ro';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ml_rw') THEN
    CREATE ROLE ml_rw LOGIN PASSWORD 'ml_rw';
  END IF;
END $$;

GRANT CONNECT ON DATABASE ecommerce TO ml_ro, ml_rw;
GRANT USAGE ON SCHEMA public TO ml_ro, ml_rw;

-- applied after Alembic creates the tables (re-run scripts/grants.sql post-migrate):
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ml_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ml_rw;
-- ml_rw additionally gets INSERT/UPDATE on model-output tables via scripts/grants.sql:
--   recommendations, product_similarity, forecasts, stock_alerts, user_profiles, model_registry, products(embedding)
