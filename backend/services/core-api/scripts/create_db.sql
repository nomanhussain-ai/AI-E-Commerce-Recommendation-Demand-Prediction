-- One-time local setup. Run as the postgres superuser:
--   psql -U postgres -f scripts/create_db.sql
-- Matches the default DATABASE_URL in .env  (app / app / ecommerce).

-- Create the role, or reset its password if it already exists (idempotent).
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app') THEN
        CREATE ROLE app WITH LOGIN PASSWORD 'app';
    ELSE
        ALTER ROLE app WITH LOGIN PASSWORD 'app';
    END IF;
END $$;

-- CREATE DATABASE can't run inside DO/IF; \gexec runs the row only if missing.
SELECT 'CREATE DATABASE ecommerce OWNER app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'ecommerce')
\gexec

-- Make sure the role owns it even if the DB pre-existed.
ALTER DATABASE ecommerce OWNER TO app;

-- citext / pg_trgm / unaccent are trusted extensions, so the migration can
-- create them as the "app" owner. pgvector is optional until the ML phase.
