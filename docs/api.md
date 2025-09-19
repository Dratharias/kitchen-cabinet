# API Routes Documentation

## Authentication

### POST /api/auth/login

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

**Error Responses:**
- `400`: Missing credentials
- `401`: Invalid username or password
- `429`: Too many attempts, get lost!
- `500`: Internal server error

---

## Reviews (Public)

### GET /api/reviews

**Query Parameters:**
```
?page=number&limit=number&sortBy=string&order=asc|desc&filter=object
```

**Response:**
```json
[
  {
    "review_id": "string",
    "product_id": "string | null",
    "publication_id": "string | null", 
    "rating": "number | null",
    "comment": "string[]",
    "description": "string[]",
    "buy_again": "Y" | "N" | "M" | "D" | null,
    "date_review": "string",
    "product": "ProductData | null",
    "publication": "PublicationData | null"
  }
]
```

### GET /api/reviews/:id

**Response:**
```json
{
  "review_id": "string",
  "product_id": "string | null",
  "publication_id": "string | null",
  "rating": "number | null", 
  "comment": "string[]",
  "description": "string[]",
  "buy_again": "Y" | "N" | "M" | "D" | null,
  "date_review": "string",
  "product": "ProductData | null",
  "publication": "PublicationData | null"
}
```

**Error Response:**
- `404`: Not found

---

## Publications (Public)

### GET /api/publications

**Query Parameters:**
```
?page=number&limit=number&sortBy=string&order=asc|desc&filter=object
```

**Response:**
```json
{
  "items": [
    {
      "publication_id": "string",
      "title": "string",
      "description": "string[]",
      "note": "string[]",
      "public": "boolean",
      "published": "boolean",
      "thumbnail": "string | null",
      "type_id": "string | null",
      "style_id": "string | null",
      "author_id": "string | null",
      "type": "CategoryCore | null",
      "style": "CategoryCore | null", 
      "author": "CategoryCore | null",
      "contents": "ContentData[] | null",
      "ingredientsRef": "IngredientData[] | null",
      "reviews": "ReviewData[] | null",
      "tags": "PublicationTagData[] | null"
    }
  ],
  "total": "number",
  "page": "number",
  "limit": "number",
  "totalPages": "number"
}
```

### GET /api/publications/:id

**Response:**
```json
{
  "publication_id": "string",
  "title": "string", 
  "description": "string[]",
  "note": "string[]",
  "public": "boolean",
  "published": "boolean",
  "thumbnail": "string | null",
  "type_id": "string | null",
  "style_id": "string | null",
  "author_id": "string | null",
  "type": "CategoryCore | null",
  "style": "CategoryCore | null",
  "author": "CategoryCore | null", 
  "contents": "ContentData[] | null",
  "ingredientsRef": "IngredientData[] | null",
  "reviews": "ReviewData[] | null",
  "tags": "PublicationTagData[] | null"
}
```

**Error Response:**
- `404`: Not found

---

## Orchestrator (Protected)

### POST /api/publicate

**Authentication Required:** Bearer token

**Payload Examples:**

#### Create Publication with Related Entities
```json
{
  "action": "create",
  "publications": {
    "id?": "temp-publication-1",
    "data": {
      "title": "string",
      "description": ["string"],
      "note": ["string"], 
      "public": "boolean",
      "published": "boolean",
      "thumbnail": "string | null",
      "type_id": "string | null",
      "style_id": "string | null",
      "author_id": "string | null"
    }
  },
  "contents": [
    {
      "id?": "temp-content-1",
      "data": {
        "publication_id": "string",
        "total_prep_time": "number",
        "servings": "number | null"
      }
    }
  ],
  "segments": [
    {
      "id?": "temp-segment-1", 
      "data": {
        "title": "string | null",
        "paragraph": "string",
        "order_num": "number | null"
      }
    }
  ],
  "ingredients": [
    {
      "id?": "temp-ingredient-1",
      "data": {
        "quantity": "number | null",
        "is_recipe_id": "string | null",
        "product_id": "string",
        "multiply_factor": "number"
      }
    }
  ],
  "products": [
    {
      "id?": "temp-product-1",
      "data": {
        "name": "string",
        "en_name": "string | null",
        "macro_id": "string | null"
      }
    }
  ],
  "categories": [
    {
      "id?": "temp-categorie-1",
      "data": {
        "str_value": "string",
        "type": "string"
      }
    }
  ],
  "units": [
    {
      "id?": "temp-unit-1",
      "data": {
        "name": "string"
      }
    }
  ],
  "prepTimes": [
    {
      "id?": "temp-preptime-1",
      "data": {
        "duration": "number",
        "style_id": "string | null"
      }
    }
  ],
  "macros": [
    {
      "id?": "temp-macro-1",
      "data": {
        "calories": "number | null",
        "protein": "number | null",
        "fiber": "number | null",
        "sugar": "number | null",
        "saturated": "number | null",
        "trans": "number | null",
        "caffein": "number | null"
      }
    }
  ]
}
```

