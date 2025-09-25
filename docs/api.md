# API Routes Documentation

This document outlines the API endpoints for the **kitchen-cabinet** application. The API is divided into public, protected, and orchestrator routes.

---

## 1. Authentication

All protected routes require a Bearer token.

### `POST /api/auth/login`

Authenticate a user.

**Payload:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "username": "string",
  "role": "admin" | "user" | "guest",
  "token": "string"
}
```

**Error Codes:**

- 400: Missing credentials
- 401: Invalid username or password
- 429: Too many attempts
- 500: Internal server error

---

## 2. Public Routes

Accessible without authentication.

### `GET /api/publications`

Retrieve a paginated list of public publications.

**Query Parameters:**

```
?page=number
&limit=number
&sortBy=string
&order=asc|desc
&filter=object
```

**Response:**

```json
{
  "items": [
    {
      "publication_id": "string",
      "title": "string",
      "description": ["string"],
      "reviewCount": number,
      "reviewAverageScore": number,
      "type": {
        "str_value": "string",
        "type": "string"
      }
    }
  ],
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}
```

### `GET /api/publications/:id`

Retrieve a single public publication by ID.

**Response:**

```json
{
  "publication_id": "string",
  "title": "string",
  "description": ["string"],
  "note": ["string"],
  "contents": [
    {
      "content_id": "string",
      "servings": number,
      "total_prep_time": number,
      "content_segments": "ContentSegment[]",
      "content_ingredients": "ContentIngredient[]",
      "content_prep_times": "ContentPrepTime[]"
    }
  ],
  "tags": "Category[]",
  "type": "Category",
  "style": "Category",
  "author": "Category"
}
```

### `GET /api/reviews`

Retrieve a paginated list of all reviews. Includes product and publication references.

**Query Parameters:**

```
?page=number
&limit=number
&sortBy=string
&order=asc|desc
&filter=object
```

**Response:**

```json
{
  "items": [
    {
      "review_id": "string",
      "product_id": "string | null",
      "publication_id": "string | null",
      "rating": "number | null",
      "comment": ["string"],
      "description": ["string"],
      "buy_again": "string | null",
      "date_review": "string",
      "product": "Product | null",
      "publication": "Publication | null"
    }
  ],
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}
```

### `GET /api/reviews/:id`

Retrieve a single review by ID with product and publication details.

**Response:**

```json
{
  "review_id": "string",
  "product_id": "string | null",
  "publication_id": "string | null",
  "rating": "number | null",
  "comment": ["string"],
  "description": ["string"],
  "buy_again": "string | null",
  "date_review": "string",
  "product": "Product | null",
  "publication": "Publication | null"
}
```

---

## 3. Protected CRUD Routes

Require a Bearer token.

### `POST /api/private/publications`

Create a new publication.

**Payload:**

```json
{
  "title": "string",
  "description": ["string"],
  "note": ["string"],
  "public": boolean,
  "published": boolean,
  "thumbnail": "string | null"
}
```

### `GET /api/private/publications/:id`

Retrieve a publication by ID (admin/owner only).

### `PUT /api/private/publications/:id`

Update a publication. Only provided fields will be updated.

**Payload:**

```json
{
  "title": "string",
  "note": ["string"]
}
```

### `DELETE /api/private/publications/:id`

Delete a publication by ID.

---

## 4. Orchestrator Route

Single endpoint for nested creation with upsert.

### `POST /api/publicate`

#### Exhaustive Publication Creation Example

```json
{
  "action": "create",
  "payload": {
    "1": {
      "title": "Exhaustive Recipe Example",
      "description": [
        "A complete example showing all nested relationships in a single request."
      ],
      "note": ["This is for testing all the nested joins."],
      "public": true,
      "published": true,
      "type": { "data": { "str_value": "Recipe", "type": "Type" } },
      "style": { "data": { "str_value": "Cocktail", "type": "Style" } },
      "author": { "data": { "str_value": "Jane Doe", "type": "Author" } },
      "contents": [
        {
          "data": { "total_prep_time": 10, "servings": 4 },
          "content_segments": [
            {
              "position": 1,
              "segment": {
                "data": {
                  "paragraph": "This is a segment with a prep time.",
                  "title": "Prep Segment"
                },
                "segment_prep_time": [
                  {
                    "prep_time": {
                      "data": { "duration": 5 },
                      "style": {
                        "data": { "str_value": "Prep", "type": "PrepTimeStyle" }
                      }
                    }
                  }
                ]
              }
            }
          ],
          "content_ingredients": [
            {
              "data": { "quantity": 1, "multiply_factor": 1.0 },
              "product": {
                "data": {
                  "name": "Super Product",
                  "en_name": "Super Product",
                  "publication": {
                    "id": "existing-publication-id",
                    "data": {}
                  }
                }
              },
              "ingredient_units": [{ "unit": { "data": { "name": "grams" } } }]
            }
          ],
          "content_prep_times": [{ "prep_time": { "data": { "duration": 5 } } }]
        }
      ],
      "tags": [
        { "data": { "str_value": "Fast", "type": "Tag" } },
        { "data": { "str_value": "Easy", "type": "Tag" } }
      ]
    }
  }
}
```

#### Review Creation Examples

Reviews must link to either a **publication** or a **product**, not both.

**1. Review a Publication:**

```json
{
  "action": "create",
  "payload": {
    "1": {
      "rating": 5,
      "comment": ["This recipe was fantastic!"],
      "description": ["Easy to follow and delicious."],
      "buy_again": "Y",
      "publication": {
        "id": "existing-publication-id",
        "data": {}
      }
    }
  }
}
```

**2. Review a Product:**

```json
{
  "action": "create",
  "payload": {
    "1": {
      "rating": 4,
      "comment": ["The product was great for baking."],
      "description": ["High quality and worth the price."],
      "buy_again": "Y",
      "product": {
        "id": "existing-product-id",
        "data": {}
      }
    }
  }
}
```

---

## 5. Data Models

### Publication

```json
{
  "publication_id": "string",
  "title": "string",
  "description": ["string"],
  "note": ["string"],
  "public": boolean,
  "published": boolean,
  "thumbnail": "string | null",
  "type_id": "string | null",
  "style_id": "string | null",
  "author_id": "string | null",
  "type": "Category | null",
  "style": "Category | null",
  "author": "Category | null",
  "contents": "Content[] | null",
  "publication_tags": "PublicationTag[] | null"
}
```

### Content

```json
{
  "content_id": "string",
  "publication_id": "string",
  "total_prep_time": "number | null",
  "servings": "number | null",
  "contents": "Publication | null",
  "content_segments": "ContentSegment[] | null",
  "content_ingredients": "ContentIngredient[] | null",
  "content_prep_times": "ContentPrepTime[] | null"
}
```

### Ingredient

```json
{
  "ingredient_id": "string",
  "product_id": "string",
  "quantity": "number | null",
  "multiply_factor": number,
  "product": "Product | null",
  "content_ingredients": "ContentIngredient[] | null",
  "ingredient_units": "IngredientUnit[] | null"
}
```

### Product

```json
{
  "product_id": "string",
  "name": "string",
  "en_name": "string | null",
  "macro_id": "string | null",
  "macro": "Macro | null",
  "publication": "Publication | null",
  "reviews": "Review[] | null",
  "product_categories": "ProductCategory[] | null"
}
```

### Macro

```json
{
  "macro_id": "string",
  "calories": "number | null",
  "protein": "number | null",
  "fiber": "number | null",
  "sugar": "number | null",
  "saturated": "number | null",
  "trans": "number | null",
  "caffein": "number | null",
  "products": "Product[] | null"
}
```

### Unit

```json
{
  "unit_id": "string",
  "name": "string",
  "ingredient_units": "IngredientUnit[] | null"
}
```

### PrepTime

```json
{
  "prep_time_id": "string",
  "duration": number,
  "style_id": "string | null",
  "style": "Category | null",
  "content_prep_times": "ContentPrepTime[] | null",
  "segment_prep_time": "SegmentPrepTime[] | null"
}
```

### Review

```json
{
  "review_id": "string",
  "product_id": "string | null",
  "publication_id": "string | null",
  "rating": "number | null",
  "comment": ["string"],
  "description": ["string"],
  "buy_again": "string | null",
  "date_review": "string",
  "product": "Product | null",
  "publication": "Publication | null"
}
```

### Segment

```json
{
  "segment_id": "string",
  "title": "string | null",
  "paragraph": "string | null",
  "content_segments": "ContentSegment[] | null",
  "segment_prep_time": "SegmentPrepTime[] | null"
}
```

### Category

```json
{
  "category_id": "string",
  "str_value": "string",
  "type": "string",
  "publications_type": "Publication[] | null",
  "publications_style": "Publication[] | null",
  "publications_author": "Publication[] | null",
  "prep_time": "PrepTime[] | null",
  "publication_tags": "PublicationTag[] | null",
  "product_categories": "ProductCategory[] | null"
}
```

### AppUser

```json
{
  "user_id": "string",
  "username": "string",
  "password": "string",
  "role": "string",
  "updated": "string",
  "created": "string"
}
```

---

## Jointure Tables

### PublicationTag

```json
{
  "publication_id": "string",
  "category_id": "string",
  "publication": "Publication | null",
  "category": "Category | null"
}
```

### ContentIngredient

```json
{
  "content_id": "string",
  "ingredient_id": "string",
  "content": "Content | null",
  "ingredient": "Ingredient | null"
}
```

### ContentSegment

```json
{
  "content_id": "string",
  "segment_id": "string",
  "position": "number | null",
  "content": "Content | null",
  "segment": "Segment | null"
}
```

### ContentPrepTime

```json
{
  "content_id": "string",
  "prep_time_id": "string",
  "content": "Content | null",
  "prep_time": "PrepTime | null"
}
```

### IngredientUnit

```json
{
  "ingredient_id": "string",
  "unit_id": "string",
  "ingredient": "Ingredient | null",
  "unit": "Unit | null"
}
```

### ProductCategory

```json
{
  "product_id": "string",
  "category_id": "string",
  "product": "Product | null",
  "category": "Category | null"
}
```

### SegmentPrepTime

```json
{
  "segment_id": "string",
  "prep_time_id": "string",
  "segment": "Segment | null",
  "prep_time": "PrepTime | null"
}
```
