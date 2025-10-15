# Guide de conversion Markdown → JSON Payload

## Philosophie

La conversion enrichit et restructure le contenu brut pour créer une représentation navigable. Elle implique d'ajouter valeurs nutritionnelles, diviser les étapes en segments logiques, extraire informations implicites et normaliser formats.

## Schéma TypeScript

```typescript
export interface OrchestratorPayload {
  action: "create" | "update";
  payload: Record<string, PublicationPayload>;
}

export interface PublicationPayload {
  publication_id?: string;
  title: string;
  description: string[]; // ["Description de la recette"]
  note: string[]; // Conseils, variations
  public: boolean;
  published: boolean;
  thumbnail?: string; // ~/nas/media/recipebook/<slug>.png
  gallery?: string[];
  type?: { str_value: string; type: "Type" };
  style?: { str_value: string; type: "Style" };
  author?: { str_value: string; type: "Author" };
  tags?: Array<{ str_value: string; type: "Tag" }>;
  contents?: ContentPayload[]; // ≥1 groupe
}

export interface ContentPayload {
  content_id?: string;
  total_prep_time: number; // Minutes totales
  servings: {
    yield: number;
    value: string; // "portions", "verres de 250ml"
  } | null;
  subtitle?: string; // Nom du groupe
  is_ingredient?: boolean; // true si composante réutilisable
  publication?: string;
  content_segments?: SegmentWithMeta[];
  content_ingredients?: IngredientPayload[];
  content_prep_times?: PrepTimePayload[];
}

export interface SegmentWithMeta {
  position: number; // 1, 2, 3... séquentiel
  segment: {
    title?: string; // "Marinade aromatique"
    paragraph: string; // Instructions
  };
  segment_prep_time?: Array<{
    prep_time: PrepTimePayload;
  }>;
}

export interface IngredientPayload {
  ingredient_id?: string;
  quantity: number;
  multiply_factor: number; // Défaut 1, ajusté pour épices
  cut?: string; // "haché", "râpé"
  title?: string; // Regroupement optionnel
  product: {
    name?: string;
    product_id?: string;
    macro?: MacroPayload | null;
  };
  ingredient_units?: Array<{
    unit: {
      name: string; // "ml", "g", "tasse", "pièce"
      unit_id?: string;
    };
  }>;
}

export interface MacroPayload {
  // Valeur sur 100g, ENTIERS arrondis
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  alcohol?: number; // % volumique
}

export interface PrepTimePayload {
  prep_time_id?: string;
  duration: number;
  style?: {
    str_value: string; // "Préparation", "Cuisson", "Repos / Marinade"
    type: "PrepTime" | "PrepStyle";
  };
}
```

## Types de recettes

**Type 1: Simple (1 content)**  
Boissons, épices, recettes directes. Un seul content avec tous ingrédients et étapes.

**Type 2: Variantes (multiples contents)**  
Versions régionales d'une même base. Chaque content = une variante complète avec ses propres ingrédients.

**Type 3: Complexe (contents interdépendants)**  
Sous-recettes marquées `is_ingredient: true`, puis assemblage final référençant ces composantes avec `unit: "recette"`.

## Processus de conversion

**Étape 1: Enrichir ingrédients**  
Extraire quantité/unité/produit. Ajouter macros depuis bases nutritionnelles (USDA, Santé Canada) ou calcul (4 cal/g sucre, 7 cal/g alcool). Mettre `null` si négligeable.

**Étape 2: Restructurer étapes**  
Fusionner étapes similaires sous un segment titré. Créer titres descriptifs ("Marinade aromatique", "Assemblage et service"). Extraire durées du texte ou estimer. Séparer temps actif (Préparation) et passif (Repos / Marinade).

**Étape 3: Calculer portions**  
Convertir rendement en portions concrètes. "2 litres" → `{ yield: 8, value: "verres de 250ml" }`. Mettre `null` si non applicable (épices).

**Étape 4: Distribuer temps**  
`content_prep_times` = vue globale de tous les temps. `segment_prep_time` = temps spécifiques par étape. `total_prep_time` = somme totale.

**Étape 5: Remplacer la description**
Écrire une courte description élégante.

## Standards

**Unités courantes:**  
Volume: `ml`, `tasse` (250ml), `cuil. à soupe` (15ml), `cuil. à thé` (5ml)  
Poids: `g`, `kg`, `lb`, `oz`  
Quantité: `pièce`, `au goût`, `recette`

**Styles de temps:**  
`Préparation` (découpe, mélange), `Cuisson` (four, poêle), `Repos / Marinade`, `Assemblage`, `Réfrigération`, `Levée`

**Slug:**  
Minuscules sans accents ni espaces. "5 épices chinois" → `"5epiceschinois"`

## Validation

✓ JSON valide sans texte additionnel  
✓ Champs obligatoires présents  
✓ Macros arrondies à l'entier  
✓ Positions séquentielles (1, 2, 3...)  
✓ `multiply_factor = 1` par défaut  
✓ Au moins 1 content  
✓ Temps cohérents entre segments et global