#### Create Review for Product
```json
{
  "action": "create",
  "reviews": {
    "id?": "temp-review-1",
    "data": {
      "rating": "number | null",
      "comment": ["string"],
      "description": ["string"],
      "buy_again": "Y" | "N" | "M" | "D" | null,
      "date_review": "string",
      "product_id": "string",
      "publication_id": null
    }
  },
  "products": [
    {
      "id?": "temp-product",
      "data": {
        "name": "string",
        "en_name": "string | null",
        "macro_id": "string | null"
      }
    }
  ]
}
```

#### Create Review for Publication
```json
{
  "action": "create",
  "reviews": {
    "id?": "temp-review-1",
    "data": {
      "rating": "number | null",
      "comment": ["string"], 
      "description": ["string"],
      "buy_again": "Y" | "N" | "M" | "D" | null,
      "date_review": "string",
      "product_id": null,
      "publication_id": "string"
    }
  },
  "publications": {
    "id?": "temp-publication",
    "data": {
      "title": "string",
      "description": ["string"],
      "note": ["string"],
      "public": "boolean",
      "published": "boolean",
      "thumbnail": "string | null",
      "type_id": "string | null",
      "style_id": "string | null",
      "author_id": "string | null"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "publications": ["Publication[]"],
    "contents": ["Content[]"],
    "segments": ["Segment[]"],
    "ingredients": ["Ingredient[]"],
    "products": ["Product[]"],
    "categories": ["Category[]"],
    "units": ["Unit[]"],
    "prepTimes": ["PrepTime[]"],
    "reviews": ["Review[]"],
    "macros": ["Macro[]"],
    "users": ["User[]"]
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "string"
}
```

**Error Responses:**
- `401`: Various funny messages (Unauthorized)
- `429`: Too many attempts, get lost!

---

## Data Types Reference

### CategoryCore
```json
{
  "category_id": "string | undefined",
  "str_value": "string",
  "type": "string"
}
```

### ContentData
```json
{
  "content_id": "string",
  "publication_id": "string", 
  "total_prep_time": "number",
  "servings": "number | null",
  "publication": "PublicationData | null",
  "content_segments": "ContentSegmentData[] | null",
  "content_ingredients": "ContentIngredientData[] | null",
  "content_prep_times": "ContentPrepTimeData[] | null"
}
```

### IngredientData
```json
{
  "ingredient_id": "string",
  "quantity": "number | null",
  "is_recipe_id": "string | null",
  "product_id": "string",
  "multiply_factor": "number",
  "product": "ProductData | null",
  "isRecipe": "PublicationData | null",
  "content_ingredients": "ContentIngredientData[] | null",
  "ingredient_units": "IngredientUnitData[] | null"
}
```

### ProductData
```json
{
  "product_id": "string",
  "name": "string", 
  "en_name": "string | null",
  "macro_id": "string | null",
  "macro": "MacroData | null",
  "ingredients": "IngredientData[] | null",
  "reviews": "ReviewData[] | null",
  "product_categories": "ProductCategoryData[] | null"
}
```

### MacroData
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
  "products": "ProductData[] | null"
}
```

### PrepTimeData
```json
{
  "prep_time_id": "string",
  "duration": "number",
  "style_id": "string | null",
  "style": "CategoryData | null",
  "content_prep_times": "ContentPrepTimeData[] | null",
  "segment_prep_time": "SegmentPrepTimeData[] | null"
}
```

### UnitData
```json
{
  "unit_id": "string",
  "name": "string",
  "ingredient_units": "IngredientUnitData[] | null"
}
```

### SegmentData
```json
{
  "segment_id": "string",
  "title": "string | null",
  "paragraph": "string",
  "order_num": "number | null",
  "content_segments": "ContentSegmentData[] | null",
  "segment_prep_time": "SegmentPrepTimeData[] | null"
}
```