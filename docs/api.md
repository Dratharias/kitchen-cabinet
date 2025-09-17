# API Payloads & Response Documentation

## Authentication

### POST `/api/auth/login`

**Request Payload:**
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

**Error Response:**
```json
{
  "error": "string"
}
```

## Users

### POST `/api/users`

**Request Payload:**
```json
{
  "username": "string",
  "password": "string",
  "role": "admin" | "user" | "guest"
}
```

**Response:**
```json
{
  "username": "string",
  "role": "admin" | "user" | "guest"
}
```

### GET `/api/users/:id`

**Response:**
```json
{
  "username": "string",
  "role": "admin" | "user" | "guest"
}
```

### PUT `/api/users/:id`

**Request Payload:**
```json
{
  "username": "string",
  "role": "admin" | "user" | "guest"
}
```

**Response:**
```json
{
  "username": "string",
  "role": "admin" | "user" | "guest"
}
```

## Categories

### POST `/api/categories`

**Request Payload:**
```json
{
  "str_value": "string",
  "type": "string",
  "connect": {
    "publications_type": [{"publication_id": "string"}],
    "publications_style": [{"publication_id": "string"}],
    "publications_author": [{"publication_id": "string"}],
    "prep_time": [{"prep_time_id": "string"}],
    "publication_tags": [{"category_id": "string", "publication_id": "string"}],
    "product_categories": [{"category_id": "string", "product_id": "string"}]
  }
}
```

**Response:**
```json
{
  "category_id": "string",
  "str_value": "string",
  "type": "string"
}
```

### GET `/api/categories`

**Response:**
```json
[
  {
    "category_id": "string",
    "str_value": "string",
    "type": "string"
  }
]
```

## Publications

### POST `/api/publications`

**Request Payload:**
```json
{
  "title": "string",
  "description": ["string"],
  "note": ["string"],
  "public": boolean,
  "published": boolean,
  "thumbnail": "string" | null,
  "type_id": "string" | null,
  "style_id": "string" | null,
  "author_id": "string" | null,
  "connect": {
    "contents": [{"content_id": "string"}],
    "ingredientsRef": [{"ingredient_id": "string"}],
    "reviews": [{"review_id": "string"}],
    "tags": [{"category_id": "string"}],
    "type": [{"category_id": "string"}],
    "style": [{"category_id": "string"}],
    "author": [{"user_id": "string"}]
  }
}
```

**Response:**
```json
{
  "publication_id": "string",
  "title": "string",
  "description": ["string"],
  "note": ["string"],
  "public": boolean,
  "published": boolean,
  "thumbnail": "string" | null,
  "type_id": "string" | null,
  "style_id": "string" | null,
  "author_id": "string" | null,
  "averageCount": number,
  "averageScore": number,
  "type": {
    "str_value": "string",
    "type": "string"
  } | null,
  "style": {
    "str_value": "string",
    "type": "string"
  } | null,
  "author": {
    "str_value": "string",
    "type": "string"
  } | null,
  "contents": [...] | null,
  "ingredientsRef": [...] | null,
  "tags": [...] | null
}
```

### GET `/api/publications` (with pagination)

**Query Parameters:**
- `skip`: number (default: 0)
- `take`: number (default: 12)
- `filter[field]`: various filters

**Response:**
```json
{
  "items": [
    {
      "publication_id": "string",
      "title": "string",
      "description": ["string"],
      "note": ["string"],
      "public": boolean,
      "published": boolean,
      "thumbnail": "string" | null,
      "type_id": "string" | null,
      "style_id": "string" | null,
      "author_id": "string" | null,
      "averageCount": number,
      "averageScore": number,
      "type": object | null,
      "style": object | null,
      "author": object | null,
      "contents": array | null,
      "ingredientsRef": array | null,
      "tags": array | null
    }
  ],
  "total": number,
  "page": number,
  "limit": number,
  "totalPages": number
}
```

### GET `/api/public/publications` (public read-only)

**Response:** Same as protected route but only returns public publications

## Contents

### POST `/api/contents`

**Request Payload:**
```json
{
  "publication_id": "string",
  "total_prep_time": number,
  "servings": number | null,
  "connect": {
    "content_segments": [{"segment_id": "string"}],
    "content_ingredients": [{"ingredient_id": "string"}],
    "content_prep_times": [{"prep_time_id": "string"}]
  }
}
```

**Response:**
```json
{
  "content_id": "string",
  "publication_id": "string",
  "total_prep_time": number,
  "servings": number | null,
  "publication": {...} | null,
  "content_segments": [...] | null,
  "content_ingredients": [...] | null,
  "content_prep_times": [...] | null
}
```

## Products

### POST `/api/products`

