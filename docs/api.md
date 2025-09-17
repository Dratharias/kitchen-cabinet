# API Types Documentation

Cette documentation décrit les **types TypeScript** utilisés à travers l'application, à la fois côté frontend et backend.  
Les types peuvent être importés depuis le package partagé `@shared-types`.

```shell
kitchen-cabinet$ ls shared-types/
db.ts  delete.ts  publication-query.ts  publication.ts  review.ts  upsert.ts
```

## Core Database Types

### User Management
```typescript
interface AppUser {
  user_id: string;
  username: string;
  password: string;
  role: string;
  created: string; // DateTime en ISO string
}
```

### Category System
```typescript
interface Category {
  category_id: string;
  str_value: string;
  type: string;
  num_value?: number;

  // Relations
  publications_type?: Publication[];
  publications_style?: Publication[];
  publications_author?: Publication[];
  prep_time?: PrepTime[];
  publication_tags?: PublicationTag[];
  product_categories?: ProductCategory[];
}
```

### Publications
```typescript
interface Publication {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  type_id?: string;
  style_id?: string;
  author_id?: string;

  type?: Category;
  style?: Category;
  author?: Category;

  contents?: Content[];
  ingredientsRef?: Ingredient[];
  reviews?: Review[];
  tags?: PublicationTag[];
}

interface PublicationTag {
  publication_id: string;
  category_id: string;

  publication?: Publication;
  category?: Category;
}
```

### Content Management
```typescript
interface Content {
  content_id: string;
  publication_id: string;
  total_prep_time: number;
  servings?: number;

  publication?: Publication;
  content_segments?: ContentSegment[];
  content_ingredients?: ContentIngredient[];
  content_prep_times?: ContentPrepTime[];
}

interface Segment {
  segment_id: string;
  title?: string;
  paragraph: string;
  order_num?: number;

  content_segments?: ContentSegment[];
  segment_prep_time?: SegmentPrepTime[];
}
```

### Product & Ingredients
```typescript
interface Product {
  product_id: string;
  name: string;
  en_name?: string;
  macro_id?: string;

  macro?: Macro;
  ingredients?: Ingredient[];
  reviews?: Review[];
  product_categories?: ProductCategory[];
}

interface Ingredient {
  ingredient_id: string;
  quantity?: number;
  is_recipe_id?: string;
  product_id: string;
  multiply_factor: number;

  product?: Product;
  isRecipe?: Publication;
  content_ingredients?: ContentIngredient[];
  ingredient_units?: IngredientUnit[];
}

interface Unit {
  unit_id: string;
  name: string;

  ingredient_units?: IngredientUnit[];
}
```

### Nutritional Information
```typescript
interface Macro {
  macro_id: string;
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;

  products?: Product[];
}
```

### Time Management
```typescript
interface PrepTime {
  prep_time_id: string;
  duration: number;
  style_id?: string;

  style?: Category;
  content_prep_times?: ContentPrepTime[];
  segment_prep_time?: SegmentPrepTime[];
}
```

### Reviews
```typescript
interface Review {
  review_id: string;
  product_id?: string;
  publication_id?: string;
  rating?: number;
  comment: string[];
  description: string[];
  buy_again?: string;
  date_review: string;

  product?: Product;
  publication?: Publication;
}
```

## Junction Tables

### Content Relations
```typescript
interface ContentSegment {
  content_id: string;
  segment_id: string;
  position?: number;

  content?: Content;
  segment?: Segment;
}

interface ContentIngredient {
  content_id: string;
  ingredient_id: string;

  content?: Content;
  ingredient?: Ingredient;
}

interface ContentPrepTime {
  content_id: string;
  prep_time_id: string;

  content?: Content;
  prep_time?: PrepTime;
}
```

