-- ====================================================================
-- [02] Kitchen Cabinet Schema Core
-- ====================================================================

-- Cleanup (drop in dependency-safe order)
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

-- ====================================================================
-- Publications
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
  gallery        VARCHAR(255)[],
  date_created   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (type_id)   REFERENCES category(category_id) ON DELETE SET NULL,
  FOREIGN KEY (style_id)  REFERENCES category(category_id) ON DELETE SET NULL,
  FOREIGN KEY (author_id) REFERENCES category(category_id) ON DELETE SET NULL
);

CREATE INDEX idx_publication_type_id ON publication(type_id);
CREATE INDEX idx_publication_style_id ON publication(style_id);
CREATE INDEX idx_publication_author_id ON publication(author_id);
CREATE INDEX idx_publication_published ON publication(published);

-- ====================================================================
-- Content & Segments
-- ====================================================================
CREATE TABLE content (
  content_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  publication_id UUID NOT NULL,
  total_prep_time SMALLINT DEFAULT 0,
  servings       SMALLINT,
  subtitle       TEXT,
  is_ingredient  BOOLEAN,
  FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE
);

CREATE INDEX idx_content_publication_id ON content(publication_id);

CREATE TABLE segment (
  segment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title      TEXT,
  paragraph  TEXT UNIQUE NOT NULL
);

-- ====================================================================
-- Units & Macros
-- ====================================================================
CREATE TABLE unit (
  unit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name    VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE macro (
  macro_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calories   SMALLINT,
  protein    SMALLINT,
  fiber      SMALLINT,
  sugar      SMALLINT,
  saturated  SMALLINT,
  trans      SMALLINT,
  caffein    SMALLINT
);

-- ====================================================================
-- Products & Ingredients
-- ====================================================================
CREATE TABLE product (
  product_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR(255) UNIQUE NOT NULL,
  en_name     VARCHAR(255),
  is_recipe_id UUID,
  macro_id    UUID,
  FOREIGN KEY (macro_id) REFERENCES macro(macro_id) ON DELETE SET NULL,
  FOREIGN KEY (is_recipe_id) REFERENCES publication(publication_id) ON DELETE SET NULL
);

CREATE TABLE ingredient (
  ingredient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quantity      DECIMAL(10,2),
  product_id    UUID NOT NULL,
  title         TEXT,
  cut           TEXT,
  multiply_factor DECIMAL(10,2) DEFAULT 1.00,
  FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
);

-- ====================================================================
-- Prep Time
-- ====================================================================
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
  PRIMARY KEY (content_id, segment_id),
  FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
  FOREIGN KEY (segment_id) REFERENCES segment(segment_id) ON DELETE CASCADE
);

CREATE TABLE content_ingredient (
  content_id    UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  PRIMARY KEY (content_id, ingredient_id),
  FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE
);

CREATE TABLE content_prep_time (
  content_id   UUID NOT NULL,
  prep_time_id UUID NOT NULL,
  PRIMARY KEY (content_id, prep_time_id),
  FOREIGN KEY (content_id) REFERENCES content(content_id) ON DELETE CASCADE,
  FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE
);

CREATE TABLE segment_prep_time (
  segment_id   UUID NOT NULL,
  prep_time_id UUID NOT NULL,
  PRIMARY KEY (segment_id, prep_time_id),
  FOREIGN KEY (segment_id) REFERENCES segment(segment_id) ON DELETE CASCADE,
  FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE
);

CREATE TABLE ingredient_unit (
  ingredient_id UUID NOT NULL,
  unit_id       UUID NOT NULL,
  PRIMARY KEY (ingredient_id, unit_id),
  FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES unit(unit_id) ON DELETE CASCADE
);

CREATE INDEX idx_ingredient_unit_unit_id ON ingredient_unit(unit_id);

CREATE TABLE publication_tag (
  publication_id UUID NOT NULL,
  category_id    UUID NOT NULL,
  PRIMARY KEY (publication_id, category_id),
  FOREIGN KEY (publication_id) REFERENCES publication(publication_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

CREATE TABLE product_category (
  product_id  UUID NOT NULL,
  category_id UUID NOT NULL,
  PRIMARY KEY (product_id, category_id),
  FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
);

CREATE TABLE prep_time_category (
  prep_time_id UUID NOT NULL,
  category_id  UUID NOT NULL,
  PRIMARY KEY (prep_time_id, category_id),
  FOREIGN KEY (prep_time_id) REFERENCES prep_time(prep_time_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE CASCADE
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
  CHECK (
    (product_id IS NOT NULL AND publication_id IS NULL)
    OR (product_id IS NULL AND publication_id IS NOT NULL)
  )
);