**Request Payload:**
```json
{
  "name": "string",
  "en_name": "string" | null,
  "macro_id": "string" | null,
  "connect": {
    "ingredients": [{"ingredient_id": "string"}],
    "reviews": [{"review_id": "string"}],
    "product_categories": [{"category_id": "string"}],
    "macro": [{"macro_id": "string"}]
  }
}
```

**Response:**
```json
{
  "product_id": "string",
  "name": "string",
  "en_name": "string" | null,
  "macro_id": "string" | null,
  "macro": {...} | null,
  "ingredients": [...] | null,
  "reviews": [...] | null,
  "product_categories": [...] | null
}
```

## Ingredients

### POST `/api/ingredients`

**Request Payload:**
```json
{
  "quantity": number | null,
  "is_recipe_id": "string" | null,
  "product_id": "string",
  "multiply_factor": number,
  "connect": {
    "product": [{"product_id": "string"}],
    "content_ingredients": [{"content_id": "string"}],
    "ingredient_units": [{"unit_id": "string"}]
  }
}
```

**Response:**
```json
{
  "ingredient_id": "string",
  "quantity": number | null,
  "is_recipe_id": "string" | null,
  "product_id": "string",
  "multiply_factor": number,
  "product": {...} | null,
  "isRecipe": {...} | null,
  "content_ingredients": [...] | null,
  "ingredient_units": [...] | null
}
```

## Macros

### POST `/api/macros`

**Request Payload:**
```json
{
  "calories": number | null,
  "protein": number | null,
  "fiber": number | null,
  "sugar": number | null,
  "saturated": number | null,
  "trans": number | null,
  "caffein": number | null,
  "connect": {
    "products": [{"product_id": "string"}]
  }
}
```

**Response:**
```json
{
  "macro_id": "string",
  "calories": number | null,
  "protein": number | null,
  "fiber": number | null,
  "sugar": number | null,
  "saturated": number | null,
  "trans": number | null,
  "caffein": number | null,
  "products": [...] | null
}
```

## Units

### POST `/api/units`

**Request Payload:**
```json
{
  "name": "string",
  "connect": {
    "ingredient_units": [{"ingredient_id": "string"}]
  }
}
```

**Response:**
```json
{
  "unit_id": "string",
  "name": "string",
  "ingredient_units": [...] | null
}
```

## Prep Times

### POST `/api/prepTimes`

**Request Payload:**
```json
{
  "duration": number,
  "style_id": "string" | null,
  "connect": {
    "style": [{"category_id": "string"}],
    "content_prep_times": [{"content_id": "string"}],
    "segment_prep_time": [{"segment_id": "string"}]
  }
}
```

**Response:**
```json
{
  "prep_time_id": "string",
  "duration": number,
  "style_id": "string" | null,
  "style": {...} | null,
  "content_prep_times": [...] | null,
  "segment_prep_time": [...] | null
}
```

## Segments

### POST `/api/segments`

**Request Payload:**
```json
{
  "title": "string" | null,
  "paragraph": "string",
  "order_num": number | null,
  "connect": {
    "content_segments": [{"content_id": "string"}],
    "segment_prep_time": [{"prep_time_id": "string"}]
  }
}
```

**Response:**
```json
{
  "segment_id": "string",
  "title": "string" | null,
  "paragraph": "string",
  "order_num": number | null,
  "content_segments": [...] | null,
  "segment_prep_time": [...] | null
}
```

## Reviews

### POST `/api/reviews`

**Request Payload:**
```json
{
  "product_id": "string" | null,
  "publication_id": "string" | null,
  "rating": number | null,
  "comment": ["string"],
  "description": ["string"],
  "buy_again": "Y" | "N" | "M" | "D" | null,
  "date_review": "string",
  "connect": {
    "product": [{"product_id": "string"}],
    "publication": [{"publication_id": "string"}]
  }
}
```

**Response:**
```json
{
  "review_id": "string",
  "product_id": "string" | null,
  "publication_id": "string" | null,
  "rating": number | null,
  "comment": ["string"],
  "description": ["string"],
  "buy_again": "Y" | "N" | "M" | "D" | null,
  "date_review": "string",
  "product": {...} | null,
  "publication": {...} | null
}
```

## Common Patterns

### Update Operations
All PUT endpoints accept:
```json
{
  // Core fields (same as create)
  "field": "value",
  
  // Connection operations
  "connect": {
    "relation": [{"id": "string"}]
  },
  
  // Set operations (replace all relations)
  "set": {
    "relation": [{"id": "string"}]
  }
}
```

### Delete Operations
All DELETE endpoints return:
```json
{
  "deleted": true
}
```

### Error Responses
Standard error format:
```json
{
  "error": "Error message"
}
```

### Authentication Headers
Protected routes require:
```
Authorization: Bearer <token>
```

### Rate Limiting
- Max 5 failed auth attempts per IP
- 15-minute block duration
- Returns 429 status with custom message