### Other Relations
```typescript
interface SegmentPrepTime {
  segment_id: string;
  prep_time_id: string;

  segment?: Segment;
  prep_time?: PrepTime;
}

interface IngredientUnit {
  ingredient_id: string;
  unit_id: string;

  ingredient?: Ingredient;
  unit?: Unit;
}

interface ProductCategory {
  product_id: string;
  category_id: string;

  product?: Product;
  category?: Category;
}
```

## Deep Types (Nested Relations)

### Deep Publication
```typescript
interface DeepPublication {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;

  // Relations
  type?: Category;
  style?: Category;
  author?: Category;
  tags?: PublicationTag[];

  // Nested contents
  contents?: DeepContent[];

  // Ingredients referencing recipes
  ingredientsRef?: DeepIngredient[];

  // Reviews
  reviews?: DeepReview[];
}
```

### Deep Content
```typescript
interface DeepContent {
  content_id: string;
  total_prep_time: number;
  servings?: number;

  content_segments?: {
    segment_id: string;
    title?: string;
    paragraph: string;
    order_num?: number;
    position?: number;
  }[];

  content_ingredients?: DeepIngredient[];

  content_prep_times?: {
    prep_time_id: string;
    duration: number;
    style?: Category;
  }[];
}
```

### Deep Ingredient
```typescript
interface DeepIngredient {
  ingredient_id: string;
  quantity?: number;
  multiply_factor: number;

  // Linked product
  product?: DeepProduct;

  // If this ingredient references a recipe
  isRecipe?: DeepPublication;

  ingredient_units?: {
    unit_id: string;
    name: string;
  }[];
}
```

### Deep Product
```typescript
interface DeepProduct {
  product_id: string;
  name: string;
  en_name?: string;

  // Product macro
  macro?: Macro;

  // Nested ingredients
  ingredients?: DeepIngredient[];

  // Reviews
  reviews?: DeepReview[];

  // Categories
  product_categories?: Category[];
}
```

### Deep Review
```typescript
interface DeepReview {
  review_id: string;
  rating?: number;
  comment: string[];
  description: string[];
  buy_again?: string;
  date_review: string;

  product?: DeepProduct;
  publication?: DeepPublication;
}

// Simplified publication for reviews (prevents infinite recursion)
interface PublicationForReview {
  publication_id: string;
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;

  type?: Category;
  style?: Category;
  author?: Category;
  tags?: PublicationTag[];
}
```

## API Payloads

### UPSERT Operations

#### Utility Types
```typescript
// Makes all properties optional recursively
type PartialDeep<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? PartialDeep<U>[]
    : T[P] extends object
    ? PartialDeep<T[P]>
    : T[P];
};

// Optional ID helper for nested objects
type WithOptionalId<T> = T extends { [key: string]: any }
  ? { id?: string } & PartialDeep<T>
  : T;
```

#### Upsert Payload Map
```typescript
interface UpsertPayloadMap {
  app_user: { 
    user_id?: string; 
    username?: string; 
    password?: string; 
    role?: string 
  };
  category: { 
    category_id?: string; 
    str_value?: string; 
    type?: string; 
    num_value?: number 
  };
  publication: WithOptionalId<DeepPublication>;
  publication_tag: { 
    publication_id: string; 
    category_id: string 
  };
  content: WithOptionalId<DeepContent>;
  segment: { 
    segment_id?: string; 
    title?: string; 
    paragraph?: string; 
    order_num?: number 
  };
  unit: { 
    unit_id?: string; 
    name?: string 
  };
  macro: WithOptionalId<Macro>;
  product: WithOptionalId<DeepProduct>;
  ingredient: WithOptionalId<DeepIngredient>;
  prep_time: { 
    prep_time_id?: string; 
    duration?: number; 
    style_id?: string 
  };
  content_segment: { 
    content_id: string; 
    segment_id: string; 
    position?: number 
  };
  content_ingredient: { 
    content_id: string; 
    ingredient_id: string 
  };
  content_prep_time: { 
    content_id: string; 
    prep_time_id: string 
  };
  segment_prep_time: { 
    segment_id: string; 
    prep_time_id: string 
  };
  ingredient_unit: { 
    ingredient_id: string; 
    unit_id: string 
  };
  product_category: { 
    product_id: string; 
    category_id: string 
  };
  review: WithOptionalId<DeepReview>;
}

type UpsertTable = keyof UpsertPayloadMap;

interface UpsertRequest<T extends UpsertTable = UpsertTable> {
  table: T;
  id?: string; // if present → update, otherwise create
  payload: UpsertPayloadMap[T];
}
```

