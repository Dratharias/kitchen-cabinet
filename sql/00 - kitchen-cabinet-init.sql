-- ====================================================================
-- Bootstrap
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- CATEGORY (taxonomy/references)
-- - strValue: actual value (URL, image path, author name, style label, tag)
-- - type:    logical bucket ('URL','Image','Author','Style','Tag','Type',...)
-- - numValue: optional numeric metadata (>=0)
-- - (strValue,type) UNIQUE avoids duplicates inside the same bucket
-- ====================================================================
DROP TABLE IF EXISTS PublicationTags, ContentIngredient, ContentReview, ContentSegment, ContentPrepTime,
    IngredientUnit, SegmentPrepTime, ResourceContent, ResourceGallery, ResourcePublication,
    VariantPublication
    CASCADE;
DROP TABLE IF EXISTS Review, Variant, Resource, Segment, PrepTime, Macro, Product, Unit, Ingredient,
    Content, Publication, Category CASCADE;

CREATE TABLE Category (
    categoryId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strValue   VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    numValue   SMALLINT CHECK (numValue >= 0),
    UNIQUE (strValue, type)
);

-- Common lookups
CREATE INDEX idx_category_type       ON Category(type);
CREATE INDEX idx_category_strvalue   ON Category(strValue);
CREATE INDEX idx_category_type_value ON Category(type, strValue);

-- ====================================================================
-- PUBLICATION (articles, recipes, books, etc.)
-- - type/style/author reference Category
-- - resource (FK added later) to avoid cycle with Resource
-- ====================================================================
CREATE TABLE Publication (
    publicationId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         VARCHAR(255) NOT NULL,
    description   TEXT[],                          -- optional multi-paragraph description
    note          TEXT[],                           -- optional notes
    public        BOOLEAN NOT NULL DEFAULT FALSE,
    published     BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail     VARCHAR(255),
    type          UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,  -- Category.type='Type'
    style         UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,  -- Category.type='Style'
    author        UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,  -- Category.type='Author'
    resource      UUID                                   -- FK added after Resource exists
);

CREATE INDEX idx_publication_type       ON Publication(type);
CREATE INDEX idx_publication_style      ON Publication(style);
CREATE INDEX idx_publication_author     ON Publication(author);
CREATE INDEX idx_publication_published  ON Publication(published);

-- ====================================================================
-- PUBLICATION TAGS (N–N)
-- ====================================================================
CREATE TABLE PublicationTags (
    publicationId UUID REFERENCES Publication(publicationId) ON DELETE CASCADE,
    categoryId    UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,  -- Category.type='Tag'
    PRIMARY KEY (publicationId, categoryId)
);
CREATE INDEX idx_pubtags_category ON PublicationTags(categoryId);

-- ====================================================================
-- CONTENT (reusable blocks) + bridges
-- ====================================================================
CREATE TABLE Content (
    contentId   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255) NOT NULL,
    description TEXT[],
    note        TEXT[],
    category    UUID REFERENCES Category(categoryId) ON DELETE RESTRICT     -- e.g. 'Recipe','Article'
);

-- Content <-> Ingredient (N–N)
CREATE TABLE ContentIngredient (
    contentId    UUID REFERENCES Content(contentId)     ON DELETE CASCADE,
    ingredientId UUID REFERENCES Ingredient(ingredientId) ON DELETE RESTRICT,
    PRIMARY KEY (contentId, ingredientId)
);
-- Will create idx after Ingredient exists.

-- Content <-> Review (N–N)
CREATE TABLE ContentReview (
    contentId UUID REFERENCES Content(contentId) ON DELETE CASCADE,
    reviewId  UUID REFERENCES Review(reviewId)   ON DELETE RESTRICT,
    PRIMARY KEY (contentId, reviewId)
);
-- Will create idx after Review exists.

-- Content <-> Segment (N–N)
CREATE TABLE ContentSegment (
    contentId UUID REFERENCES Content(contentId) ON DELETE CASCADE,
    segmentId UUID REFERENCES Segment(segmentId) ON DELETE RESTRICT,
    PRIMARY KEY (contentId, segmentId)
);
-- Will create idx after Segment exists.

-- Content <-> PrepTime (N–N)
CREATE TABLE ContentPrepTime (
    contentId  UUID REFERENCES Content(contentId)   ON DELETE CASCADE,
    prepTimeId UUID REFERENCES PrepTime(prepTimeId) ON DELETE RESTRICT,
    PRIMARY KEY (contentId, prepTimeId)
);
-- Will create idx after PrepTime exists.

