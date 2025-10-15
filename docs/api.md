# Documentation API - Système de Publication

## 1. Aperçu des Routes API (Backend)

Le backend est structuré autour de trois groupes de routes principaux : **Authentification**, **Accès Public** (lecture seule filtrée), et **Accès Privé** (CRUD complet).

### 1.1 Authentification

| Méthode | Chemin | Rôle |
|---------|--------|------|
| `POST` | `/api/auth/login` | Authentifie un utilisateur et retourne un jeton JWT Bearer |

**Payload de Connexion :**

```json
{
  "username": "string",
  "password": "string"
}
```

**Réponse (Succès) :**

```json
{
  "username": "string",
  "role": "admin" | "user",
  "token": "string (JWT)"
}
```

### 1.2 Accès Public (Lecture Seule)

Ces routes ne nécessitent pas de jeton d'authentification mais n'affichent que les publications avec `public: true` et `published: true`.

#### Publications

| Méthode | Chemin | Rôle |
|---------|--------|------|
| `GET` | `/api/public/publications` | Liste paginée des publications publiques |
| `GET` | `/api/public/publications/:id` | Récupère une publication détaillée par ID (si publique et publiée) |

**Paramètres de Requête pour `GET /api/public/publications` :**

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | `number` | `1` | Numéro de page |
| `limit` | `number` | `12` | Éléments par page |
| `sortBy` | `string` | `"title"` | Champ de tri (`title`, `date_created`, etc.) |
| `order` | `"asc" \| "desc"` | `"asc"` | Ordre de tri |
| `filter` | `string` (JSON) | `{}` | Filtres de recherche (ex: `{"q": "gingembre", "type": ["Recette"]}`) |

### 1.3 Accès Privé (CRUD Protégé)

Toutes ces routes nécessitent un jeton JWT Bearer valide dans l'en-tête `Authorization`.

#### Publications (Atomique)

Ce contrôleur gère les opérations CRUD simples sur la publication elle-même (champs scalaires et relations 1-N). Pour le CRUD imbriqué (contenu, ingrédients), utilisez l'Orchestrateur.

| Méthode | Chemin | Rôle |
|---------|--------|------|
| `GET` | `/api/private/publications` | Liste paginée de toutes les publications (publiques ou privées) |
| `GET` | `/api/private/publications/:id` | Récupère une publication détaillée par ID |
| `POST` | `/api/private/publications` | Crée une publication (champs de base uniquement) |
| `PATCH` | `/api/private/publications/:id` | Mise à jour partielle des champs scalaires (ex: `title`, `public`) |
| `PUT` | `/api/private/publications/:id` | Remplacement complet |
| `DELETE` | `/api/private/publications/:id` | Supprime une publication |

#### Autres Ressources (CRUD atomique)

Des contrôleurs atomiques existent pour les entités non-imbriquées, principalement utilisés pour le backoffice et l'édition manuelle :

