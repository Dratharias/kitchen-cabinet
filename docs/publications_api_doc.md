# API Publications - Documentation

## Endpoints

### Public
- `GET /api/public/publications` - Liste paginée (public + published uniquement)
- `GET /api/public/publications/:id` - Détail complet

### Privé (authentifié)
- `GET /api/private/publications` - Liste paginée (tout)
- `GET /api/private/publications/:id` - Détail complet
- `POST /api/private/publications` - Créer
- `PUT /api/private/publications/:id` - Modifier
- `DELETE /api/private/publications/:id` - Supprimer

## Query Parameters

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 12 | Items par page |
| `sortBy` | string | "title" | Champ de tri |
| `order` | "asc" \| "desc" | "asc" | Ordre de tri |
| `filter` | JSON | {} | Filtres additionnels |

## Exemples

### Liste page 1
```
GET /api/public/publications?page=1&limit=12
```

### Liste page 2, tri par titre décroissant
```
GET /api/public/publications?page=2&limit=12&sortBy=title&order=desc
```

### Filtrer par type
```
GET /api/public/publications?filter={"type":["Recette","Guide"]}
```

### Combinaison complète
```
GET /api/public/publications?page=2&limit=12&sortBy=title&order=asc&filter={"type":["Recette"]}
```

## Réponse

```json
{
  "items": [
    {
      "publication_id": "uuid",
      "title": "string",
      "description": ["string"],
      "note": ["string"],
      "public": true,
      "published": true,
      "thumbnail": "string | null",
      "gallery": ["string"],
      "type": { "category_id": "uuid", "str_value": "string", "type": "string" },
      "style": { "category_id": "uuid", "str_value": "string", "type": "string" },
      "author": { "category_id": "uuid", "str_value": "string", "type": "string" },
      "tags": [{ "category_id": "uuid", "str_value": "string", "type": "string" }],
      "contents": [{ "total_prep_time": 0, "servings": 1 }],
      "reviewCount": 0,
      "reviewAverageScore": 0
    }
  ],
  "total": 100,
  "page": 2,
  "limit": 12,
  "totalPages": 9
}
```

## Champs triables

- `title`
- `public`
- `published`
- Tout champ direct de la table `publication`