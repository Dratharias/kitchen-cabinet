# Orchestrator Test Payloads avec cURL

Avant de lancer les tests, générer un token d'authentification :

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.token')
```

---

## Schéma générique du payload

```json
{
  "action": "create" | "update",
  "payload": {
    "<clé_publi>": {
      "title": "string",
      "description": ["string"],
      "note": ["string"],
      "public": true,
      "published": true,
      "type": { "data": { "str_value": "string", "type": "Type" } },
      "style": { "data": { "str_value": "string", "type": "Style" } },
      "author": { "data": { "str_value": "string", "type": "Author" } },
      "tags": [ { "data": { "str_value": "string", "type": "Tag" } } ],
      "contents": [ { "data": { "total_prep_time": 0, "servings": 0 } } ]
    }
  }
}
```

```json
{
  "action": "create" | "update",   // obligatoire
  "payload": {
    "<clé_publi>": {               // clé libre, ex: "1", "myPub", etc.
      // --- Champs principaux Publication ---
      "publication_id": "uuid",    // optionnel (généré si absent, utile en update)
      "title": "string",           // obligatoire
      "description": ["string"],   // obligatoire (au moins un élément, peut être vide "")
      "note": ["string"],          // obligatoire (idem)
      "public": true | false,      // obligatoire
      "published": true | false,   // obligatoire
      "thumbnail": "url",          // optionnel

      // --- Relations catégories ---
      "type": {                    // optionnel
        "data": { "str_value": "string", "type": "Type" }
      },
      "style": {                   // optionnel
        "data": { "str_value": "string", "type": "Style" }
      },
      "author": {                  // optionnel
        "data": { "str_value": "string", "type": "Author" }
      },

      // --- Tags ---
      "tags": [                    // optionnel
        { "data": { "str_value": "string", "type": "Tag" } }
      ],

      // --- Contenus ---
      "contents": [                // optionnel
        {
          "content_id": "uuid",    // optionnel (généré si absent)
          "data": {
            "total_prep_time": 0,  // obligatoire
            "servings": 0          // obligatoire (peut être null)
          },

          // --- Segments (instructions) ---
          "content_segments": [    // optionnel
            {
              "position": 1,       // obligatoire (ordre)
              "segment": {
                "segment_id": "uuid",  // optionnel
                "data": {
                  "title": "string",   // optionnel
                  "paragraph": "string", // obligatoire
                  "order_num": 1       // optionnel
                },
                "segment_prep_time": [ // optionnel
                  {
                    "prep_time": {
                      "prep_time_id": "uuid", // optionnel
                      "data": { "duration": 10 }, // obligatoire
                      "style": { // optionnel
                        "data": { "str_value": "string", "type": "Cook" }
                      }
                    }
                  }
                ]
              }
            }
          ],

          // --- Ingrédients ---
          "content_ingredients": [  // optionnel
            {
              "ingredient_id": "uuid", // optionnel
              "data": {
                "quantity": 1,         // obligatoire
                "multiply_factor": 1   // obligatoire
              },

              "product": {             // obligatoire (au choix selon cas)
                "id": "uuid",          // si produit existant
                "data": { "name": "Unknown" }
              }
              // OU si nouveau produit
              // "product": {
              //   "data": {
              //     "name": "string",        // obligatoire
              //     "en_name": "string",     // optionnel (fallback = name)
              //     "publication": {         // optionnel, si réf recette
              //       "id": "uuid",
              //       "data": {}
              //     }
              //   }
              // }

              ,
              "ingredient_units": [     // optionnel
                {
                  "unit": {
                    "unit_id": "uuid",  // optionnel
                    "data": { "name": "string" } // obligatoire
                  }
                }
              ]
            }
          ],

          // --- Temps de préparation ---
          "content_prep_times": [       // optionnel
            {
              "prep_time_id": "uuid",   // optionnel
              "data": { "duration": 10 }, // obligatoire
              "style": {                 // optionnel
                "data": { "str_value": "string", "type": "Cook" }
              }
            }
          ]
        }
      ]
    }
  }
}
```

---

## 1. Publication minimale

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "1": {
        "title": "Publication minimale",
        "description": ["Desc courte"],
        "note": ["Note"],
        "public": true,
        "published": true
      }
    }
  }'
```

## 2. Avec type/style/author

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "2": {
        "title": "Avec type style author",
        "description": ["Juste un test"],
        "note": ["Rien de spécial"],
        "public": true,
        "published": true,
        "type": { "data": { "str_value": "Recipe", "type": "Type" } },
        "style": { "data": { "str_value": "French", "type": "Style" } },
        "author": { "data": { "str_value": "Paul Bocuse", "type": "Author" } }
      }
    }
  }'
```

## 3. Avec tags

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "3": {
        "title": "Avec tags",
        "description": ["Publication avec tags"],
        "note": ["test tags"],
        "public": true,
        "published": true,
        "tags": [
          { "data": { "str_value": "vegan", "type": "Tag" } },
          { "data": { "str_value": "healthy", "type": "Tag" } }
        ]
      }
    }
  }'
```

## 4. Avec un contenu minimal

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "4": {
        "title": "Contenu simple",
        "description": ["Publication avec un contenu"],
        "note": ["note"],
        "public": true,
        "published": true,
        "contents": [ { "data": { "total_prep_time": 5, "servings": 2 } } ]
      }
    }
  }'
