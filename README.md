# kitchen-cabinet

A dual-repo GitHub app (SolidStart backend, SolidJS + Tailwind4 frontend) for cataloguing your recipe books, personal recipes, blog posts, tea tastings—everything food-centric.

---

## 📱 Frontend

- **Home**: Browse services (search, meal-planner, tea, blog)  
- **Navbar**: Quicklinks + user-profile menu  
- Responsive: mobile & desktop views  

---

## 🔍 Browsing

- Public recipes with thumbnail  
- Shows: title · estimated total time · short description  

---

## 🥘 Recipe Viewing

- **Nested recipes** underlined; click to inline-expand or swap  
- Side-modal for ingredient actions (add, swap)  

### Mobile Header

- Thumbnail (left) · Title · Total time · Yield · Short description · Notes  

### Mobile Body

- Toggle [Ingredients | Steps]  
  - **Ingredients**  
    - Section titles (dressing, spice mix A…)  
      - List of ingredients  
  - **Steps**  
    - Section titles  
      - Step list  

### Desktop Header

1. **Data row** (flex two-column):  
   - thumbnail | (title · total time · yield · short desc)  
2. **Notes row**  

### Desktop Body

- Flex two-column:  
  - Ingredients by section  
  - Steps by section  

---

## 🛠️ Backend Services

1. **Ingredient Metadata Service**  
   - On new ingredient → USDA/OpenFoodFacts lookup → store  
     - `calories_per_100g` · `density_g_per_unit`  
2. **Unit Conversion Service**  
   - Convert any unit (cup, tbsp…) → grams via density table  
3. **Calorie Estimator Service**  
   - grams × calories/100g → total & per-portion  
4. **Weather-Aware Planner**  
   - 7-day forecast → bias recipe types (on cold: more hearthy, less limitations, inside cooking bellow 10C; on hot: quicker, not a  lot of cooking time, outside cooking, salads)
5. **User Constraints Engine**  
   - Daily tags (vegetarian, red-meat), max prep time, exclusions  
6. **Tag Scoring Service**  
   - Track views/likes/skips → score tags → bias recommendations  
7. **Fridge Inventory Service**  
   - Track ingredient stock (qty, unit, expiry) → match/substitute → shopping list  
8. **Seasonal Ingredient Service**  
   - Map ingredient → in-season by date/location → boost seasonal recipes  
9. **Menu Customizer**  
   - Add sides (with prep-time constraints), swap days, lock favorites  
10. **Blog Module**  
    - Posts (techniques, manipulations) with tags, markdown support  
11. **Tea Catalog Service**  
    - Teas: `name` · `origin` · `type` · two admin ratings · tasting notes · media  

---

## 🔗 High-Level Flow

```mermaid
graph TD
  A[User Action] --> B(Ingredient Metadata)
  B --> C(Unit Conversion)
  C --> D(Calorie Estimator)

  A --> E[Weekly Plan Request]
  E --> F(Weather Planner)
  A --> G(Constraints Engine)
  H(Tag Scoring) --> I(Menu Planner)
  J(Inventory) --> I
  K(Seasonal) --> I
  F --> I
  G --> I
  I --> A

  A --> L(Blog Module)
  A --> M(Tea Catalog)
```

