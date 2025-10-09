\echo '=== [00] Initializing Kitchen Cabinet PostgreSQL Schema ==='

-- Étape 0 — Créer utilisateur et base
\i /docker-entrypoint-initdb.d/00_user_bootstrap.sql

-- Étape 1 — Connexion à la base principale
\echo '→ Connecting to database dev-kitchen as dratharias...'
\connect "dev-kitchen" dratharias

\echo '→ Setting search_path to public...'
SET search_path TO public;

BEGIN;

-- Étape 2 — Extensions et utilitaires
\echo '→ Loading extensions and base utilities...'
\i /docker-entrypoint-initdb.d/01_extensions_core.sql

-- Étape 3 — Schéma principal
\echo '→ Building core schema...'
\i /docker-entrypoint-initdb.d/02_schema_core.sql

-- Étape 4 — Index et recherche fuzzy
\echo '→ Building search indexes and fuzzy search optimization...'
\i /docker-entrypoint-initdb.d/03_indexes_fuzzy.sql

COMMIT;

\echo '=== Kitchen Cabinet schema initialization complete ==='
