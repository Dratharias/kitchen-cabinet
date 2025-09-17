# API Payloads & Examples Documentation

## Authentication

### POST `/api/auth/login`

**Request:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "username": "admin",
  "role": "admin",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response:**
```json
{
  "error": "Invalid credentials"
}
```

## Ultra Nested Publication Creation

### POST `/api/publications` - Complete Recipe Example

This example shows creating a complete recipe with all nested entities in a single request. The orchestrator automatically generates UUIDs for all entities.

**Request:**
```json
{
  "title": "Classic Chocolate Chip Cookies",
  "description"?: ["Soft and chewy chocolate chip cookies perfect for any occasion"],
  "note"?: ["Make sure butter is room temperature", "Don't overbake for chewy texture"],
  "public"?: true,
  "published"?: true,
  "thumbnail"?: "https://example.com/cookie-image.jpg",
  "type_id"?: null,
  "style_id"?: null,
  "author_id"?: null,
  "connect"?: {
    "type"?: [{"str_value": "Dessert", "type": "publication_type"}],
    "style"?: [{"str_value": "American", "type": "cuisine"}],
    "author"?: [{"str_value": "Chef Marie", "type": "author"}],
    "tags"?: [
      {"str_value": "Easy", "type": "difficulty"},
      {"str_value": "Family Friendly", "type": "occasion"},
      {"str_value": "Cookies", "type": "category"}
    ],
    "contents"?: [{
      "publication_id"?: "string",
      "total_prep_time": 45,
      "servings"?: 24,
      "connect"?: {
        "content_segments"?: [
          {
            "title"?: "Prepare Dry Ingredients",
            "paragraph": "In a medium bowl, whisk together flour, baking soda, and salt. Set aside.",
            "order_num"?: 1,
            "connect"?: {
              "segment_prep_time"?: [{
                "duration": 5,
                "style_id"?: null,
                "connect"?: {
                  "style"?: [{"str_value": "Prep", "type": "prep_style"}]
                }
              }]
            }
          },
          {
            "title"?: "Cream Butter and Sugars",
            "paragraph": "In a large bowl, cream together butter, granulated sugar, and brown sugar until light and fluffy, about 3-4 minutes.",
            "order_num"?: 2,
            "connect"?: {
              "segment_prep_time"?: [{
                "duration": 5,
                "connect"?: {
                  "style"?: [{"str_value": "Mix", "type": "prep_style"}]
                }
              }]
            }
          },
          {
            "title"?: "Add Eggs and Vanilla",
            "paragraph": "Beat in eggs one at a time, then stir in vanilla extract.",
            "order_num"?: 3,
            "connect"?: {
              "segment_prep_time"?: [{
                "duration": 2,
                "connect"?: {
                  "style"?: [{"str_value": "Mix", "type": "prep_style"}]
                }
              }]
            }
          },
          {
            "title"?: "Combine Wet and Dry",
            "paragraph": "Gradually blend in the flour mixture. Fold in chocolate chips.",
            "order_num"?: 4,
            "connect"?: {
              "segment_prep_time"?: [{
                "duration": 3,
                "connect"?: {
                  "style"?: [{"str_value": "Mix", "type": "prep_style"}]
                }
              }]
            }
          },
          {
            "title"?: "Bake",
            "paragraph": "Drop rounded tablespoons of dough onto ungreased cookie sheets. Bake for 9-11 minutes or until golden brown.",
            "order_num"?: 5,
            "connect"?: {
              "segment_prep_time"?: [{
                "duration": 30,
                "connect"?: {
                  "style"?: [{"str_value": "Bake", "type": "prep_style"}]
                }
              }]
            }
          }
        ],
        "content_ingredients"?: [
          {
            "quantity"?: 2.25,
            "is_recipe_id"?: null,
            "product_id": "string",
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "All-Purpose Flour",
                "en_name"?: "Flour",
                "macro_id"?: null,
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 364,
                    "protein"?: 10.3,
                    "fiber"?: 2.7,
                    "sugar"?: 0.3,
                    "saturated"?: null,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"},
                    {"str_value": "Pantry Staples", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "cups"}
              ]
            }
          },
          {
            "quantity"?: 1,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Baking Soda",
                "en_name"?: "Baking Soda",
                "connect"?: {
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "teaspoon"}
              ]
            }
          },
          {
            "quantity"?: 1,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Salt",
                "en_name"?: "Salt",
                "connect"?: {
                  "product_categories"?: [
                    {"str_value": "Seasonings", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "teaspoon"}
              ]
            }
          },
          {
            "quantity"?: 1,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Butter",
                "en_name"?: "Butter",
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 717,
                    "protein"?: 0.9,
                    "fiber"?: 0,
                    "sugar"?: 0.1,
                    "saturated"?: 51.4,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Dairy", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "cup"}
              ]
            }
          },
          {
            "quantity"?: 0.75,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Granulated Sugar",
                "en_name"?: "White Sugar",
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 387,
                    "protein"?: 0,
                    "fiber"?: 0,
                    "sugar"?: 99.98,
                    "saturated"?: null,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"},
                    {"str_value": "Sweeteners", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "cup"}
              ]
            }
          },
          {
            "quantity"?: 0.75,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Brown Sugar",
                "en_name"?: "Brown Sugar",
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 380,
                    "protein"?: 0.1,
                    "fiber"?: 0,
                    "sugar"?: 97.03,
                    "saturated"?: null,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"},
                    {"str_value": "Sweeteners", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "cup"}
              ]
            }
          },
          {
            "quantity"?: 2,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Large Eggs",
                "en_name"?: "Eggs",
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 155,
                    "protein"?: 13,
                    "fiber"?: 0,
                    "sugar"?: 1.1,
                    "saturated"?: 3.1,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Dairy", "type": "product_category"},
                    {"str_value": "Protein", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "whole"}
              ]
            }
          },
          {
            "quantity"?: 2,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Vanilla Extract",
                "en_name"?: "Vanilla",
                "connect"?: {
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"},
                    {"str_value": "Flavorings", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "teaspoons"}
              ]
            }
          },
          {
            "quantity"?: 2,
            "multiply_factor"?: 1,
            "connect"?: {
              "product"?: [{
                "name": "Chocolate Chips",
                "en_name"?: "Chocolate Chips",
                "connect"?: {
                  "macro"?: [{
                    "calories"?: 479,
                    "protein"?: 4.2,
                    "fiber"?: 7,
                    "sugar"?: 47.8,
                    "saturated"?: 16.2,
                    "trans"?: null,
                    "caffein"?: null
                  }],
                  "product_categories"?: [
                    {"str_value": "Baking", "type": "product_category"},
                    {"str_value": "Chocolate", "type": "product_category"}
                  ]
                }
              }],
              "ingredient_units"?: [
                {"name": "cups"}
              ]
            }
          }
        ],
        "content_prep_times"?: [
          {
            "duration": 15,
            "style_id"?: null,
            "connect"?: {
              "style"?: [{"str_value": "Prep", "type": "prep_style"}]
            }
          },
          {
            "duration": 30,
            "connect"?: {
              "style"?: [{"str_value": "Bake", "type": "prep_style"}]
            }
          }
        ]
      }
    }]
  }
}
```

