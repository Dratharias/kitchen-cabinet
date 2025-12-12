# API Reference - Recipe Migration

## Recipe Publication Endpoint

**POST** `/api/publicate`

### Purpose
Create or update a complete recipe publication with nested ingredients, preparation steps, and metadata.

### Authentication
Requires JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Request Body Structure

```json
{
  "action": "create",
  "title": "Recipe Title",
  "description": ["Description paragraph 1", "Description paragraph 2"],
  "note": ["Optional note 1", "Optional note 2"],
  "public": true,
  "published": true,
  "thumbnail": "http://example.com/image.jpg",
  "contents": [
    {
      "subtitle": "Main Recipe",
      "note": "Optional content note",
      "serving_yield": 4,
      "serving_value": "portions",
      "total_prep_time": 30,
      "prep_time_note": "30 minutes total",
      "ingredients": [
        {
          "product": {
            "name": "Product Name",
            "unit_weight": 100,
            "unit_weight_unit": "g",
            "is_recipe": false
          },
          "quantity": 200,
          "unit": {
            "str_value": "g",
            "type": "weight"
          },
          "multiply_factor": 1.0,
          "note": "Optional ingredient note",
          "section": "Section Name"
        }
      ],
      "segments": [
        {
          "paragraph": "Preparation step description",
          "order_index": 1,
          "note": "Optional step note",
          "section": "Section Name"
        }
      ]
    }
  ]
}
```

### Field Details

#### Publication Level
- **action**: "create" | "update" | "delete"
- **title**: Recipe name (required)
- **description**: Array of description paragraphs
- **note**: Array of optional notes
- **public**: Boolean - visibility
- **published**: Boolean - publication status
- **thumbnail**: Image URL

#### Content Level
- **subtitle**: Variant/section name
- **serving_yield**: Number of servings
- **serving_value**: Unit of serving (e.g., "portions", "personnes")
- **total_prep_time**: Total preparation time in minutes
- **prep_time_note**: Human-readable prep time description

#### Ingredient Structure
- **product.name**: Ingredient name (required)
- **product.unit_weight**: Standard unit weight
- **product.unit_weight_unit**: Unit for standard weight
- **product.is_recipe**: Boolean - is this a sub-recipe?
- **quantity**: Amount needed
- **unit.str_value**: Unit symbol (g, ml, cup, etc.)
- **unit.type**: Unit category (weight, volume, count)
- **multiply_factor**: Scaling factor (default 1.0)
- **note**: Additional ingredient notes
- **section**: Group ingredients by section (e.g., "Pâte", "Garniture")

#### Segment (Step) Structure
- **paragraph**: Step instruction text (required)
- **order_index**: Step number
- **note**: Additional step notes
- **section**: Group steps by section (e.g., "Préparation", "Cuisson")

### Response
```json
{
  "success": true,
  "data": {
    "publication_id": "uuid",
    "title": "Recipe Title"
  }
}
```

## Review Creation Endpoint

**POST** `/api/reviews`

### Purpose
Create a review for a published recipe.

### Authentication
Requires JWT token.

### Request Body
```json
{
  "publication_id": "uuid",
  "rating": 5,
  "comment": ["Review comment paragraph 1"],
  "description": ["Detailed review paragraph 1"]
}
```

### Field Details
- **publication_id**: UUID of the recipe (required)
- **rating**: Integer 1-5 (optional)
- **comment**: Array of comment paragraphs (optional)
- **description**: Array of detailed description paragraphs (optional)

### Response
```json
{
  "success": true,
  "data": {
    "review_id": "uuid",
    "publication_id": "uuid",
    "rating": 5,
    "comment": ["Review text"],
    "description": ["Details"],
    "date_review": "2025-12-11T..."
  }
}
```

## Important Notes

### Sections
Both ingredients and segments support a `section` field to group items visually:
- Use consistent section names within a content
- Common sections: "Pâte", "Garniture", "Sauce", "Préparation", "Cuisson", "Finition"

### Units
Use SI units (g, kg, ml, L, etc.) for all ingredients; convert any non-SI units automatically.
Common unit types:
- **weight**: g, kg, mg
- **volume**: ml, L, cl
- **count**: pcs, unit
- **custom**: cup, tbsp, tsp, pinch

### Expected Output Format
When migrating a recipe from text, output **ONLY** valid JSON matching the publication structure above. No markdown, no explanations, just the JSON payload ready to send to the API.
