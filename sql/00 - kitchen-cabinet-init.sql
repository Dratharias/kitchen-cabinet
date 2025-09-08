-- ====================================================================
-- Bootstrap
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- CLEANUP
-- ====================================================================
DROP TABLE IF EXISTS Review, ResourcePublication, ResourceContent,
    IngredientUnit, Ingredient, Product, Macro, Unit, Content, Segment,
    PrepTime, Resource, Publication, Category, AppUser CASCADE;

CREATE TABLE AppUser (
    userId   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,          -- store hashed password
    role     VARCHAR(20) NOT NULL DEFAULT 'user', -- 'admin' or 'user'
    created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- CATEGORY
-- ====================================================================
CREATE TABLE Category (
    categoryId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strValue   VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    numValue   SMALLINT CHECK (numValue >= 0),
    UNIQUE (strValue, type)
);

CREATE INDEX idx_category_type       ON Category(type);
CREATE INDEX idx_category_strvalue   ON Category(strValue);
CREATE INDEX idx_category_type_value ON Category(type, strValue);

-- ====================================================================
-- PUBLICATION
-- ====================================================================
CREATE TABLE Publication (
    publicationId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         VARCHAR(255) NOT NULL,
    description   TEXT[],
    note          TEXT[],
    public        BOOLEAN NOT NULL DEFAULT FALSE,
    published     BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail     VARCHAR(255),
    type          UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,   -- 'Type'
    style         UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,   -- 'Style'
    author        UUID REFERENCES Category(categoryId) ON DELETE RESTRICT,   -- 'Author'
    resource      UUID                                                      -- FK added later
);

CREATE TABLE PublicationTag (
    publicationId UUID REFERENCES Publication(publicationId) ON DELETE CASCADE,
    categoryId    UUID REFERENCES Category(categoryId)       ON DELETE RESTRICT,
    PRIMARY KEY (publicationId, categoryId)
);

CREATE INDEX idx_pubtag_pub  ON PublicationTag(publicationId);
CREATE INDEX idx_pubtag_cat  ON PublicationTag(categoryId);
CREATE INDEX idx_publication_type       ON Publication(type);
CREATE INDEX idx_publication_style      ON Publication(style);
CREATE INDEX idx_publication_author     ON Publication(author);
CREATE INDEX idx_publication_published  ON Publication(published);

-- ====================================================================
-- CONTENT
-- ====================================================================
CREATE TABLE Content (
    contentId   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       VARCHAR(255) NOT NULL,
    description TEXT[],
    note        TEXT[],
    totalPrepTime INT NOT NULL DEFAULT 0,
    servings INT,
    category    UUID REFERENCES Category(categoryId) ON DELETE RESTRICT
);

-- ====================================================================
-- INGREDIENTS / PRODUCTS / UNITS / MACROS
-- ====================================================================
CREATE TABLE Unit (
    unitId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name   VARCHAR(20) UNIQUE NOT NULL
);

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
    name      VARCHAR(255) NOT NULL,
    enName    VARCHAR(255),
    macro     UUID REFERENCES Macro(macroId)       ON DELETE RESTRICT,
    category  UUID REFERENCES Category(categoryId) ON DELETE RESTRICT
);
CREATE INDEX idx_product_category ON Product(category);

CREATE TABLE Ingredient (
    ingredientId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity     SMALLINT CHECK (quantity >= 0),
    isRecipe     UUID REFERENCES Publication(publicationId) ON DELETE RESTRICT, -- sub-recipe
    product      UUID REFERENCES Product(productId)         ON DELETE RESTRICT
);
CREATE INDEX idx_ingredient_product  ON Ingredient(product);
CREATE INDEX idx_ingredient_isrecipe ON Ingredient(isRecipe);

CREATE TABLE IngredientUnit (
    ingredientId UUID REFERENCES Ingredient(ingredientId) ON DELETE CASCADE,
    unitId       UUID REFERENCES Unit(unitId)             ON DELETE RESTRICT,
    PRIMARY KEY (ingredientId, unitId)
);
CREATE INDEX idx_ingunit_unit ON IngredientUnit(unitId);

-- ====================================================================
-- TIMING / SEGMENTS
-- ====================================================================
CREATE TABLE PrepTime (
    prepTimeId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duration   SMALLINT NOT NULL CHECK (duration >= 0),
    category   UUID NOT NULL REFERENCES Category(categoryId) ON DELETE RESTRICT
);

