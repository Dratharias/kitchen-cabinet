-- ====================================================================
-- Bootstrap
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- CLEANUP
-- ====================================================================
DROP TABLE IF EXISTS review, resource_publication, resource_content,
    ingredient_unit, ingredient, product, macro, unit, content, segment,
    prep_time, content_prep_time, resource, publication, category, app_user CASCADE;

-- ====================================================================
-- USERS
-- ====================================================================
CREATE TABLE app_user (
    user_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role     VARCHAR(20) NOT NULL DEFAULT 'user',
    created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- CATEGORY
-- ====================================================================
CREATE TABLE category (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    str_value   VARCHAR(255) NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    num_value   SMALLINT CHECK (num_value >= 0),
    UNIQUE (str_value, type)
);

CREATE INDEX idx_category_type       ON category(type);
CREATE INDEX idx_category_str_value  ON category(str_value);
CREATE INDEX idx_category_str_and_type ON category(str_value, type);

-- ====================================================================
-- UTILITY FUNCTIONS AND TRIGGERS
-- ====================================================================

-- Function to ensure a category has a specific type
CREATE OR REPLACE FUNCTION ensure_category_type(p_category_id UUID, p_type VARCHAR)
RETURNS VOID AS $$
DECLARE
    v_actual_type VARCHAR(50);
BEGIN
    SELECT type INTO v_actual_type
    FROM category
    WHERE category_id = p_category_id;

    IF v_actual_type IS DISTINCT FROM p_type THEN
        RAISE EXCEPTION 'Category with id % does not have type % but has type %', p_category_id, p_type, v_actual_type;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- Function to enforce "Style" category type for publications
CREATE OR REPLACE FUNCTION trg_pub_enforce_style_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.style_id, 'Style');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pub_enforce_style_type
BEFORE INSERT OR UPDATE ON publication
FOR EACH ROW
EXECUTE FUNCTION trg_pub_enforce_style_type();

-- Function to enforce "Type" category type for publications
CREATE OR REPLACE FUNCTION trg_pub_enforce_type_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.type_id, 'Type');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pub_enforce_type_type
BEFORE INSERT OR UPDATE ON publication
FOR EACH ROW
EXECUTE FUNCTION trg_pub_enforce_type_type();

-- Function to enforce "Author" category type for publications
CREATE OR REPLACE FUNCTION trg_pub_enforce_author_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.author_id, 'Author');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pub_enforce_author_type
BEFORE INSERT OR UPDATE ON publication
FOR EACH ROW
EXECUTE FUNCTION trg_pub_enforce_author_type();

-- Function to enforce "Tag" category type for PublicationTag
CREATE OR REPLACE FUNCTION trg_pubtag_enforce_tag_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.category_id, 'Tag');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pubtag_enforce_tag_type
BEFORE INSERT OR UPDATE ON publication_tag
FOR EACH ROW
EXECUTE FUNCTION trg_pubtag_enforce_tag_type();

-- Function to enforce "Tag" category type for IngredientTag
CREATE OR REPLACE FUNCTION trg_ingtag_enforce_tag_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.category_id, 'Tag');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_ingtag_enforce_tag_type
BEFORE INSERT OR UPDATE ON ingredient_tag
FOR EACH ROW
EXECUTE FUNCTION trg_ingtag_enforce_tag_type();


-- ====================================================================
-- ENTITY TABLES
-- ====================================================================

-- Publications (Recipes, Articles, Books, etc.)
CREATE TABLE publication (
    publication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          TEXT NOT NULL,
    description    TEXT[],
    note           TEXT[],
    public         BOOLEAN DEFAULT FALSE,
    published      BOOLEAN DEFAULT FALSE,
    thumbnail      VARCHAR(255),
    type_id        UUID,
    style_id       UUID,
    author_id      UUID,

    FOREIGN KEY (type_id)   REFERENCES category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (style_id)  REFERENCES category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (author_id) REFERENCES category(category_id) ON DELETE SET NULL
);

-- Content (Recipe steps, Article paragraphs, etc.)
CREATE TABLE content (
    content_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT,
    public      BOOLEAN DEFAULT FALSE,
    published   BOOLEAN DEFAULT FALSE,
    note        TEXT[],
    text_field  TEXT,
    category_id UUID,

    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
);

-- Resources (Cookbooks, websites, magazines, etc.)
CREATE TABLE resource (
    resource_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT,
    note        TEXT[],
    url_id      UUID,
    
    FOREIGN KEY (url_id) REFERENCES category(category_id) ON DELETE SET NULL
);

-- Units of Measure
CREATE TABLE unit (
    unit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(50) UNIQUE NOT NULL
);

-- Macronutrients
CREATE TABLE macro (
    macro_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calories   SMALLINT CHECK (calories >= 0 AND calories <= 2000),
    protein    SMALLINT CHECK (protein >= 0 AND protein <= 2000),
    fiber      SMALLINT CHECK (fiber >= 0 AND fiber <= 2000),
    sugar      SMALLINT CHECK (sugar >= 0 AND sugar <= 2000),
    saturated  SMALLINT CHECK (saturated >= 0 AND saturated <= 2000),
    trans      SMALLINT CHECK (trans >= 0 AND trans <= 2000),
    caffein    SMALLINT CHECK (caffein >= 0 AND caffein <= 2000)
);

