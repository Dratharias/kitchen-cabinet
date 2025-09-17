# API Documentation

## Base URL
All endpoints are relative to your base URL (e.g., `https://api.yourapp.com`)

## Authentication
Protected endpoints require JWT token authentication via `Authorization: Bearer <token>` header.

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "username": "string",
  "role": "admin|user|guest",
  "token": "jwt_token_string"
}
```

## Protected CRUD Endpoints

All protected endpoints require authentication and support full CRUD operations unless specified otherwise.

### Publications
- `GET /api/publications` - List publications with pagination
- `GET /api/publications/:id` - Get publication by ID
- `POST /api/publications` - Create publication
- `PUT /api/publications/:id` - Update publication
- `DELETE /api/publications/:id` - Delete publication

### Contents
- `GET /api/contents` - List contents
- `GET /api/contents/:id` - Get content by ID
- `POST /api/contents` - Create content
- `PUT /api/contents/:id` - Update content
- `DELETE /api/contents/:id` - Delete content

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Ingredients
- `GET /api/ingredients` - List ingredients
- `GET /api/ingredients/:id` - Get ingredient by ID
- `POST /api/ingredients` - Create ingredient
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Categories
- `GET /api/categories` - List categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Macros
- `GET /api/macros` - List macros
- `GET /api/macros/:id` - Get macro by ID
- `POST /api/macros` - Create macro
- `PUT /api/macros/:id` - Update macro
- `DELETE /api/macros/:id` - Delete macro

### Prep Times
- `GET /api/prepTimes` - List preparation times
- `GET /api/prepTimes/:id` - Get prep time by ID
- `POST /api/prepTimes` - Create prep time
- `PUT /api/prepTimes/:id` - Update prep time
- `DELETE /api/prepTimes/:id` - Delete prep time

### Segments
- `GET /api/segments` - List segments
- `GET /api/segments/:id` - Get segment by ID
- `POST /api/segments` - Create segment
- `PUT /api/segments/:id` - Update segment
- `DELETE /api/segments/:id` - Delete segment

### Units
- `GET /api/units` - List units
- `GET /api/units/:id` - Get unit by ID
- `POST /api/units` - Create unit
- `PUT /api/units/:id` - Update unit
- `DELETE /api/units/:id` - Delete unit

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Public Endpoints

### Public Publications
Read-only access to published public publications.

- `GET /api/public/publications` - List public publications
- `GET /api/public/publications/:id` - Get public publication by ID

### Reviews
Read-only access to reviews.

- `GET /api/reviews` - List reviews
- `GET /api/reviews/:id` - Get review by ID

## Query Parameters

### Pagination (for paginated endpoints)
- `skip` - Number of records to skip (default: 0)
- `take` - Number of records to return (default: 12)

### Filtering
Most endpoints support filtering through query parameters matching the entity fields.

### Publication-specific filters
- `tagIds[]` - Array of tag category IDs
- `contentIds[]` - Array of content IDs

## Request/Response Examples

### Create Publication
```http
POST /api/publications
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Recipe Title",
  "description": ["Recipe description"],
  "note": ["Additional notes"],
  "public": true,
  "published": true,
  "thumbnail": "image_url",
  "type_id": "category_id",
  "style_id": "category_id",
  "author_id": "category_id",
  "connect": {
    "tags": [{"category_id": "tag_id"}],
    "contents": [{"content_id": "content_id"}]
  }
}
```

### Paginated Response Format
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 12,
  "totalPages": 9
}
```

### Error Response Format
```json
{
  "error": "Error message description"
}
```

## HTTP Status Codes
- `200` - OK
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting
Authentication failures are rate limited per IP address:
- Maximum 5 failed attempts
- 15-minute block duration after limit reached

## Relational Data
Entities support `connect` and `set` operations for managing relationships:
- `connect` - Add relationships
- `set` - Replace all relationships

Relations are automatically handled by the orchestrator for junction tables.