| Chemin | Ressource |
|--------|-----------|
| `/api/categories` | Catégories (Type, Style, Tag) |
| `/api/products` | Produits (référence d'ingrédient) |
| `/api/macros` | Macros nutritionnelles |
| `/api/units` | Unités de mesure |
| `/api/prepTimes` | Temps de préparation |
| `/api/segments` | Segments d'étapes (paragraphes) |
| `/api/servings` | Définitions de portions |
| `/api/users` | Utilisateurs |
| `/api/reviews` | Avis et critiques |

---

## 2. Guide de l'Orchestrateur Monolithique

L'endpoint `POST /api/publicate` est conçu pour gérer les structures de données profondément imbriquées (Publication > Contenu > Ingrédients/Segments) en une seule transaction. Il est la méthode privilégiée pour l'ingestion de nouvelles recettes ou la mise à jour complète des structures existantes.

### 2.1 Schéma de la Requête

Chaque opération (`create`, `update`, `delete`) est spécifiée dans l'objet racine.

| Champ | Type | Valeur | Description |
|-------|------|--------|-------------|
| `action` | `string` | `"create" \| "update" \| "delete"` | Type d'opération à effectuer |
| `payload` | `Object` | `{ [key: string]: PublicationPayload \| null }` | Un objet où chaque clé (libre ou `publication_id`) mappe à la publication à traiter |

### 2.2 Opération CREATE

L'action `"create"` crée toutes les entités manquantes (Catégories, Produits, Segments) et les lie à la nouvelle Publication.

- **Clé `payload`** : Peut être n'importe quelle chaîne (ex: `"ma_recette_1"`)
- **`publication_id`** : Optionnel. S'il est fourni, il sera validé pour garantir qu'il n'existe pas déjà

**Exemple de Création (Ingrédient, Macro, Unité, Segment, Catégorie) :**

```json
{
  "action": "create",
  "payload": {
    "cocktail_mojito": {
      "title": "Mojito Classique",
      "description": ["Le cocktail cubain par excellence."],
      "public": true,
      "tags": [
        {
          "str_value": "Cocktail",
          "type": "Tag"
        }
      ],
      "type": {
        "str_value": "Boisson",
        "type": "Type"
      },
      "contents": [
        {
          "subtitle": "Instructions principales",
          "is_ingredient": false,
          "total_prep_time": 15,
          "servings": {
            "yield": 2,
            "value": "verres"
          },
          "content_ingredients": [
            {
              "quantity": 60,
              "multiply_factor": 1,
              "product": {
                "name": "Rhum Blanc",
                "macro": {
                  "calories": 200,
                  "alcohol": 40
                }
              },
              "ingredient_units": [
                {
                  "unit": {
                    "name": "ml"
                  }
                }
              ]
            }
          ],
          "content_segments": [
            {
              "position": 1,
              "segment": {
                "paragraph": "Mélanger tous les ingrédients...",
                "title": "Mélange des arômes"
              }
            }
          ]
        }
      ]
    }
  }
}
```

### 2.3 Opération UPDATE

L'action `"update"` nécessite le `publication_id` dans l'objet de publication.

Le processus est monolithique pour les relations imbriquées (Contents, Tags) :

1. Les champs scalaires de la Publication (`title`, `public`, `thumbnail`) sont mis à jour (PATCH)
2. Toutes les relations `tags` sont supprimées puis recréées (`DELETE MANY + CREATE`)
3. Tous les `contents` (et tout ce qu'ils contiennent : ingrédients, segments, temps) sont supprimés de la base (`DELETE MANY`) puis recréés entièrement

- **Clé `payload`** : Doit être le `publication_id` existant si l'action est dirigée par un DTO atomique, sinon une clé libre
- **`publication_id`** : Obligatoire dans l'objet de publication

### 2.4 Opération DELETE

L'action `"delete"` supprime une publication complète.

- **Clé `payload`** : Doit être le `publication_id` de la publication à supprimer
- **Valeur** : Doit être `null`

**Exemple de Suppression :**

```json
{
  "action": "delete",
  "payload": {
    "b8f6e8c0-12a3-45b6-89c0-1234567890ab": null
  }
}
```

> **Note :** Ceci supprime la publication ainsi que tous ses Contents, Tags, ContentSegments, etc., grâce aux cascades PostgreSQL.

---

## 3. Référence des Modèles de Données (Types Orchestrateur)

Cette section fournit les structures de types TypeScript utilisées pour construire le `payload` de l'Orchestrateur (`POST /api/publicate`).

### 3.1 DTOs Atomiques (Utilisés pour l'Upsert)

Ces objets sont utilisés pour créer ou identifier des entités atomiques et sont souvent imbriqués.

#### CategoryData (Type, Style, Author, Tag, PrepTimeStyle)

```typescript
export interface CategoryData {
  str_value: string; // Nom de la catégorie (ex: "Recette", "Boulangerie")
  type: string;      // Type de taxonomie (ex: "Type", "Style", "Tag")
}
```

#### ServingsData (Portions)

```typescript
export interface ServingsData {
  serving_id?: UUID; // ID si update/référence d'une portion existante
  yield: number;     // Nombre de portions / rendement (ex: 4)
  value: string;     // Unité de portion (ex: "verres de 250ml", "portions")
}
```

#### MacroData (Nutritionnel)

Les valeurs sont des entiers (arrondis sur 100g de produit).

```typescript
export interface MacroData {
  macro_id?: UUID;
  calories?: number;
  protein?: number;
  carbs?: number;
  fiber?: number;
  sugar?: number;
  saturated?: number;
  trans?: number;
  caffein?: number;
  alcohol?: number; // Taux d'alcool (pour les boissons)
}
```

#### ProductData (Référence d'Ingrédient)

```typescript
export interface ProductData {
  product_id?: UUID;        // ID si référence d'un produit existant
  name: string;             // Nom du produit (requis)
  macro?: MacroData | null; // Macrodata imbriquée
}
```

#### UnitData (Unité de Mesure)

```typescript
export interface UnitData {
  unit_id?: UUID;
  name: string; // Nom de l'unité (ex: "g", "ml", "tasse")
}
```

### 3.2 Structure Imbriquée Principale

#### IngredientPayload (Ingrédient dans un Contenu)

```typescript
export interface IngredientPayload {
  ingredient_id?: UUID;
  quantity: number;
  multiply_factor: number;
  cut?: string;  // (ex: "haché", "râpé")
  title?: string;
  product: ProductData; // Objet Product (voir 3.1)
  ingredient_units: Array<{ unit: UnitData }>; // Unité de mesure
}
```

#### SegmentWithMeta (Étape de Préparation)

```typescript
export interface SegmentWithMeta {
  position: number; // Ordre séquentiel (1, 2, 3...)
  segment: {
    segment_id?: UUID;
    title?: string;
    paragraph: string; // Description de l'étape (requis)
  };
  segment_prep_time?: Array<{
    prep_time: PrepTimePayload;
  }>;
}
```

#### ContentData (Bloc de Recette / Variante)

Ceci est la structure pour un élément du tableau `PublicationPayload.contents`.

```typescript
export interface ContentData {
  content_id?: UUID;
  publication_id?: UUID; // Requis uniquement si mis à jour atomique
  total_prep_time: number;
  subtitle?: string | null;
  is_ingredient?: boolean;
  
  // Clés étrangères (ID du Servings créé via l'upsert)
  serving_id?: string | null; 

  servings: ServingsData | null; // Objet Servings (pour upsert)
  
  content_segments: SegmentWithMeta[];
  content_ingredients: IngredientPayload[];
  content_prep_times: PrepTimePayload[];
  
  // Note: La gestion de la galerie (M-N) est souvent gérée séparément
  // ou omise de cette structure pour éviter la complexité des jointures.
}
```

#### PublicationPayload (Structure Racine)

```typescript
export interface PublicationPayload {
  publication_id?: UUID; 
  title: string;
  description: string[];
  note: string[];
  public: boolean;
  published: boolean;
  thumbnail?: string;
  // OMIT: gallery (relation N-N)
  
  type?: CategoryData;
  style?: CategoryData;
  author?: CategoryData;
  tags?: CategoryData[];
  
  contents: ContentData[];
}
```

---

## Annexe : Notes Techniques

- **UUID** : Type identifiant unique universel
- **Cascade PostgreSQL** : Les suppressions en cascade sont configurées au niveau de la base de données
- **JWT Bearer** : Format d'en-tête : `Authorization: Bearer <token>`
- **Upsert** : Opération qui crée une entité si elle n'existe pas, ou la met à jour si elle existe déjà