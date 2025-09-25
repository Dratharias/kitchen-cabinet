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