-- ====================================================================
-- INGREDIENTS / PRODUCTS / UNITS / MACROS
-- - Ingredient.quantity is numeric part; units are attached via N–N
-- ====================================================================
CREATE TABLE Ingredient (
    ingredientId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity     SMALLINT CHECK (quantity >= 0),
    isRecipe     UUID REFERENCES Publication(publicationId) ON DELETE RESTRICT, -- sub-recipe
    product      UUID REFERENCES Product(productId)         ON DELETE RESTRICT   -- concrete product
);

CREATE INDEX idx_ingredient_product  ON Ingredient(product);
CREATE INDEX idx_ingredient_isrecipe ON Ingredient(isRecipe);

CREATE TABLE Unit (
    unitId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name   VARCHAR(20) UNIQUE NOT NULL
);

-- N–N Ingredient ↔ Unit (supports many units per ingredient)
CREATE TABLE IngredientUnit (
    ingredientId UUID REFERENCES Ingredient(ingredientId) ON DELETE CASCADE,
    unitId       UUID REFERENCES Unit(unitId)             ON DELETE RESTRICT,
    PRIMARY KEY (ingredientId, unitId)
);
CREATE INDEX idx_ingunit_unit ON IngredientUnit(unitId);

CREATE TABLE Macro (
    macroId   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calories  SMALLINT CHECK (calories  >= 0),
    protein   SMALLINT CHECK (protein   >= 0),
    fiber     SMALLINT CHECK (fiber     >= 0),
    sugar     SMALLINT CHECK (sugar     >= 0),
    saturated SMALLINT CHECK (saturated >= 0),
    trans     SMALLINT CHECK (trans     >= 0),
    caffein   SMALLINT CHECK (caffein   >= 0)
);

CREATE TABLE Product (
    productId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name      VARCHAR(255) NOT NULL,  -- French name
    enName    VARCHAR(255),           -- English name (for open data joins)
    macro     UUID REFERENCES Macro(macroId)       ON DELETE RESTRICT,
    category  UUID REFERENCES Category(categoryId) ON DELETE RESTRICT
);
CREATE INDEX idx_product_category ON Product(category);

-- ====================================================================
-- TIMING / SEGMENTS
-- ====================================================================
CREATE TABLE PrepTime (
    prepTimeId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duration   SMALLINT NOT NULL CHECK (duration >= 0),
    category   UUID NOT NULL REFERENCES Category(categoryId) ON DELETE RESTRICT  -- e.g. 'Infusion'
);

CREATE TABLE Segment (
    segmentId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paragraph TEXT UNIQUE NOT NULL,
    "order"   SMALLINT NOT NULL CHECK ("order" >= 0)
);

-- Segment <-> PrepTime (N–N) (a step can include multiple timing types)
CREATE TABLE SegmentPrepTime (
    segmentId  UUID REFERENCES Segment(segmentId)  ON DELETE CASCADE,
    prepTimeId UUID REFERENCES PrepTime(prepTimeId) ON DELETE RESTRICT,
    PRIMARY KEY (segmentId, prepTimeId)
);

-- ====================================================================
-- RESOURCE (media container) + gallery
-- - url: Category of type 'URL'
-- - A "Book" is: a Publication whose type Category.strValue='Book' and whose
--   Publication.resource points to the Resource that aggregates its items.
-- ====================================================================
CREATE TABLE Resource (
    resourceId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url        UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,   -- Category.type='URL'
    variant    UUID                                                       -- FK added after Variant exists
);
CREATE INDEX idx_resource_url ON Resource(url);

-- Resource <-> Content (N–N)
CREATE TABLE ResourceContent (
    resourceId UUID REFERENCES Resource(resourceId) ON DELETE CASCADE,
    contentId  UUID REFERENCES Content(contentId)   ON DELETE RESTRICT,
    PRIMARY KEY (resourceId, contentId)
);
CREATE INDEX idx_rescontent_content ON ResourceContent(contentId);

-- Resource gallery (ordered)
CREATE TABLE ResourceGallery (
    resourceId UUID REFERENCES Resource(resourceId) ON DELETE CASCADE,
    categoryId UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,   -- Category.type='Image'
    ordering   SMALLINT CHECK (ordering >= 0),
    PRIMARY KEY (resourceId, categoryId)
);
CREATE UNIQUE INDEX uq_gallery_order_per_resource ON ResourceGallery(resourceId, ordering);
CREATE INDEX idx_gallery_order ON ResourceGallery(ordering);

