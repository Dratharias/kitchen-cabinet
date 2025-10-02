from __future__ import annotations
from typing import Any, Dict, List
import copy
import difflib

class GroupAligner:
    """
    Aligne les groupes d'ingrédients et de steps et choisit les titres les plus pertinents.
    """

    def align(self, ingredients: List[Dict[str, Any]], steps: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        ing_groups = [g["group"] for g in ingredients]
        step_groups = [g["group"] for g in steps]

        aligned_steps: List[Dict[str, Any]] = []
        aligned_ingredients: List[Dict[str, Any]] = []
        used_ing = set()

        for s in steps:
            sname = s["group"]
            match = difflib.get_close_matches(sname, ing_groups, n=1, cutoff=0.5)
            if match:
                ing_name = match[0]
                new_group_name = ing_name
                used_ing.add(ing_name)
            else:
                new_group_name = sname

            aligned_steps.append({
                "group": new_group_name,
                "steps": copy.deepcopy(s["steps"])
            })

        for ing in ingredients:
            iname = ing["group"]
            if iname in used_ing:
                new_group_name = iname
            else:
                match = difflib.get_close_matches(iname, step_groups, n=1, cutoff=0.5)
                if match:
                    step_name = match[0]
                    new_group_name = iname
                else:
                    new_group_name = iname

            aligned_ingredients.append({
                "group": new_group_name,
                "ingredients": copy.deepcopy(ing.get("ingredients", [])),
                "is_ingredient": ing.get("is_ingredient", False),
                "subtitle": ing.get("subtitle"),
            })

        return self._refine_group_titles({"ingredients": aligned_ingredients, "steps": aligned_steps}, groups)

    def _refine_group_titles(self, aligned: Dict[str, List[Dict[str, Any]]], groups: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Après alignement, choisir le titre le plus court et pertinent en se basant sur 01_groups.json.
        """
        canonical_names = [g["group"] for g in groups]

        def pick_best(name: str) -> str:
            matches = difflib.get_close_matches(name, canonical_names, n=3, cutoff=0.5)
            if matches:
                return min(matches, key=len)
            return name

        for block in aligned["steps"]:
            block["group"] = pick_best(block["group"])
        for block in aligned["ingredients"]:
            block["group"] = pick_best(block["group"])

        return aligned
