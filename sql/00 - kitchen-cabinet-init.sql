-- ====================================================================
-- Bootstrap
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- Cleanup
-- ====================================================================
DROP TABLE IF EXISTS
    review,
    prep_time_category,
    product_category,
    ingredient_unit,
    ingredient,
    product,
    macro,
    unit,
    segment_prep_time,
    content_segment,
    content_ingredient,
    content_prep_time,
    segment,
    content,
    prep_time,
    publication_tag,
    publication,
    category,
    app_user
CASCADE;

-- ====================================================================
-- Users
-- ====================================================================
CREATE TABLE app_user (
    user_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role     VARCHAR(20) NOT NULL DEFAULT 'user',
    created  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- Category
-- ====================================================================
CREATE TABLE category (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    str_value   VARCHAR(255) NOT NULL,
    type        VARCHAR(50) NOT NULL,
    UNIQUE (str_value, type)
);

CREATE INDEX idx_category_type ON category(type);
CREATE INDEX idx_category_str_value ON category(str_value);
CREATE INDEX idx_category_str_and_type ON category(str_value, type);

-- Utility function
CREATE OR REPLACE FUNCTION ensure_category_type(name text, type_name text)
RETURNS void AS $$
BEGIN
    INSERT INTO category(str_value, type)
    VALUES (name, type_name)
    ON CONFLICT (str_value, type) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- Publications Table
-- ====================================================================
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

CREATE INDEX idx_publication_type_id ON publication(type_id);
CREATE INDEX idx_publication_style_id ON publication(style_id);
CREATE INDEX idx_publication_author_id ON publication(author_id);
CREATE INDEX idx_publication_published ON publication(published);

-- ====================================================================
-- Content, Segments, Units, Macro, Products, Ingredients
-- ====================================================================
CREATE TABLE content (
    content_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    publication_id UUID NOT NULL,
    total_prep_time SMALLINT DEFAULT 0,
    servings       SMALLINT,
    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE
);

CREATE INDEX idx_content_publication_id ON content(publication_id);

CREATE TABLE segment (
    segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title      TEXT,
    paragraph  TEXT UNIQUE NOT NULL
);

CREATE TABLE unit (
    unit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE macro (
    macro_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calories   SMALLINT CHECK (calories BETWEEN 0 AND 2000),
    protein    SMALLINT CHECK (protein BETWEEN 0 AND 2000),
    fiber      SMALLINT CHECK (fiber BETWEEN 0 AND 2000),
    sugar      SMALLINT CHECK (sugar BETWEEN 0 AND 2000),
    saturated  SMALLINT CHECK (saturated BETWEEN 0 AND 2000),
    trans      SMALLINT CHECK (trans BETWEEN 0 AND 2000),
    caffein    SMALLINT CHECK (caffein BETWEEN 0 AND 2000)
);

CREATE TABLE product (
    product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL UNIQUE,
    en_name    VARCHAR(255),
    is_recipe_id  UUID,
    macro_id   UUID,
    FOREIGN KEY (macro_id) REFERENCES macro(macro_id) ON DELETE SET NULL,
    FOREIGN KEY (is_recipe_id) REFERENCES publication(publication_id) ON DELETE SET NULL
);

CREATE TABLE ingredient (
    ingredient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quantity      SMALLINT,
    product_id    UUID NOT NULL,
    multiply_factor DECIMAL(10,2) DEFAULT 1.00,
    FOREIGN KEY (product_id)   REFERENCES product(product_id) ON DELETE CASCADE,
);

CREATE TABLE prep_time (
    prep_time_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    duration     SMALLINT NOT NULL CHECK (duration >= 0),
    category_id  UUID NOT NULL,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

-- ====================================================================
-- Junction Tables
-- ====================================================================
CREATE TABLE content_segment (
    content_id UUID NOT NULL,
    segment_id UUID NOT NULL,
    position   SMALLINT CHECK (position >= 0),
    FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, segment_id)
);

CREATE TABLE content_ingredient (
    content_id    UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, ingredient_id)
);

CREATE TABLE content_prep_time (
    content_id   UUID NOT NULL,
    prep_time_id UUID NOT NULL,
    FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
    FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, prep_time_id)
);