-- Resource <-> Publication (N–N) used primarily for **Books** to contain items
-- order_in_book: ordering of the child publication within the book
CREATE TABLE ResourcePublication (
    resourceId      UUID REFERENCES Resource(resourceId)    ON DELETE CASCADE,
    publicationId   UUID REFERENCES Publication(publicationId) ON DELETE RESTRICT,
    order_in_book   SMALLINT CHECK (order_in_book >= 0),
    PRIMARY KEY (resourceId, publicationId)
);
CREATE UNIQUE INDEX idx_respub_order UNIQUE (resourceId, order_in_book);

-- ====================================================================
-- VARIANT
-- Keep the 1–1 cycle (as in your original shape) + allow variants to reference publications
-- ====================================================================
CREATE TABLE Variant (
    variantId  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resourceId UUID   -- FK added after Resource exists (cycle)
);
CREATE INDEX idx_variant_resource ON Variant(resourceId);

-- Variants can target publications directly (replaces old Target table)
CREATE TABLE VariantPublication (
    variantId     UUID REFERENCES Variant(variantId)       ON DELETE CASCADE,
    publicationId UUID REFERENCES Publication(publicationId) ON DELETE RESTRICT,
    PRIMARY KEY (variantId, publicationId)
);
CREATE INDEX idx_variant_publication ON VariantPublication(publicationId);

-- ====================================================================
-- REVIEW
-- ====================================================================
CREATE TABLE Review (
    reviewId    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product     UUID REFERENCES Product(productId)       ON DELETE CASCADE,
    publication UUID REFERENCES Publication(publicationId) ON DELETE CASCADE,
    rating      SMALLINT CHECK (rating BETWEEN 0 AND 10),
    comment     TEXT[],
    description TEXT[],
    buyAgain    CHAR(1) CHECK (buyAgain IN ('T','F','M','N')),  -- True, False, Maybe, Not-priority
    dateReview  DATE DEFAULT CURRENT_DATE
);

-- Backfill pending indexes for bridges created before dependencies
CREATE INDEX idx_content_ing_ingredient  ON ContentIngredient(ingredientId);
CREATE INDEX idx_content_rev_review      ON ContentReview(reviewId);
CREATE INDEX idx_content_seg_segment     ON ContentSegment(segmentId);
CREATE INDEX idx_content_preptime_pt     ON ContentPrepTime(prepTimeId);

-- ====================================================================
-- ADD CYCLIC FKs (DEFERRABLE) AFTER BOTH SIDES EXIST
-- ====================================================================
-- Publication.resource -> Resource
ALTER TABLE Publication
  ADD CONSTRAINT fk_publication_resource
  FOREIGN KEY (resource)
  REFERENCES Resource(resourceId)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- Variant.resourceId -> Resource
ALTER TABLE Variant
  ADD CONSTRAINT fk_variant_resource
  FOREIGN KEY (resourceId)
  REFERENCES Resource(resourceId)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- Resource.variant -> Variant
ALTER TABLE Resource
  ADD CONSTRAINT fk_resource_variant
  FOREIGN KEY (variant)
  REFERENCES Variant(variantId)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- ====================================================================
-- GUARD RAILS (helper + triggers)
-- ====================================================================

-- Helper: ensure a Category row is of the expected type
CREATE OR REPLACE FUNCTION ensure_category_type(cat_id UUID, expected_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF cat_id IS NULL THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1
          FROM Category c
         WHERE c.categoryId = cat_id
           AND c.type = expected_type
    ) THEN
        RETURN TRUE;
    END IF;

    RAISE EXCEPTION 'Category % must be of type %', cat_id, expected_type;
END;
$$ LANGUAGE plpgsql;

-- Publication: enforce type/style/author buckets
CREATE OR REPLACE FUNCTION trg_publication_enforce_category_types()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.type,   'Type');
    PERFORM ensure_category_type(NEW.style,  'Style');
    PERFORM ensure_category_type(NEW.author, 'Author');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_publication_enforce_category_types
BEFORE INSERT OR UPDATE ON Publication
FOR EACH ROW
EXECUTE FUNCTION trg_publication_enforce_category_types();

-- Resource: url must be Category.type='URL'
CREATE OR REPLACE FUNCTION trg_resource_enforce_url_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.url, 'URL');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_resource_enforce_url_type
BEFORE INSERT OR UPDATE ON Resource
FOR EACH ROW
EXECUTE FUNCTION trg_resource_enforce_url_type();

