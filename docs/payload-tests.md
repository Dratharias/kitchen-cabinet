# Orchestrator Test Payloads avec cURL

Avant de lancer les tests, générer un token d'authentification :

```bash
TOKEN=$(curl -s -X POST http://127.0.0.1:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"dratharias","password":"Ch4ng3m3!"}' | jq -r '.token')
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

## Cheat Sheet

```bash
# Products
curl -s -X GET http://127.0.0.1:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"product_id":"[^"]*"' | sort -u | head -n 3

# Units
curl -s -X GET http://127.0.0.1:3001/api/units \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"unit_id":"[^"]*"' | sort -u | head -n 3

# Publications
curl -s -X GET http://127.0.0.1:3001/api/publications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"publication_id":"[^"]*"' | sort -u | head -n 3

# Ingredients
curl -s -X GET http://127.0.0.1:3001/api/ingredients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"ingredient_id":"[^"]*"' | sort -u | head -n 3

# PrepTimes
curl -s -X GET http://127.0.0.1:3001/api/prepTimes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"prep_time_id":"[^"]*"' | sort -u | head -n 3

# Segments
curl -s -X GET http://127.0.0.1:3001/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"segment_id":"[^"]*"' | sort -u | head -n 3

# Contents
curl -s -X GET http://127.0.0.1:3001/api/contents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | grep -o '"content_id":"[^"]*"' | sort -u | head -n 3
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
                "product": { "id": "7f953dc4-ea40-4714-8978-6a0cc2188f77" },
                "ingredient_units": [
                  { "unit": { "data": { "name": "grams" } } }
                ]
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

## 10. Payload complet

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

## 10. Monsieur payload

```bash
curl -X POST http://127.0.0.1:3001/api/publicate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "payload": {
      "11": {
        "publication_id": "056bd3b2-eedd-4a86-b2e1-87f24e9248b9",
        "title": "Payload Monstrueux de Test",
        "description": ["Recette de test ultra complète avec toutes les variations possibles."],
        "note": ["À utiliser uniquement pour stress-test l’orchestrateur."],
        "public": true,
        "published": true,
        "thumbnail": "https://picsum.photos/seed/orchestrator/640/480",

        "type": { "data": { "str_value": "Recipe", "type": "Type" } },
        "style": { "data": { "str_value": "Fusion", "type": "Style" } },
        "author": { "data": { "str_value": "Admin Testeur", "type": "Author" } },

        "tags": [
          { "data": { "str_value": "stress", "type": "Tag" } },
          { "data": { "str_value": "full", "type": "Tag" } },
          { "data": { "str_value": "debug", "type": "Tag" } }
        ],

        "contents": [
          {
            "content_id": "39761e9b-59a8-421d-ae38-d1320337c7ab",
            "data": { "total_prep_time": 45, "servings": 6, "is_ingredient": false, "subtitle": "Garniture" },
            "content_segments": [
              {
                "position": 1,
                "segment": {
                  "segment_id": "daa33f98-9f6e-4db3-81ff-096ba9710736",
                  "data": { "title": "Préparation", "paragraph": "Couper et émincer les légumes." },
                  "segment_prep_time": [
                    { "prep_time": { "prep_time_id": "47b3df4d-ad40-4220-82f1-466ea51dbe5b", "data": { "duration": 15 }, "style": { "data": { "str_value": "Cook", "type": "Cook" } } } }
                  ]
                }
              },
              {
                "position": 2,
                "segment": {
                  "segment_id": "daa33f98-9f6e-4db3-81ff-096ba9710736",
                  "data": { "title": "Cuisson", "paragraph": "Cuire à feu doux en remuant." },
                  "segment_prep_time": [
                    { "prep_time": { "data": { "duration": 20 } } },
                    { "prep_time": { "data": { "duration": 5 }, "style": { "data": { "str_value": "Slow", "type": "Cook" } } } }
                  ]
                }
              }
            ],

            "content_ingredients": [
              {
                "ingredient_id": "45cf91d9-d98e-4794-97c8-5d00232c6e00",
                "data": { "quantity": 2, "multiply_factor": 1 },
                "product": { "id": "564e4d1d-697d-4a84-a441-9556da8590bb", "data": { "name": "Unknown" } },
                "ingredient_units": [
                  { "unit": { "unit_id": "1ba5d3cd-714f-4712-a64a-0681c574b9f2", "data": { "name": "grams" } } }
                ]
              },
              {
                "data": { "quantity": 1, "multiply_factor": 2 },
                "product": {
                  "data": {
                    "name": "Ail",
                    "en_name": "Garlic"
                  }
                },
                "ingredient_units": [
                  { "unit": { "data": { "name": "cloves" } } }
                ]
              },
              {
                "data": { "quantity": 500, "multiply_factor": 1 },
                "product": {
                  "data": {
                    "name": "Lasagnes maison",
                    "en_name": "Homemade Lasagna",
                    "publication": { "id": "062ca5ff-b549-4e5e-8b38-3ee1d96e0a7e", "data": {} }
                  }
                },
                "ingredient_units": [
                  { "unit": { "data": { "name": "grams" } } }
                ]
              }
            ],

            "content_prep_times": [
              { "prep_time_id": "47b3df4d-ad40-4220-82f1-466ea51dbe5b", "data": { "duration": 10 } },
              { "prep_time": { "data": { "duration": 5 }, "style": { "data": { "str_value": "Finishing", "type": "Cook" } } } }
            ]
          },

          {
            "content_id": "39761e9b-59a8-421d-ae38-d1320337c7ab",
            "data": { "total_prep_time": 15, "servings": 2 },

            "content_segments": [
              {
                "position": 1,
                "segment": {
                  "data": { "paragraph": "Mélanger tous les ingrédients secs." }
                }
              }
            ],

            "content_ingredients": [
              {
                "data": { "quantity": 100, "multiply_factor": 1 },
                "product": { "data": { "name": "Farine", "en_name": "Flour" } },
                "ingredient_units": [
                  { "unit": { "data": { "name": "grams" } } }
                ]
              },
              {
                "data": { "quantity": 50, "multiply_factor": 1 },
                "product": { "data": { "name": "Sucre", "en_name": "Sugar" } },
                "ingredient_units": [
                  { "unit": { "data": { "name": "grams" } } }
                ]
              }
            ]
          }
        ]
      }
    }
  }'

```
