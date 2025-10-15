-- ====================================================================
-- [03] Search Optimization and Fuzzy Search Indexes
-- ====================================================================

\echo '→ Ensuring unaccent() exists before index creation...'

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'unaccent') THEN
    RAISE EXCEPTION 'Extension unaccent is missing — run 01_extensions_core.sql first.';
  END IF;
END $$;

\echo '→ Creating immutable_unaccent() helper...'
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text AS
$$
  SELECT public.unaccent($1);
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

\echo '→ Creating immutable_to_tsvector() helper...'
CREATE OR REPLACE FUNCTION immutable_to_tsvector(text[])
RETURNS tsvector AS
$$
  SELECT to_tsvector('simple', array_to_string($1, ' '));
$$ LANGUAGE SQL IMMUTABLE PARALLEL SAFE;

-- Publication title / description
CREATE INDEX IF NOT EXISTS idx_publication_title_trgm
  ON publication USING gin (immutable_unaccent(lower(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_publication_description_gin
  ON publication USING gin (immutable_to_tsvector(description));

-- Segment paragraph
CREATE INDEX IF NOT EXISTS idx_segment_paragraph_trgm
  ON segment USING gin (immutable_unaccent(lower(paragraph)) gin_trgm_ops);

-- Product names
CREATE INDEX IF NOT EXISTS idx_product_name_trgm
  ON product USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);

-- Units
CREATE INDEX IF NOT EXISTS idx_unit_name_trgm
  ON unit USING gin (immutable_unaccent(lower(name)) gin_trgm_ops);

-- Ingredients
CREATE INDEX IF NOT EXISTS idx_ingredient_title_trgm
  ON ingredient USING gin (immutable_unaccent(lower(title)) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ingredient_cut_trgm
  ON ingredient USING gin (immutable_unaccent(lower(cut)) gin_trgm_ops);

-- Categories
CREATE INDEX IF NOT EXISTS idx_category_str_value_trgm
  ON category USING gin (immutable_unaccent(lower(str_value)) gin_trgm_ops);

-- Fuzzy search helper function
CREATE OR REPLACE FUNCTION fuzzy_publication_search(search_term TEXT)
RETURNS TABLE (
  publication_id UUID,
  title TEXT,
  similarity_score REAL
) AS $$
DECLARE
  effective_threshold REAL := 0.4;
BEGIN
  -- Abaisse le seuil pour les termes courts (ex: "ba", "su")
  IF length(search_term) < 3 THEN
    effective_threshold := 0.1;
  ELSIF length(search_term) < 5 THEN
    effective_threshold := 0.25;
  END IF;

  RETURN QUERY
  SELECT p.publication_id::uuid,
         p.title,
         similarity(
           immutable_unaccent(lower(p.title)),
           immutable_unaccent(lower(search_term))
         ) AS similarity_score
  FROM publication p
  WHERE
    (
      similarity(
        immutable_unaccent(lower(p.title)),
        immutable_unaccent(lower(search_term))
      ) >= effective_threshold
      OR immutable_unaccent(lower(p.title))
         ILIKE immutable_unaccent(lower(search_term)) || '%'
      OR immutable_unaccent(lower(p.title))
         ILIKE '%' || immutable_unaccent(lower(search_term)) || '%'
    )
    AND p.public = TRUE
    AND p.published = TRUE
  ORDER BY
    similarity_score DESC,
    p.title ASC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;


\echo '→ Search indexes and fuzzy helpers installed successfully.'
