from __future__ import annotations
from typing import Any, Dict, List


class PayloadStage:
    def build(
        self,
        metadata: Dict[str, Any],
        groups: List[Dict[str, Any]],
        ingredients: List[Dict[str, Any]],
        steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        payload = {"action": "create", "payload": {}}

        publication = {
            "title": metadata.get("title", "Untitled"),
            "description": metadata.get("description", []),
            "note": metadata.get("notes", []),
            "public": metadata.get("public", True),
            "published": metadata.get("published", True),
            "thumbnail": metadata.get("thumbnail", ""),
            "gallery": metadata.get("gallery", []),
            "type": {
                "str_value": metadata.get("type", "Recette"),
                "type": "Type"
            },
            "style": (
                {"str_value": metadata["style"], "type": "Style"}
                if metadata.get("style")
                else None
            ),
            "author": (
                {"str_value": metadata["author"], "type": "Author"}
                if metadata.get("author")
                else None
            ),
            "tags": [
                {"str_value": t, "type": "Tag"} for t in metadata.get("tags", [])
            ],
            "contents": [],
        }

        # --- Mapping groupes ---
        ing_by_group = {b["group"]: b for b in ingredients}
        steps_by_group = {b["group"]: b for b in steps}

        ordered = [g["group"] for g in groups]
        union_names: List[str] = []
        for name in ordered + list(ing_by_group.keys()) + list(steps_by_group.keys()):
            if name not in union_names and (
                name in ing_by_group or name in steps_by_group
            ):
                union_names.append(name)

        # --- Construire chaque content ---
        for gname in union_names:
            ing_block = ing_by_group.get(gname, {"ingredients": []})
            steps_block = steps_by_group.get(gname, {"steps": []})

            # ---------------- INGREDIENTS ----------------
            content_ingredients: List[Dict[str, Any]] = []
            for ing in ing_block.get("ingredients", []):
                prod = (ing.get("product") or {}) if isinstance(ing, dict) else {}
                prod_name = (
                    prod.get("name")
                    if isinstance(prod, dict)
                    else (str(ing) if isinstance(ing, str) else "")
                )
                prod_cut = prod.get("cut") if isinstance(prod, dict) else None

                # Unit flatten
                units = []
                if isinstance(ing, dict) and ing.get("unit"):
                    units.append({"unit": {"name": ing.get("unit", "")}})

                ing_entry: Dict[str, Any] = {
                    "quantity": ing.get("quantity") if isinstance(ing, dict) else None,
                    "multiply_factor": 1,
                    "product": {"name": prod_name},
                    "ingredient_units": units,
                }
                if prod_cut:
                    ing_entry["cut"] = prod_cut
                if isinstance(ing, dict) and ing.get("title"):
                    ing_entry["title"] = ing["title"]

                content_ingredients.append(ing_entry)

            # ---------------- SEGMENTS ----------------
            content_segments: List[Dict[str, Any]] = []
            pos = 1
            for step in steps_block.get("steps", []):
                if isinstance(step, dict) and "title" in step and "items" in step:
                    for item in step["items"]:
                        content_segments.append(
                            {
                                "position": pos,
                                "segment": {
                                    "title": step["title"],
                                    "paragraph": item,
                                },
                            }
                        )
                        pos += 1
                else:
                    content_segments.append(
                        {
                            "position": pos,
                            "segment": {
                                "paragraph": step if isinstance(step, str) else str(step),
                            },
                        }
                    )
                    pos += 1

            # ---------------- CONTENT ----------------
            if content_ingredients or content_segments:
                publication["contents"].append(
                    {
                        "total_prep_time": metadata.get("prep_time", 0) or 0,
                        "servings": metadata.get("servings"),
                        "subtitle": gname,
                        "is_ingredient": ing_block.get("is_ingredient", False),
                        "content_ingredients": content_ingredients,
                        "content_segments": content_segments,
                    }
                )

        payload["payload"]["1"] = publication
        return payload