```

## 5. Avec segments

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "5": {
        "title": "Avec segments",
        "description": ["desc"],
        "note": ["note"],
        "public": true,
        "published": true,
        "contents": [
          {
            "data": { "total_prep_time": 10, "servings": 2 },
            "content_segments": [
              { "position": 1, "segment": { "data": { "title": "Step 1", "paragraph": "Faire ceci" } } },
              { "position": 2, "segment": { "data": { "title": "Step 2", "paragraph": "Puis cela" } } }
            ]
          }
        ]
      }
    }
  }'
```

## 6. Avec ingrédients existants

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "6": {
        "title": "Ingrédient existant",
        "description": ["desc"],
        "note": ["note"],
        "public": true,
        "published": true,
        "contents": [
          {
            "data": { "total_prep_time": 2, "servings": 1 },
            "content_ingredients": [
              {
                "data": { "quantity": 1, "multiply_factor": 1 },
                "product": { "id": "EXISTING-PRODUCT-ID", "data": { "name": "Unknown" } },
                "ingredient_units": [ { "unit": { "data": { "name": "grams" } } } ]
              }
            ]
          }
        ]
      }
    }
  }'
```

## 7. Avec nouveaux ingrédients

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "7": {
        "title": "Nouveaux ingrédients",
        "description": ["desc"],
        "note": ["note"],
        "public": true,
        "published": true,
        "contents": [
          {
            "data": { "total_prep_time": 20, "servings": 4 },
            "content_ingredients": [
              { "data": { "quantity": 3, "multiply_factor": 1 }, "product": { "data": { "name": "Carotte", "en_name": "Carrot" } }, "ingredient_units": [ { "unit": { "data": { "name": "pieces" } } } ] },
              { "data": { "quantity": 100, "multiply_factor": 1 }, "product": { "data": { "name": "Lait", "en_name": "Milk" } }, "ingredient_units": [ { "unit": { "data": { "name": "ml" } } } ] }
            ]
          }
        ]
      }
    }
  }'
```

## 8. Avec prepTimes

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "8": {
        "title": "Avec prepTimes",
        "description": ["desc"],
        "note": ["note"],
        "public": true,
        "published": true,
        "contents": [
          { "data": { "total_prep_time": 30, "servings": 3 }, "content_prep_times": [ { "prep_time": { "data": { "duration": 15 } } }, { "prep_time": { "data": { "duration": 5 } } } ] }
        ]
      }
    }
  }'
```

## 9. Publication mixte

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "9": {
        "title": "Mix complet",
        "description": ["desc"],
        "note": ["note"],
        "public": true,
        "published": true,
        "tags": [ { "data": { "str_value": "test", "type": "Tag" } } ],
        "contents": [
          { "data": { "total_prep_time": 12, "servings": 2 }, "content_segments": [ { "position": 1, "segment": { "data": { "title": "Step", "paragraph": "text" } } } ], "content_ingredients": [ { "data": { "quantity": 5, "multiply_factor": 1 }, "product": { "data": { "name": "Oeuf", "en_name": "Egg" } }, "ingredient_units": [ { "unit": { "data": { "name": "pieces" } } } ] } ] }
        ]
      }
    }
  }'
```

## 10. Payload TRÈS complet

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "10": {
        "title": "Recette très complète",
        "description": ["Grande recette avec tout"],
        "note": ["Attention cuisson"],
        "public": true,
        "published": true,
        "type": { "data": { "str_value": "Recipe", "type": "Type" } },
        "style": { "data": { "str_value": "Italian", "type": "Style" } },
        "author": { "data": { "str_value": "Chef Orchestrator", "type": "Author" } },
        "tags": [ { "data": { "str_value": "complexe", "type": "Tag" } }, { "data": { "str_value": "long", "type": "Tag" } } ],
        "contents": [
          {
            "data": { "total_prep_time": 60, "servings": 6 },
            "content_segments": [
              { "position": 1, "segment": { "data": { "title": "Préparation", "paragraph": "Couper les légumes." }, "segment_prep_time": [ { "prep_time": { "data": { "duration": 20 } } } ] } },
              { "position": 2, "segment": { "data": { "title": "Cuisson", "paragraph": "Laisser mijoter." }, "segment_prep_time": [ { "prep_time": { "data": { "duration": 30 } } } ] } }
            ],
            "content_ingredients": [
              { "data": { "quantity": 500, "multiply_factor": 1 }, "product": { "data": { "name": "Viande hachée", "en_name": "Ground Beef" } }, "ingredient_units": [ { "unit": { "data": { "name": "grams" } } } ] },
              { "data": { "quantity": 2, "multiply_factor": 1 }, "product": { "data": { "name": "Oignon", "en_name": "Onion" } }, "ingredient_units": [ { "unit": { "data": { "name": "pieces" } } } ] },
              { "data": { "quantity": 250, "multiply_factor": 1 }, "product": { "data": { "name": "Pâtes", "en_name": "Pasta" } }, "ingredient_units": [ { "unit": { "data": { "name": "grams" } } } ] }
            ],
            "content_prep_times": [ { "prep_time": { "data": { "duration": 5 } } } ]
          }
        ]
      }
    }
  }'
```