**Response:**
```json
{
  "publication_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Classic Chocolate Chip Cookies",
  "description": ["Soft and chewy chocolate chip cookies perfect for any occasion"],
  "note": ["Make sure butter is room temperature", "Don't overbake for chewy texture"],
  "public": true,
  "published": true,
  "thumbnail": "https://example.com/cookie-image.jpg",
  "type_id": "550e8400-e29b-41d4-a716-446655440001",
  "style_id": "550e8400-e29b-41d4-a716-446655440002",
  "author_id": "550e8400-e29b-41d4-a716-446655440003",
  "averageCount": 0,
  "averageScore": 0,
  "type": {
    "str_value": "Dessert",
    "type": "publication_type"
  },
  "style": {
    "str_value": "American",
    "type": "cuisine"
  },
  "author": {
    "str_value": "Chef Marie",
    "type": "author"
  },
  "contents": [...],
  "ingredientsRef": [...],
  "tags": [...]
}
```

## Standard CRUD Examples

### Simple Category Creation

**POST `/api/categories`:**
```json
{
  "str_value": "Vegetarian",
  "type": "dietary_restriction"
}
```

### Simple Product Creation

**POST `/api/products`:**
```json
{
  "name": "Organic Tomatoes",
  "en_name"?: "Tomatoes",
  "macro_id"?: null,
  "connect"?: {
    "macro"?: [{
      "calories"?: 18,
      "protein"?: 0.9,
      "fiber"?: 1.2,
      "sugar"?: 2.6,
      "saturated"?: null,
      "trans"?: null,
      "caffein"?: null
    }],
    "product_categories"?: [
      {"str_value": "Vegetables", "type": "product_category"},
      {"str_value": "Organic", "type": "certification"}
    ]
  }
}
```

### Publication Update with Relations

**PUT `/api/publications/:id`:**
```json
{
  "title"?: "Updated Recipe Title",
  "description"?: [...],
  "note"?: [...],
  "public"?: false,
  "published"?: true,
  "thumbnail"?: null,
  "type_id"?: null,
  "style_id"?: null,
  "author_id"?: null,
  "connect"?: {
    "tags"?: [
      {"category_id": "550e8400-e29b-41d4-a716-446655440004"}
    ]
  },
  "set"?: {
    "contents"?: [
      {"content_id": "550e8400-e29b-41d4-a716-446655440005"}
    ]
  }
}
```

## Pagination Response Format

**GET `/api/publications?skip=0&take=12`:**
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 12,
  "totalPages": 13
}
```

## Error Response Format

**Standard Error:**
```json
{
  "error": "Validation failed: title is required"
}
```

**Authentication Error:**
```json
{
  "error": "Unauthorized access"
}
```

**Rate Limit Error:**
```json
{
  "error": "Too many failed login attempts. Please try again in 15 minutes."
}
```

## Headers Required

### Protected Endpoints
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Public Endpoints
```http
Content-Type: application/json
```