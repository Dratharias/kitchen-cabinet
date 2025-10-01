from typing import Any, Dict, List, Optional

class PayloadMapper:
    def map(self, meta: Dict[str, Any], merged: List[Dict[str, Any]], forced_tag: Optional[str] = None) -> Dict[str, Any]:
        tags = list(meta.get("tags", []))
        if forced_tag and forced_tag not in tags:
            tags.append(forced_tag)

        def is_header(s: str) -> bool:
            t = s.strip()
            return t.startswith("**")

        def header_text(s: str) -> str:
            t = s.strip()
            # retire les "**" en début et fin si présents
            t = t.lstrip("*").lstrip()
            if t.endswith("**"):
                t = t[:-2].rstrip()
            return t

        contents: List[Dict[str, Any]] = []
        for bloc in merged:
            subtitle = bloc["group"] if bloc.get("is_new_recipe") else None

            # Ingrédients enrichis
            content_ingredients = []
            for ing in bloc.get("ingredients", []):
                content_ingredients.append({
                    "data": {
                        "quantity": ing.get("quantity"),
                        "multiply_factor": ing.get("multiply_factor", 1),
                        "title": bloc["group"],
                    },
                    "product": {"data": {"name": ing.get("product", "")}},
                    "ingredient_units": [
                        {"unit": {"data": {"name": ing.get("unit", "")}}}
                    ],
                })

            # Étapes → segments avec titres de section dynamiques
            content_segments: List[Dict[str, Any]] = []
            current_title = bloc.get("group", "")
            pos = 0
            for step in bloc.get("steps", []):
                if is_header(step):
                    current_title = header_text(step)
                    continue  # ne pas créer de segment pour une ligne header
                pos += 1
                content_segments.append(
                    {
                        "position": pos,
                        "segment": {
                            "data": {"title": current_title, "paragraph": step}
                        },
                    }
                )

            contents.append(
                {
                    "data": {
                        "total_prep_time": 0,
                        "servings": None,
                        "subtitle": subtitle,
                        "is_ingredient": bool(bloc.get("is_ingredient", False)),
                    },
                    "content_ingredients": content_ingredients,
                    "content_segments": content_segments,
                }
            )

        payload = {
            "action": "create",
            "payload": {
                "1": {
                    "title": meta.get("title") or "Untitled",
                    "description": meta.get("description", []),
                    "note": meta.get("notes", []),
                    "public": True,
                    "published": True,
                    "thumbnail": meta.get("thumbnail") or "",
                    "type": {"data": {"str_value": "Recipe", "type": "Type"}},
                    "style": {"data": {"str_value": meta.get("style") or "", "type": "Style"}},
                    "author": {"data": {"str_value": meta.get("author") or "", "type": "Author"}},
                    "tags": [{"data": {"str_value": t, "type": "Tag"}} for t in tags],
                    "contents": contents,
                }
            },
        }
        return payload