-- ResourceGallery: image Category.type='Image'
CREATE OR REPLACE FUNCTION trg_resgallery_enforce_image_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.categoryId, 'Image');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_resgallery_enforce_image_type
BEFORE INSERT OR UPDATE ON ResourceGallery
FOR EACH ROW
EXECUTE FUNCTION trg_resgallery_enforce_image_type();

-- Forbid "Book in Book" in ResourcePublication:
-- Parent resource must belong to a Publication whose Type is 'Book'
-- Child publication must NOT be a 'Book'
CREATE OR REPLACE FUNCTION trg_forbid_book_in_book()
RETURNS TRIGGER AS $$
DECLARE
    parent_is_book BOOLEAN;
    child_is_book  BOOLEAN;
BEGIN
    -- Is the resource attached to a Book publication?
    SELECT EXISTS (
        SELECT 1
          FROM Publication p
          JOIN Category ct ON ct.categoryId = p.type
         WHERE p.resource = NEW.resourceId
           AND ct.type = 'Type'
           AND ct.strValue = 'Book'
    ) INTO parent_is_book;

    IF NOT parent_is_book THEN
        RAISE EXCEPTION 'Resource % is not attached to a Book publication, cannot aggregate publications here.',
            NEW.resourceId;
    END IF;

    -- Is the child itself a Book?
    SELECT EXISTS (
        SELECT 1
          FROM Publication p
          JOIN Category ct ON ct.categoryId = p.type
         WHERE p.publicationId = NEW.publicationId
           AND ct.type = 'Type'
           AND ct.strValue = 'Book'
    ) INTO child_is_book;

    IF child_is_book THEN
        RAISE EXCEPTION 'A Book cannot contain another Book (publicationId=%).', NEW.publicationId;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_respub_forbid_book_in_book
BEFORE INSERT OR UPDATE ON ResourcePublication
FOR EACH ROW
EXECUTE FUNCTION trg_forbid_book_in_book();

-- PublicationTags: ensure tag category actually is 'Tag'
CREATE OR REPLACE FUNCTION trg_pubtags_enforce_tag_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.categoryId, 'Tag');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pubtags_enforce_tag_type
BEFORE INSERT OR UPDATE ON PublicationTags
FOR EACH ROW
EXECUTE FUNCTION trg_pubtags_enforce_tag_type();

-- ====================================================================
-- VIEWS (compact helpers)
-- ====================================================================

-- Publications + aggregated tags
CREATE OR REPLACE VIEW v_publications_with_tags AS
SELECT p.publicationId,
       p.title,
       ARRAY_REMOVE(ARRAY_AGG(t.strValue ORDER BY t.strValue), NULL) AS tags
  FROM Publication p
  LEFT JOIN PublicationTags pt ON pt.publicationId = p.publicationId
  LEFT JOIN Category       t  ON t.categoryId     = pt.categoryId
 GROUP BY p.publicationId, p.title;

-- Resources + ordered gallery images
CREATE OR REPLACE VIEW v_resources_with_gallery AS
SELECT r.resourceId,
       r.url,
       ARRAY_REMOVE(ARRAY_AGG(img.strValue ORDER BY rg.ordering), NULL) AS images
  FROM Resource r
  LEFT JOIN ResourceGallery rg ON rg.resourceId = r.resourceId
  LEFT JOIN Category img       ON img.categoryId = rg.categoryId
 GROUP BY r.resourceId, r.url;

-- Books with their items (parent = Publication.type 'Book')
CREATE OR REPLACE VIEW v_books_with_publications AS
SELECT p_book.publicationId        AS book_publication_id,
       p_item.publicationId        AS item_publication_id,
       p_item.title                AS item_title,
       rp.order_in_book
  FROM ResourcePublication rp
  JOIN Publication p_book ON p_book.resource = rp.resourceId
  JOIN Category   ct_book ON ct_book.categoryId = p_book.type
                          AND ct_book.type = 'Type' AND ct_book.strValue = 'Book'
  JOIN Publication p_item ON p_item.publicationId = rp.publicationId
 ORDER BY p_book.publicationId, rp.order_in_book;

-- ====================================================================
-- Seed a minimal taxonomy so triggers have something to validate
-- ====================================================================
INSERT INTO Category (strValue, type) VALUES
    ('Book',   'Type'),
    ('Recipe', 'Type'),
    ('Article','Type'),
    ('https://example.com', 'URL'),
    ('/images/default.png', 'Image'),
    ('Unknown Author', 'Author'),
    ('Default Style', 'Style'),
    ('General', 'Tag');
