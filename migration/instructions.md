# Migration Recettes — Plan de Projet

## Objectif

Convertir un ou plusieurs fichiers Markdown de recettes en un **OrchestratorPayload** JSON valide, via un pipeline multi‑passes, tolérant aux erreurs, traçable, et idempotent.

## Portée

* Entrée: fichier `.md` unique ou répertoire contenant des `.md`.
* Sortie: `migration/<slug>.json` conforme au payload cible.
* Tolérance aux formats Markdown usuels + entête style YAML.

## Interface CLI

```bash
python3 migration/migrate.py -f <file.md> [--tag <tag>]
python3 migration/migrate.py -d <dir>     [--tag <tag>]
```

## Entrées / Sorties

**Entrées**

* `title`, `tags`, `description`, `notes`, `thumbnail`
* `ingredients:` (avec groupes `**Nom` pas `**Nom**` et liens internes `[Texte]_:_[/path]`)
* `steps:` liste d’étapes

**Sortie**

* JSON final `OrchestratorPayload` avec `contents[]`, `content_ingredients[]`, `content_segments[]`.

## Pipeline multi‑passes

1. **Métadonnées** (sans Mistral)

   * Parse entête. Ajoute défauts: `type=Recette`, `style=null`, `author=null`, `public=true`, `published=true`.
   * Fichier temp: `01_metadata.json`.
2. **Ingrédients bruts** (sans Mistral)

   * Extrait `ingredients:`. Gère `**Groupe**`. Nettoie `[Texte]_:_[/path] → Texte`.
   * Fichier temp: `02_ingredients_raw.json`.
3. **Groupes logiques** (Mistral)

   * Détermine `{ group, is_new_recipe }`. Si aucun groupe trouvé: un seul `{ group=title, is_new_recipe=false }`.
   * Fichier temp: `03_groups.json`.
4. **Étapes brutes** (sans Mistral)

   * Extrait `steps:` et **respecte l’ordre d’apparition des groupes**.
   * Fichier temp: `04_steps_raw.json`.
5. **Détection "ingrédient"** (sans Mistral)

   * Fusionne par `group`. Marque `is_ingredient=true` si le nom normalisé d’un groupe est contenu dans un ingrédient d’un autre groupe.
   * **Préserve l’ordre** de `03_groups.json`.
   * Fichier temp: `05_merged_detected.json`.
6. **Enrichissement des ingrédients** (Mistral)

   * Parse chaque ligne en `{ quantity, multiply_factor=1, product, unit }`.
   * Fichier temp: `06_enriched.json`.
7. **Mapping payload** (sans Mistral)

   * Construit l’`OrchestratorPayload` final.
   * Règles: `subtitle = group` si `is_new_recipe=true`. `is_ingredient` reporté en `contents[].data.is_ingredient`.
   * Fichier temp: `07_payload_mapped.json`.
8. **Normalisation description** (Mistral)

   * Déduit `total_prep_time` et `servings` depuis `description` si présents. Écrase `description` par une version régénérée.
   * Fichier temp: `08_payload_normalized.json`.
9. **Écriture finale**

   * `migration/<slug>.json` où `slug = slugify(title|basename)`.

## Règles déterministes (Étapes 4–5)

* **Ordre de groupes** = ordre de première apparition des `**Groupe` dans le Markdown.
* Étapes non regroupées → affectées au premier groupe s’il est unique, sinon distribution heuristique conservatrice.
* Normalisation pour comparaison: `lower()` + suppression de tout caractère non alphanumérique.

## Points d’intégration Mistral

* Étape 3: classification des groupes et `is_new_recipe`.
* Étape 6: parsing fin des ingrédients (quantités, unités complexes, fractions, plages, etc.).
* Étape 8: extraction sémantique du temps/portions et réécriture de `description`.

## Schéma cible (résumé)

```json
{
  "action": "create|update",
  "payload": {
    "<clé>": {
      "title": "string",
      "description": ["string"],
      "note": ["string"],
      "public": true,
      "published": true,
      "thumbnail": "url",
      "type": { "data": { "str_value": "Recipe", "type": "Type" } },
      "style": { "data": { "str_value": "string", "type": "Style" } },
      "author": { "data": { "str_value": "string", "type": "Author" } },
      "tags": [ { "data": { "str_value": "string", "type": "Tag" } } ],
      "contents": [
        {
          "data": { "total_prep_time": 0, "servings": null, "subtitle": "string|null", "is_ingredient": false },
          "content_ingredients": [
            {
              "data": { "quantity": 1, "multiply_factor": 1, "title": "group" },
              "product": { "data": { "name": "string" } },
              "ingredient_units": [ { "unit": { "data": { "name": "string" } } } ]
            }
          ],
          "content_segments": [ { "position": 1, "segment": { "data": { "title": "group", "paragraph": "..." } } } ]
        }
      ]
    }
  }
}
```

## Conventions de fichiers

* Temporaires: répertoire `mkdtemp()` avec préfixe `migration_work_`.
* Noms temp fixes par étape (01_.. → 08_..). Nettoyage systématique en FIN.
* Sortie: `migration/<slug>.json`, `slug` = minuscules, alnum, tirets simples.

## Validation et Retry

* Toute étape Mistral → **retry** jusqu’à `MAX_RETRIES_MISTRAL`.
* Validation JSON stricte par sérialisation + re‑parse avant écriture disque.
* Échec après retries → exception claire et logs utiles.

## Logging

* Préfixes: `[PHASE n]`, `[TRY i/N]`, `[SUCCESS]`, `[WARN]`, `[ERROR]`, `[CLEANUP]`.
* Tracer les fichiers générés et les chemins d’E/S.

## Cas limites

* Aucun `**Groupe**` → 1 seul bloc avec `group = title`.
* Sections manquantes (`ingredients:`, `steps:`) → listes vides mais pipeline continue.
* Liens internes malformés → ignorer silencieusement la partie lien, garder le texte brut.
* Fractions 1/2, ¾, plages "2–3" → à déléguer au parsing Mistral (Étape 6).

## Structure projet

```
migration/
├── migrate.py
└── processors/
    ├── metadata_extractor.py
    ├── ingredients_parser.py
    ├── group_mapper.py
    ├── steps_extractor.py
    ├── ingredient_detector.py
    ├── enricher.py
    ├── payload_mapper.py
    └── description_normalizer.py
```

## Critères d’acceptation

* Exécution sur un `.md` de démonstration → JSON final valide et importable.
* Ordre des groupes respecté. Détection `is_ingredient` correcte pour références croisées.
* Retraitement idempotent: relancer sur le même `.md` ne casse pas la sortie.

## Étapes suivantes

* Brancher Mistral sur 3/6/8.
* Améliorer heuristiques steps/ingrédients.
* Ajouter tests unitaires et de non‑régression.
* Support des fractions et unités composites par parsing robuste.