CREATE TABLE segment_prep_time (
    segment_id   UUID NOT NULL,
    prep_time_id UUID NOT NULL,
    FOREIGN KEY (segment_id) REFERENCES segment(segment_id) ON DELETE CASCADE,
    FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
    PRIMARY KEY (segment_id, prep_time_id)
);

CREATE TABLE ingredient_unit (
    ingredient_id UUID NOT NULL,
    unit_id       UUID NOT NULL,
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES unit(unit_id) ON DELETE CASCADE,
    PRIMARY KEY (ingredient_id, unit_id)
);

CREATE INDEX idx_ingredient_unit_unit_id ON ingredient_unit(unit_id);

CREATE TABLE publication_tag (
    publication_id UUID NOT NULL,
    category_id    UUID NOT NULL,
    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (publication_id, category_id)
);

CREATE TABLE product_category (
    product_id  UUID NOT NULL,
    category_id UUID NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

CREATE TABLE prep_time_category (
    prep_time_id UUID NOT NULL,
    category_id  UUID NOT NULL,
    FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE,
    PRIMARY KEY (prep_time_id, category_id)
);

CREATE TABLE review (
    review_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id     UUID,
    publication_id UUID,
    rating         SMALLINT CHECK (rating BETWEEN 1 AND 10),
    comment        TEXT[],
    description    TEXT[],
    buy_again      CHAR(1) CHECK (buy_again IN ('Y', 'N', 'M', 'I')),
    date_review    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
    CHECK ((product_id IS NOT NULL AND publication_id IS NULL) OR
           (product_id IS NULL AND publication_id IS NOT NULL))
);

-- ====================================================================
-- Lightweight Triggers (keep only safety checks)
-- ====================================================================

-- Enforce category type for publication
CREATE OR REPLACE FUNCTION trg_pub_enforce_type()
RETURNS TRIGGER AS $$
DECLARE
    v_type TEXT;
BEGIN
    IF NEW.type_id IS NOT NULL THEN
        SELECT type INTO v_type FROM category WHERE category_id = NEW.type_id;
        IF v_type != 'Type' THEN RAISE EXCEPTION 'type_id % is not Type', NEW.type_id; END IF;
    END IF;
    IF NEW.style_id IS NOT NULL THEN
        SELECT type INTO v_type FROM category WHERE category_id = NEW.style_id;
        IF v_type != 'Style' THEN RAISE EXCEPTION 'style_id % is not Style', NEW.style_id; END IF;
    END IF;
    IF NEW.author_id IS NOT NULL THEN
        SELECT type INTO v_type FROM category WHERE category_id = NEW.author_id;
        IF v_type != 'Author' THEN RAISE EXCEPTION 'author_id % is not Author', NEW.author_id; END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbiu_pub_enforce_type
BEFORE INSERT OR UPDATE ON publication
FOR EACH ROW EXECUTE FUNCTION trg_pub_enforce_type();

-- Enforce minimum content count
CREATE OR REPLACE FUNCTION trg_content_enforce_min_count()
RETURNS TRIGGER AS $$
DECLARE v_content_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        SELECT COUNT(*) INTO v_content_count
        FROM content WHERE publication_id = OLD.publication_id;
        IF v_content_count <= 1 THEN
            RAISE EXCEPTION 'Cannot delete content: publication must have at least 1 content';
        END IF;
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tbd_content_enforce_min_count
BEFORE DELETE ON content
FOR EACH ROW EXECUTE FUNCTION trg_content_enforce_min_count();

-- ====================================================================
-- Minimal Taxonomy Seed
-- ====================================================================
INSERT INTO category (str_value, type) VALUES
    ('Book', 'Type'), ('Recipe', 'Type'), ('Article','Type'), ('Review','Type'), ('FoodPost','Type'), ('Cookbook','Type');