### DELETE Operations

#### Delete Payload Map
```typescript
type DeletePayloadMap = {
  app_user: { user_id: string };
  category: { category_id: string };
  publication: { publication_id: string };
  publication_tag: { publication_id: string; category_id: string };
  content: { content_id: string };
  segment: { segment_id: string };
  unit: { unit_id: string };
  macro: { macro_id: string };
  product: { product_id: string };
  ingredient: { ingredient_id: string };
  prep_time: { prep_time_id: string };
  content_segment: { content_id: string; segment_id: string };
  content_ingredient: { content_id: string; ingredient_id: string };
  content_prep_time: { content_id: string; prep_time_id: string };
  segment_prep_time: { segment_id: string; prep_time_id: string };
  ingredient_unit: { ingredient_id: string; unit_id: string };
  product_category: { product_id: string; category_id: string };
  review: { review_id: string };
};

type DeleteTable = keyof DeletePayloadMap;

interface DeleteRequest<T extends DeleteTable = DeleteTable> {
  table: T;
  payload: DeletePayloadMap[T] | DeletePayloadMap[T][]; // allow batch deletion
}
```

### QUERY Operations

#### Get All Publications
```typescript
interface GetAllPublicationsQuery {
  page?: number;         // pagination
  limit?: number;        // items per page
  search?: string;       // search by title or description
  tags?: string[];       // filter by tags
  typeIds?: string[];    // filter by type
  styleIds?: string[];   // filter by style
  authorIds?: string[];  // filter by author
  publishedOnly?: boolean; // filter only published publications
}
```

#### Get One Publication
```typescript
interface GetOnePublicationQuery {
  publicationId: string;
  includeContents?: boolean;   // include nested contents
  includeIngredients?: boolean; // include nested ingredients
  includeReviews?: boolean;     // include reviews (default false)
}
```

#### Get Nested Data
```typescript
interface GetNestedQuery {
  publicationId?: string;
  productId?: string;
  ingredientId?: string;
  nestedTable: "contents" | "ingredients" | "reviews" | "productCategories" | "prepTimes";
  filters?: Record<string, any>; // specific filters
}
```

#### Get With Filters
```typescript
interface GetFilteredQuery {
  filters: Record<string, any>; // ex: { 'ingredients.productId': 'abc', tags: ['vegan'] }
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

## Usage Examples

### Creating a New Publication
```typescript
const newPublication: UpsertRequest<'publication'> = {
  table: 'publication',
  payload: {
    title: "Chocolate Cake Recipe",
    description: ["Delicious chocolate cake"],
    note: ["Best served warm"],
    public: true,
    published: true,
    contents: [
      {
        total_prep_time: 60,
        servings: 8,
        content_ingredients: [
          {
            quantity: 200,
            multiply_factor: 1,
            product: {
              name: "Dark Chocolate",
              macro: {
                calories: 500,
                protein: 5
              }
            }
          }
        ]
      }
    ]
  }
};
```

### Querying Publications
```typescript
const query: GetAllPublicationsQuery = {
  page: 1,
  limit: 10,
  search: "chocolate",
  tags: ["dessert", "cake"],
  publishedOnly: true
};
```

### Deleting a Review
```typescript
const deleteReview: DeleteRequest<'review'> = {
  table: 'review',
  payload: { review_id: "review-123" }
};
```