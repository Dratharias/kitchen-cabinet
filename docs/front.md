# Payload Publication — Modèle TypeScript exhaustif

> Tous les `id` sont générés par le backend en création. Fournir un `id` uniquement en mise à jour.

```ts
// Types de base
export type UUID = string;
export type Action = "create" | "update";

// Catégories typées
export type CategoryOf<T extends "Type" | "Style" | "Author" | "Tag" | "PrepTime"> = {
  str_value: string;
  type: T;
};

export type TypeRef = CategoryOf<"Type">;
export type StyleRef = CategoryOf<"Style">;
export type AuthorRef = CategoryOf<"Author">;
export type TagRef = CategoryOf<"Tag">;
export type PrepTimeStyleRef = CategoryOf<"PrepTime">;

// Macro nutritionnelle
export interface MacroPayload {
  macro_id?: UUID;
  calories?: number;
  protein?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;
}

// Produit (ingrédient/référence recette)
export interface ProductInput {
  product_id?: UUID; // si produit existant
  name?: string;     // requis si nouveau produit
  is_recipe?: UUID;  // Publication liée (facultatif)
  macro_id?: UUID;   // facultatif
  macro?: MacroPayload; // facultatif
}

// Unité pour un ingrédient
export interface UnitRef {
  unit: {
    unit_id?: UUID;
    name: string; // requis
  };
}

// Ingrédient dans un content
export interface IngredientPayload {
  ingredient_id?: UUID;
  quantity: number;        // requis
  multiply_factor: number; // requis
  cut?: string;
  title?: string;
  product: ProductInput;   // requis
  ingredient_units?: UnitRef[]; // facultatif
}

// Temps de préparation (réutilisable au segment ou au content)
export interface PrepTimePayload {
  prep_time_id?: UUID;
  duration: number;          // requis, >= 0
  style?: PrepTimeStyleRef;  // facultatif
}

// Segment d'instruction
export interface SegmentCore {
  segment_id?: UUID;
  title?: string;
  paragraph: string; // requis
}

export interface SegmentWithMeta {
  position: number; // requis
  segment: SegmentCore;
  // Lien many-to-many segment <> prep_time
  segment_prep_time?: Array<{ prep_time: PrepTimePayload }>; // facultatif
}

// Bloc de contenu (ingrédients + étapes)
export interface ContentPayload {
  content_id?: UUID;
  total_prep_time: number;     // requis
  servings: number | null;     // requis (peut être null)
  gallery?: string[];          // facultatif
  subtitle?: string;           // facultatif
  is_ingredient?: boolean;     // facultatif
  publication?: UUID;          // si présent, omettre segments/ingredients/prep_times

  content_segments?: SegmentWithMeta[];   // facultatif
  content_ingredients?: IngredientPayload[]; // facultatif
  content_prep_times?: PrepTimePayload[]; // facultatif
}

// Publication
export interface PublicationPayload {
  publication_id?: UUID; // fourni en update
  title: string;         // requis
  description: string[]; // requis (>=1)
  note: string[];        // requis (>=1)
  public: boolean;       // requis
  published: boolean;    // requis
  thumbnail?: string;    // facultatif
  gallery?: string[];    // facultatif (rétrocompatibilité)

  type?: TypeRef;        // facultatif
  style?: StyleRef;      // facultatif
  author?: AuthorRef;    // facultatif
  tags?: TagRef[];       // facultatif

  contents?: ContentPayload[]; // facultatif
}

// Payload d'orchestration
export interface OrchestratorPayload {
  action: Action; // "create" | "update"
  payload: Record<string, PublicationPayload>; // clé libre: "1", "myPub", etc.
}
```

## Notes de validité

* `servings` doit exister même si `null`.
* Si `content.publication` est fourni, ne pas envoyer `content_segments`, `content_ingredients`, `content_prep_times`.
* `product`: fournir `product_id` OU `name` lors de la création.
* Les catégories exigent la clé `type` précise: `"Type" | "Style" | "Author" | "Tag" | "PrepTime"`.

---

# Exemple complet (JSON, sans commentaires)

```json
{
  "action": "create",
  "payload": {
    "pub1": {
      "title": "Bagels maison",
      "description": ["Bagels moelleux faits à la main"],
      "note": ["Peut être congelé"],
      "public": true,
      "published": true,
      "thumbnail": "https://cdn.example.com/img/bagel.jpg",
      "gallery": ["https://cdn.example.com/img/bagel-1.jpg"],
      "type": { "str_value": "Recette", "type": "Type" },
      "style": { "str_value": "Boulangerie", "type": "Style" },
      "author": { "str_value": "Jean Dupont", "type": "Author" },
      "tags": [ { "str_value": "Brunch", "type": "Tag" } ],
      "contents": [
        {
          "total_prep_time": 120,
          "servings": 6,
          "gallery": ["https://cdn.example.com/img/etape-1.jpg"],
          "subtitle": "Pâte et façonnage",
          "is_ingredient": false,
          "content_segments": [
            {
              "position": 1,
              "segment": {
                "title": "Préparer la pâte",
                "paragraph": "Mélanger farine, eau, levure et sel."
              },
              "segment_prep_time": [
                {
                  "prep_time": {
                    "duration": 60,
                    "style": { "str_value": "Repos", "type": "PrepTime" }
                  }
                }
              ]
            },
            {
              "position": 2,
              "segment": {
                "title": "Façonnage",
                "paragraph": "Diviser et façonner des anneaux."
              }
            }
          ],
          "content_ingredients": [
            {
              "quantity": 500,
              "multiply_factor": 1,
              "product": { "name": "Farine blanche" },
              "ingredient_units": [ { "unit": { "name": "g" } } ]
            },
            {
              "quantity": 7,
              "multiply_factor": 1,
              "product": { "name": "Levure sèche" },
              "ingredient_units": [ { "unit": { "name": "g" } } ]
            },
            {
              "quantity": 300,
              "multiply_factor": 1,
              "product": { "name": "Eau" },
              "ingredient_units": [ { "unit": { "name": "ml" } } ]
            },
            {
              "quantity": 10,
              "multiply_factor": 1,
              "product": { "name": "Sel" },
              "ingredient_units": [ { "unit": { "name": "g" } } ]
            }
          ],
          "content_prep_times": [
            { "duration": 30, "style": { "str_value": "Cuisson", "type": "PrepTime" } }
          ]
        }
      ]
    }
  }
}
```
