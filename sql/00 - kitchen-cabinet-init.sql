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
CREATE INDEX idx_category_type_value ON category(type, str_value);

-- ====================================================================
-- PUBLICATION
-- ====================================================================
CREATE TABLE publication (
    publication_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          VARCHAR(255) NOT NULL,
    description    TEXT[],
    note           TEXT[],
    public         BOOLEAN NOT NULL DEFAULT FALSE,
    published      BOOLEAN NOT NULL DEFAULT FALSE,
    thumbnail      VARCHAR(255),
    type_id        UUID REFERENCES category(category_id) ON DELETE RESTRICT,
    style_id       UUID REFERENCES category(category_id) ON DELETE RESTRICT,
    author_id      UUID REFERENCES category(category_id) ON DELETE RESTRICT,
    resource_id    UUID
);

CREATE TABLE publication_tag (
    publication_id UUID REFERENCES publication(publication_id) ON DELETE CASCADE,
    category_id    UUID REFERENCES category(category_id)       ON DELETE RESTRICT,
    PRIMARY KEY (publication_id, category_id)
);

CREATE INDEX idx_pubtag_pub  ON publication_tag(publication_id);
CREATE INDEX idx_pubtag_cat  ON publication_tag(category_id);
CREATE INDEX idx_publication_type       ON publication(type_id);
CREATE INDEX idx_publication_style      ON publication(style_id);
CREATE INDEX idx_publication_author     ON publication(author_id);
CREATE INDEX idx_publication_published  ON publication(published);

-- ====================================================================
-- CONTENT
-- ====================================================================
CREATE TABLE content (
    content_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(255) NOT NULL,
    description     TEXT[],
    note            TEXT[],
    total_prep_time INT NOT NULL DEFAULT 0,
    servings        INT,
    category_id     UUID REFERENCES category(category_id) ON DELETE RESTRICT
);

-- ====================================================================
-- UNITS / MACROS / PRODUCTS / INGREDIENTS
-- ====================================================================
CREATE TABLE unit (
    unit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE macro (
    macro_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calories   SMALLINT CHECK (calories  >= 0),
    protein    SMALLINT CHECK (protein   >= 0),
    fiber      SMALLINT CHECK (fiber     >= 0),
    sugar      SMALLINT CHECK (sugar     >= 0),
    saturated  SMALLINT CHECK (saturated >= 0),
    trans      SMALLINT CHECK (trans     >= 0),
    caffein    SMALLINT CHECK (caffein   >= 0)
);

CREATE TABLE product (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    en_name    VARCHAR(255),
    macro_id   UUID REFERENCES macro(macro_id)       ON DELETE RESTRICT,
    category_id UUID REFERENCES category(category_id) ON DELETE RESTRICT
);
CREATE INDEX idx_product_category ON product(category_id);

CREATE TABLE ingredient (
    ingredient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity      SMALLINT CHECK (quantity >= 0),
    is_recipe_id  UUID REFERENCES publication(publication_id) ON DELETE RESTRICT,
    product_id    UUID REFERENCES product(product_id)          ON DELETE RESTRICT
);
CREATE INDEX idx_ingredient_product  ON ingredient(product_id);
CREATE INDEX idx_ingredient_is_recipe ON ingredient(is_recipe_id);

CREATE TABLE ingredient_unit (
    ingredient_id UUID REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
    unit_id       UUID REFERENCES unit(unit_id)             ON DELETE RESTRICT,
    PRIMARY KEY (ingredient_id, unit_id)
);
CREATE INDEX idx_ingunit_unit ON ingredient_unit(unit_id);

-- ====================================================================
-- PREP TIME / CONTENT PREP TIME
-- ====================================================================
CREATE TABLE prep_time (
    prep_time_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duration     SMALLINT NOT NULL CHECK (duration >= 0),
    category_id  UUID NOT NULL REFERENCES category(category_id) ON DELETE RESTRICT
);

CREATE TABLE content_prep_time (
    content_id   UUID REFERENCES content(content_id) ON DELETE CASCADE,
    prep_time_id UUID REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, prep_time_id)
);
CREATE INDEX idx_contpreptime_content ON content_prep_time(content_id);
CREATE INDEX idx_contpreptime_time    ON content_prep_time(prep_time_id);

-- ====================================================================
-- SEGMENT
-- ====================================================================
CREATE TABLE segment (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    paragraph  TEXT UNIQUE NOT NULL,
    "order"    SMALLINT NOT NULL CHECK ("order" >= 0)
);

-- ====================================================================
-- RESOURCE
-- ====================================================================
CREATE TABLE resource (
    resource_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id      UUID REFERENCES category(category_id) ON DELETE RESTRICT
);
CREATE INDEX idx_resource_url ON resource(url_id);

CREATE TABLE resource_content (
    resource_id UUID REFERENCES resource(resource_id) ON DELETE CASCADE,
    content_id  UUID REFERENCES content(content_id)   ON DELETE RESTRICT,
    PRIMARY KEY (resource_id, content_id)
);