## 🗄️ Database ERD
```mermaid
erDiagram
  RECIPES ||--o{ INGREDIENT_SECTIONS : contains
  RECIPES ||--o{ STEP_SECTIONS       : has
  RECIPES ||--o{ RECIPE_TAGS         : tagged
  RECIPES ||--o{ RECIPE_INGREDIENTS  : includes
  RECIPES ||--o{ RECIPE_STEPS        : describes
  RECIPES }o--|| RECIPE_TIMES        : uses
  RECIPES }o--|| MEDIA               : thumbnail

  INGREDIENT_SECTIONS ||--o{ RECIPE_INGREDIENTS : groups
  STEP_SECTIONS       ||--o{ RECIPE_STEPS       : groups

  RECIPE_INGREDIENTS }o--|| INGREDIENTS   : references
  RECIPE_INGREDIENTS }o--|| RECIPES       : nested_recipe
  RECIPE_STEPS       }o--|| RECIPES       : substep_recipe

  RECIPE_TAGS        }o--|| TAGS          : categorizes

  TAG_SCORING        }o--|| TAGS          : scores
  FRIDGE_INVENTORY   }o--|| INGREDIENTS   : stocks
  SEASONAL           }o--|| INGREDIENTS   : seasons

  BLOG_POSTS        }o--|| TAGS          : tagged
  TEAS              ||--o{ TEA_RATINGS   : rated
  SIDE_DISHES       }o--|| RECIPES       : complements

  RECIPES {
    UUID    id
    TEXT    title
    BOOL    published
    VARCHAR short_desc
    TEXT    description
    TEXT    notes
    UUID    estimated_time_FK
    UUID    thumbnail_id_FK
    VARCHAR yield
  }

  INGREDIENTS {
    UUID     id
    VARCHAR  name
    SMALLINT calories_per_100g
  }

  INGREDIENT_SECTIONS {
    UUID     id
    UUID     recipe_id_FK
    VARCHAR  title
    SMALLINT order
  }

  RECIPE_INGREDIENTS {
    UUID    id
    UUID    recipe_id_FK
    UUID    section_id_FK
    UUID    ingredient_id_FK
    UUID    linked_recipe_FK
    VARCHAR amount
    VARCHAR unit
    BOOL    optional
  }

  STEP_SECTIONS {
    UUID     id
    UUID     recipe_id_FK
    VARCHAR  title
    SMALLINT order
  }

  RECIPE_STEPS {
    UUID    id
    UUID    recipe_id_FK
    UUID    section_id_FK
    SMALLINT order
    TEXT    description
    UUID    linked_recipe_FK
  }

  RECIPE_TIMES {
    UUID     id
    SMALLINT prep
    SMALLINT marinate
    SMALLINT ferment
    SMALLINT smoke
    SMALLINT cook
    SMALLINT rest
  }

  MEDIA {
    UUID    id
    TEXT    url
    VARCHAR alt_text
  }

  TAGS {
    UUID    id
    VARCHAR tag
  }

  RECIPE_TAGS {
    UUID    id
    UUID    recipe_id_FK
    UUID    tag_id_FK
  }

  TAG_SCORING {
    UUID     id
    UUID     user_id_FK
    UUID     tag_id_FK
    INT      score
    DATETIME updated_at
  }

  FRIDGE_INVENTORY {
    UUID     id
    UUID     ingredient_id_FK
    DECIMAL  quantity
    VARCHAR  unit
    DATE     expiry_date
  }

  SEASONAL {
    UUID    id
    UUID    ingredient_id_FK
    VARCHAR season
    VARCHAR location
  }

  BLOG_POSTS {
    UUID     id
    TEXT     title
    TEXT     content
    DATETIME published_at
  }

  TEAS {
    UUID    id
    VARCHAR name
    VARCHAR origin
    VARCHAR type
    TEXT    notes
  }

  TEA_RATINGS {
    UUID    id
    UUID    tea_id_FK
    UUID    admin_id_FK
    INT     rating
    TEXT    comment
  }

  SIDE_DISHES {
    UUID     id
    UUID     recipe_id_FK
    SMALLINT prep_time_min
  }
```

📝 Forms & API Interfaces
1. Authentication

Tables: users, sessions
Forms & Endpoints:

    Register: POST /auth/register (email, password, name)

    Login: POST /auth/login (email, password)

    Password Reset:

        Request: POST /auth/reset/request (email)

        Confirm: POST /auth/reset/confirm (token, new_password)

    Profile:

        GET /auth/me

        PUT /auth/me (name, email, password change)

2. Recipes

    Create/Edit Recipe: POST /recipes, PUT /recipes/:id

    Sections:

        Ingredients: POST /recipes/:id/sections

        Steps: POST /recipes/:id/step-sections

    Items:

        Ingredients: POST /recipes/:id/ingredients, PUT /ingredients/:id

        Steps: POST /recipes/:id/steps

    Tags: POST /recipes/:id/tags

    Calories: GET /recipes/:id/calories?portions=…

