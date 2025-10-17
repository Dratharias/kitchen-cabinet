# Guide d'enrichissement : Markdown → JSON pour Recettes

## Objectif

Transformer une recette Markdown simple en payload JSON structuré et enrichi avec métadonnées, timings précis et structure logique.

## 1. Structure Markdown Source

### Format recommandé

- **Frontmatter YAML** : Métadonnées entre `---` (title, tags, description, notes)
- **ingredients** : Liste globale avec titres de recettes en gras (`**Titre`)
- **steps** : Liste globale structurée comme ingredients

### Exemple

```yaml
---
title: Bière de gingembre (versions maison & pro)
tags: ["fermentation", "levain", "boissons"]
notes: "Les versions maison utilisent un levain sauvage..."
---
ingredients:
  ["**Levain de gingembre", "250ml d'eau", "10g/jour de gingembre haché"]
steps:
  [
    "**Levain de gingembre",
    "Dans un pot propre, mélanger eau, sucre et gingembre.",
  ]
```

## 2. Processus de Transformation

### Étape A : Division en recettes

Diviser `ingredients` et `steps` en blocs par recette en utilisant les titres `**...` comme délimiteurs.

### Étape B : Enrichissement JSON

#### 1. subtitle et is_ingredient

- `subtitle` : Titre de la recette
- `is_ingredient: true` : Pour recettes servant d'ingrédients à d'autres

#### 2. content_ingredients

Transformer texte simple en objet structuré.

**Avant :** `"1 litre d'eau"`

**Après :**

```json
{
  "quantity": 1,
  "product": { "name": "eau" },
  "ingredient_units": [{ "unit": { "name": "l" } }]
}
```

**Logique :**

- Parser la quantité numérique
- Normaliser l'unité via table de correspondance (ml, l, g, kg, c. à thé, pièce)
- Isoler le nom du produit

#### 3. content_segments et segment_prep_time

Ajout du contexte temporel et structurel.

**Avant :** `"Faire mijoter eau, gingembre, sucre 5 minutes. Filtrer."`

**Après :**

```json
{
  "position": 1,
  "segment": {
    "paragraph": "Dans une casserole, faire mijoter l'eau, le gingembre et le sucre pendant 5 minutes. Retirer du feu et filtrer pour enlever les solides."
  },
  "segment_prep_time": [
    {
      "duration": 10,
      "style": { "str_value": "Infusion", "type": "PrepTime" }
    }
  ]
}
```

**Logique :**

- `position` : Numérotation séquentielle des étapes
- `paragraph` : Reformulation pour clarté
- `segment_prep_time` : Estimation ajoutée
  - `duration` (minutes) : Temps estimé ("mijoter 5 min" + préparation + filtrage ≈ 10 min)
  - `style` : Catégorie d'action (Infusion, Refroidissement, Assemblage, Fermentation, Préparation)

**Exemples de durées :**

- "Refroidir" → 30 minutes
- "Fermenter 2-3 jours" → 2880 minutes (2 × 1440)

#### 4. total_prep_time

Somme de toutes les `duration` des `segment_prep_time` de la recette.

#### 5. servings

Déduire du rendement des ingrédients. Si "1 litre d'eau", alors `yield: 1, value: "litre"`.

## Résumé du processus

L'enrichissement repose sur trois piliers :

1. **Normalisation** : Unités et termes cohérents
2. **Inférence** : Déduction d'informations implicites (rendement, type d'étape)
3. **Ajout de données** : Estimation de durées et catégorisation d'étapes manquantes dans le Markdown source