CREATE TABLE ContentPrepTime (
    contentId   UUID REFERENCES Content(contentId) ON DELETE CASCADE,
    prepTimeId  UUID REFERENCES PrepTime(prepTimeId) ON DELETE CASCADE,
    PRIMARY KEY (contentId, prepTimeId)
);
CREATE INDEX idx_contpreptime_content ON ContentPrepTime(contentId);
CREATE INDEX idx_contpreptime_time    ON ContentPrepTime(prepTimeId);

CREATE TABLE Segment (
    segmentId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paragraph TEXT UNIQUE NOT NULL,
    "order"   SMALLINT NOT NULL CHECK ("order" >= 0)
);

-- ====================================================================
-- RESOURCE
-- ====================================================================
CREATE TABLE Resource (
    resourceId UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url        UUID REFERENCES Category(categoryId) ON DELETE RESTRICT  -- 'URL'
);
CREATE INDEX idx_resource_url ON Resource(url);

-- Resource <-> Content
CREATE TABLE ResourceContent (
    resourceId UUID REFERENCES Resource(resourceId) ON DELETE CASCADE,
    contentId  UUID REFERENCES Content(contentId)   ON DELETE RESTRICT,
    PRIMARY KEY (resourceId, contentId)
);

-- Resource <-> Publication (used for variants/books)
CREATE TABLE ResourcePublication (
    resourceId    UUID REFERENCES Resource(resourceId)    ON DELETE CASCADE,
    publicationId UUID REFERENCES Publication(publicationId) ON DELETE RESTRICT,
    order_in_book SMALLINT CHECK (order_in_book >= 0),
    PRIMARY KEY (resourceId, publicationId)
);

CREATE UNIQUE INDEX idx_respub_order UNIQUE (resourceId, order_in_book);

-- Publication.resource -> Resource
ALTER TABLE Publication
  ADD CONSTRAINT fk_publication_resource
  FOREIGN KEY (resource)
  REFERENCES Resource(resourceId)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

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
    buyAgain    CHAR(1) CHECK (buyAgain IN ('T','F','M','N')),
    dateReview  DATE DEFAULT CURRENT_DATE
);

-- ====================================================================
-- GUARD RAILS
-- ====================================================================

-- Helper: enforce Category.type
CREATE OR REPLACE FUNCTION ensure_category_type(cat_id UUID, expected_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF cat_id IS NULL THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM Category c
         WHERE c.categoryId = cat_id
           AND c.type = expected_type
    ) THEN
        RETURN TRUE;
    END IF;

    RAISE EXCEPTION 'Category % must be of type %', cat_id, expected_type;
END;
$$ LANGUAGE plpgsql;

-- Publication: enforce type/style/author categories
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

-- Resource: url must be 'URL'
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

-- Forbid "Book in Book"
CREATE OR REPLACE FUNCTION trg_forbid_book_in_book()
RETURNS TRIGGER AS $$
DECLARE
    parent_is_book BOOLEAN;
    child_is_book  BOOLEAN;
BEGIN
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

-- Function: recalcule le totalPrepTime pour un contentId donné
CREATE OR REPLACE FUNCTION recalc_total_prep_time(contentId UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE Content c
       SET totalPrepTime = COALESCE((
           SELECT SUM(pt.duration)
             FROM ContentPrepTime cp
             JOIN PrepTime pt ON pt.prepTimeId = cp.prepTimeId
            WHERE cp.contentId = contentId
       ), 0)
     WHERE c.contentId = contentId;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur ContentPrepTime (ajout / suppression / update)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_content_cp()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalc_total_prep_time(COALESCE(NEW.contentId, OLD.contentId));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_contpreptime_update
AFTER INSERT OR UPDATE OR DELETE ON ContentPrepTime
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_content_cp();

-- Trigger sur PrepTime (modification de la durée)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_preptime()
RETURNS TRIGGER AS $$
DECLARE
    contentId UUID;
BEGIN
    FOR contentId IN
        SELECT cp.contentId
          FROM ContentPrepTime cp
         WHERE cp.prepTimeId = NEW.prepTimeId
    LOOP
        PERFORM recalc_total_prep_time(contentId);
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbu_preptime_update
AFTER UPDATE OF duration ON PrepTime
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_preptime();

CREATE OR REPLACE FUNCTION trg_pubtag_enforce_tag_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.categoryId, 'Tag');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pubtag_enforce_tag_type
BEFORE INSERT OR UPDATE ON PublicationTag
FOR EACH ROW
EXECUTE FUNCTION trg_pubtag_enforce_tag_type();

-- ====================================================================
-- Minimal taxonomy seed
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