3. Ingredient Metadata & Conversion

    Create Ingredient: POST /ingredients

    Enrich Metadata: POST /ingredients/:id/enrich

    Convert to Grams: POST /convert/grams

4. Meal Planner

    Preferences: POST /planner/preferences (location, date-range, daily constraints, time limits)

    Customize: POST /planner/customize (swap, lock, add sides)

    Discard: DELETE /planner/:date/recipe/:id

5. Blog

    List & View: GET /blog, GET /blog/:id

    Create/Edit: POST /blog, PUT /blog/:id

6. Tea

    List & View: GET /teas, GET /teas/:id

    Create/Edit: POST /teas, PUT /teas/:id

    Rate: POST /teas/:id/ratings

7. Inventory

    List: GET /inventory

    Add/Edit: POST /inventory, PUT /inventory/:id

8. Seasonal & Tag Scoring

    Seasonal: POST /seasonal, PUT /seasonal/:id, GET /seasonal

    Tag Scoring:

        View: GET /tags/scores?user=:id

        Adjust: POST /tags/scores

9. User's recipes, GET, PUT, POST, DELETE, PRINT, etc.

10. ... More to come
---

### Authentication & User Management

**Database**  
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user',  -- e.g. user, admin
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL
);
```


## ⚙️ Config & Docker
```mermaid
# .env
POSTGRES_PASSWORD=[REDACTED]
DOMAIN=jmongeau.com
DATABASE_URL_RECIPES=postgresql://dratharias:${POSTGRES_PASSWORD}@10.21.70.10:5432/recipes

# kitchen-cabinet
RECIPES_DOMAIN=https://recettes.jmongeau.com
RECIPES_API=https://api-recettes.jmongeau.com
RECIPES_PORT=3000
RECIPES_API_PORT=8004
```

```shell
dratharias@silkspire:~/docker$ cat compose/kitchen-cabinet.yaml 
services:
  kitchen-cabinet:
    build:
      context: ../apps/web/kitchen-cabinet
      dockerfile: Dockerfile
    container_name: kitchen-cabinet
    restart: unless-stopped
    ports:
      - "${RECIPES_PORT}:${RECIPES_PORT}"
    environment:
      - RECIPES_DOMAIN=${RECIPES_DOMAIN}
      - RECIPES_PORT=${RECIPES_PORT}
      - IMAGE_REPOSITORY=mnt/raid1/docker/kitchen-cabinet/images
      - VIDEO_REPOSITORY=mnt/raid1/docker/kitchen-cabinet/videos
    networks:
      - frontend
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${RECIPES_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  kitchen-cabinet-api:
    build:
      context: ../
      dockerfile: apps/services/kitchen-cabinet-api/Dockerfile
    container_name: kitchen-cabinet-api
    restart: unless-stopped
    ports:
      - "${RECIPES_API_PORT}:${RECIPES_API_PORT}"
    environment:
      - RECIPES_DOMAIN=${RECIPES_DOMAIN}
      - RECIPES_API_PORT=${RECIPES_API_PORT}
      - DATABASE_URL_RECIPES=${DATABASE_URL_RECIPES}
      - IMAGE_REPOSITORY=mnt/raid1/docker/kitchen-cabinet/images
      - VIDEO_REPOSITORY=mnt/raid1/docker/kitchen-cabinet/videos
    networks:
      - backend
    depends_on:
      - postgres
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${RECIPES_API_PORT}/health"]
      interval: 30s
      timeout: 10s
      retries: 3


  cloudflare-ddns-recipes:
    image: oznu/cloudflare-ddns:latest
    container_name: cloudflare-ddns-recipes
    env_file:
      - ../secrets/cloudflare.env
    environment:
      - PUID=1000
      - PGID=1000
      - SUBDOMAIN=recettes
      - RRTYPE=A
      - DELETE_ON_STOP=false
    restart: always
    networks:
      - internal
```