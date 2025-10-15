-- ====================================================================
-- [01] Core Extensions, Collations, and Utilities
-- ====================================================================

\echo '→ Installing core extensions...'

-- S’assurer que l’utilisateur peut créer dans public
ALTER SCHEMA public OWNER TO dratharias;

-- Crée les extensions manquantes (PostgreSQL ≥ 15)
DO
$$
BEGIN
  -- UUID
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    EXECUTE 'CREATE EXTENSION "uuid-ossp" SCHEMA public';
  END IF;

  -- UNACCENT
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
    EXECUTE 'CREATE EXTENSION unaccent SCHEMA public';
  END IF;

  -- PG_TRGM
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    EXECUTE 'CREATE EXTENSION pg_trgm SCHEMA public';
  END IF;
END
$$;

-- Collation française insensible aux accents
CREATE COLLATION IF NOT EXISTS fr_ci (
  provider = icu,
  locale = 'fr-CA-u-ks-level1',
  deterministic = false
);

-- Fonction de sécurité de taxonomie
CREATE OR REPLACE FUNCTION ensure_category_type(name text, type_name text)
RETURNS void AS $$
BEGIN
  INSERT INTO category(str_value, type)
  VALUES (name, type_name)
  ON CONFLICT (str_value, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

\echo '→ Extensions successfully installed.'