CREATE TABLE resource_publication (
    resource_id    UUID REFERENCES resource(resource_id)    ON DELETE CASCADE,
    publication_id UUID REFERENCES publication(publication_id) ON DELETE RESTRICT,
    order_in_book  SMALLINT CHECK (order_in_book >= 0),
    PRIMARY KEY (resource_id, publication_id)
);
CREATE UNIQUE INDEX idx_respub_order ON resource_publication(resource_id, order_in_book);

ALTER TABLE publication
  ADD CONSTRAINT fk_publication_resource
  FOREIGN KEY (resource_id)
  REFERENCES resource(resource_id)
  ON DELETE RESTRICT
  DEFERRABLE INITIALLY DEFERRED;

-- ====================================================================
-- REVIEW
-- ====================================================================
CREATE TABLE review (
    review_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id     UUID REFERENCES product(product_id)       ON DELETE CASCADE,
    publication_id UUID REFERENCES publication(publication_id) ON DELETE CASCADE,
    rating         SMALLINT CHECK (rating BETWEEN 0 AND 10),
    comment        TEXT[],
    description    TEXT[],
    buy_again      CHAR(1) CHECK (buy_again IN ('T','F','M','N')),
    date_review    DATE DEFAULT CURRENT_DATE
);

-- ====================================================================
-- GUARD RAILS / TRIGGERS
-- ====================================================================

-- Helper: enforce Category.type
CREATE OR REPLACE FUNCTION ensure_category_type(cat_id UUID, expected_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF cat_id IS NULL THEN
        RETURN TRUE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM category c
         WHERE c.category_id = cat_id
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
    PERFORM ensure_category_type(NEW.type_id,   'Type');
    PERFORM ensure_category_type(NEW.style_id,  'Style');
    PERFORM ensure_category_type(NEW.author_id, 'Author');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_publication_enforce_category_types
BEFORE INSERT OR UPDATE ON publication
FOR EACH ROW
EXECUTE FUNCTION trg_publication_enforce_category_types();

-- Resource: url must be 'URL'
CREATE OR REPLACE FUNCTION trg_resource_enforce_url_type()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM ensure_category_type(NEW.url_id, 'URL');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_resource_enforce_url_type
BEFORE INSERT OR UPDATE ON resource
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
          FROM publication p
          JOIN category ct ON ct.category_id = p.type_id
         WHERE p.resource_id = NEW.resource_id
           AND ct.type = 'Type'
           AND ct.str_value = 'Book'
    ) INTO parent_is_book;

    IF NOT parent_is_book THEN
        RAISE EXCEPTION 'Resource % is not attached to a Book publication, cannot aggregate publications here.',
            NEW.resource_id;
    END IF;

    SELECT EXISTS (
        SELECT 1
          FROM publication p
          JOIN category ct ON ct.category_id = p.type_id
         WHERE p.publication_id = NEW.publication_id
           AND ct.type = 'Type'
           AND ct.str_value = 'Book'
    ) INTO child_is_book;

    IF child_is_book THEN
        RAISE EXCEPTION 'A Book cannot contain another Book (publication_id=%).', NEW.publication_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_respub_forbid_book_in_book
BEFORE INSERT OR UPDATE ON resource_publication
FOR EACH ROW
EXECUTE FUNCTION trg_forbid_book_in_book();

-- Function: recalcule le total_prep_time pour un content_id donné
CREATE OR REPLACE FUNCTION recalc_total_prep_time(content_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE content c
       SET total_prep_time = COALESCE((
           SELECT SUM(pt.duration)
             FROM content_prep_time cp
             JOIN prep_time pt ON pt.prep_time_id = cp.prep_time_id
            WHERE cp.content_id = content_id
       ), 0)
     WHERE c.content_id = content_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur content_prep_time (ajout / suppression / update)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_content_cp()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM recalc_total_prep_time(COALESCE(NEW.content_id, OLD.content_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_contpreptime_update
AFTER INSERT OR UPDATE OR DELETE ON content_prep_time
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_content_cp();

-- Trigger sur prep_time (modification de la durée)
CREATE OR REPLACE FUNCTION trg_update_total_prep_time_preptime()
RETURNS TRIGGER AS $$
DECLARE
    content_id UUID;
BEGIN
    FOR content_id IN
        SELECT cp.content_id
          FROM content_prep_time cp
         WHERE cp.prep_time_id = NEW.prep_time_id
    LOOP
        PERFORM recalc_total_prep_time(content_id);
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbu_preptime_update
AFTER UPDATE OF duration ON prep_time
FOR EACH ROW
EXECUTE FUNCTION trg_update_total_prep_time_preptime();

-- PublicationTag enforce type
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

-- ====================================================================
-- Minimal taxonomy seed
-- ====================================================================
INSERT INTO category (str_value, type) VALUES
    ('Book',   'Type'),
    ('Recipe', 'Type'),
    ('Article','Type'),
    ('https://example.com', 'URL'),
    ('/images/default.png', 'Image'),
    ('Unknown Author', 'Author'),
    ('Default Style', 'Style'),
    ('General', 'Tag');
