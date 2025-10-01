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
            "type": {"data": {"str_value": metadata.get("type", "Recette"), "type": "Type"}},
            "style": {"data": {"str_value": metadata.get("style", ""), "type": "Style"}} if metadata.get("style") else None,
            "author": {"data": {"str_value": metadata.get("author", ""), "type": "Author"}} if metadata.get("author") else None,
            "tags": [{"data": {"str_value": t, "type": "Tag"}} for t in metadata.get("tags", [])],
            "contents": []
        }
        
        ing_by_group = {b["group"]: b for b in ingredients}
        steps_by_group = {b["group"]: b for b in steps}
        
        for group in groups:
            gname = group["group"]
            ing_block = ing_by_group.get(gname, {})
            steps_block = steps_by_group.get(gname, {})
            
            content_ingredients = []
            for ing in ing_block.get("ingredients", []):
                if not ing.get("product"):
                    continue
                
                content_ingredients.append({
                    "data": {
                        "quantity": ing.get("quantity"),
                        "multiply_factor": 1,
                        "title": gname
                    },
                    "product": {"data": {"name": ing.get("product", "")}},
                    "ingredient_units": [{"unit": {"data": {"name": ing.get("unit", "")}}}]
                })
            
            content_segments = []
            for pos, step in enumerate(steps_block.get("steps", []), 1):
                content_segments.append({
                    "position": pos,
                    "segment": {
                        "data": {
                            "title": gname,
                            "paragraph": step
                        }
                    }
                })
            
            # Skip groups with no ingredients AND no steps
            if not content_ingredients and not content_segments:
                continue
            
            publication["contents"].append({
                "data": {
                    "total_prep_time": metadata.get("prep_time", 0) or 0,
                    "servings": metadata.get("servings"),
                    "subtitle": ing_block.get("subtitle"),
                    "is_ingredient": ing_block.get("is_ingredient", False)
                },
                "content_ingredients": content_ingredients,
                "content_segments": content_segments
            })
        payload["payload"]["1"] = publication
        return payload