-- Products
CREATE TABLE product (
    product_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) UNIQUE NOT NULL,
    public      BOOLEAN DEFAULT FALSE,
    note        TEXT[],
    category_id UUID,
    macro_id    UUID,

    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (macro_id)    REFERENCES macro(macro_id) ON DELETE SET NULL
);

-- Ingredients (linking products to publications)
CREATE TABLE ingredient (
    ingredient_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    productId       UUID NOT NULL,
    publicationId   UUID NOT NULL,
    amount          DECIMAL(10, 2),
    note            TEXT[],
    
    FOREIGN KEY (productId) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (publicationId) REFERENCES publication(publication_id) ON DELETE CASCADE
);

-- Ingredient units
CREATE TABLE ingredient_unit (
    ingredient_id UUID NOT NULL,
    unit_id       UUID NOT NULL,

    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id)       REFERENCES unit(unit_id) ON DELETE CASCADE,
    PRIMARY KEY (ingredient_id, unit_id)
);

-- Preperation times
CREATE TABLE prep_time (
    prep_time_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duration     SMALLINT NOT NULL CHECK (duration >= 0),
    category_id  UUID,

    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
);

-- Junction table for Content & PrepTime (M:N)
CREATE TABLE content_prep_time (
    content_id   UUID NOT NULL,
    prep_time_id UUID NOT NULL,

    FOREIGN KEY (content_id)   REFERENCES content(content_id) ON DELETE CASCADE,
    FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, prep_time_id)
);

-- Junction table for Resources & Publications (M:N)
CREATE TABLE resource_publication (
    resource_id    UUID NOT NULL,
    publication_id UUID NOT NULL,
    order_in_book  SMALLINT CHECK (order_in_book >= 0),

    FOREIGN KEY (resource_id)    REFERENCES resource(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
    UNIQUE (resource_id, order_in_book),
    PRIMARY KEY (resource_id, publication_id)
);

-- Junction table for Resources & Content (M:N)
CREATE TABLE resource_content (
    resource_id UUID NOT NULL,
    content_id  UUID NOT NULL,

    FOREIGN KEY (resource_id) REFERENCES resource(resource_id) ON DELETE CASCADE,
    FOREIGN KEY (content_id)  REFERENCES content(content_id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, content_id)
);

-- Junction table for publications & tags
CREATE TABLE publication_tag (
    publication_id UUID NOT NULL,
    category_id    UUID NOT NULL,

    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)    REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (publication_id, category_id)
);

-- Reviews
CREATE TABLE review (
    review_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id     UUID,
    publication_id UUID,
    rating         SMALLINT CHECK (rating >= 1 AND rating <= 5),
    comment        TEXT[],
    description    TEXT[],
    buy_again      CHAR(1) CHECK (buy_again IN ('Y', 'N')),
    date_review    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id)     REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
    CHECK ( (product_id IS NOT NULL AND publication_id IS NULL) OR (product_id IS NULL AND publication_id IS NOT NULL) )
);

-- Segments
CREATE TABLE segment (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    text       TEXT[],
    link       VARCHAR(255)
);

-- Junction table for Ingredient & tags
CREATE TABLE ingredient_tag (
    ingredient_id UUID NOT NULL,
    category_id   UUID NOT NULL,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)   REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (ingredient_id, category_id)
);


-- ====================================================================\
-- VIEWS                                                              \
-- ====================================================================\
CREATE VIEW product_with_macros AS
SELECT p.*, m.name as macro_name, m.value as macro_value
FROM product p
LEFT JOIN macro m ON p.macro_id = m.macro_id;

-- ====================================================================\
-- RECALCULATE FUNCTIONS                                              \
-- ====================================================================\

-- Recalculate Total Prep Time
CREATE OR REPLACE FUNCTION recalc_total_prep_time(p_content_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE content
    SET note = array_prepend('Total prep time: ' ||
        (SELECT SUM(duration)
         FROM content_prep_time cp
         JOIN prep_time pt ON cp.prep_time_id = pt.prep_time_id
         WHERE cp.content_id = p_content_id)::TEXT || ' minutes',
        note)
    WHERE content_id = p_content_id;
END;
$$ LANGUAGE plpgsql;


-- ====================================================================\
-- TRIGGERS                                                           \
-- ====================================================================\

-- Trigger sur content_prep_time (ajout/suppression de ligne)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_content_cp()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM recalc_total_prep_time(NEW.content_id);
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM recalc_total_prep_time(OLD.content_id);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_content_prep_time
AFTER INSERT OR DELETE ON content_prep_time
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_content_cp();

-- Trigger sur prep_time (modification de la durée)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_preptime()
RETURNS TRIGGER AS $$
DECLARE
    v_content_id UUID;
BEGIN
    FOR v_content_id IN
        SELECT cp.content_id
          FROM content_prep_time cp
         WHERE cp.prep_time_id = NEW.prep_time_id
    LOOP
        PERFORM recalc_total_prep_time(v_content_id);
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbu_preptime_update
AFTER UPDATE OF duration ON prep_time
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_preptime();


-- ====================================================================\
-- Minimal taxonomy seed                                              \
-- ====================================================================\
INSERT INTO category (str_value, type) VALUES
    ('Book',   'Type'),
    ('Recipe', 'Type'),
    ('Article','Type'),
    ('https://example.com', 'URL');
