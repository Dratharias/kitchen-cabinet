from __future__ import annotations
from typing import Any, Dict, List
import copy
import difflib

class GroupAligner:
    """
    Aligne les groupes d'ingrédients et de steps.
    - Si un alignement parfait existe (chaque groupe a ingrédients + steps) → garder.
    - Sinon → tout fusionner dans un seul bloc avec le titre de la recette.
    """

    def align(self, ingredients, steps, groups):
        ing_groups = [g["group"] for g in ingredients]
        step_groups = [g["group"] for g in steps]

        aligned_steps = []
        aligned_ingredients = []
        used_ing = set()

        for s in steps:
            sname = s["group"]
            match = difflib.get_close_matches(sname, ing_groups, n=1, cutoff=0.5)
            new_group_name = match[0] if match else sname
            used_ing.add(new_group_name)
            aligned_steps.append({"group": new_group_name, "steps": copy.deepcopy(s["steps"])})

        for ing in ingredients:
            iname = ing["group"]
            if iname in used_ing:
                new_group_name = iname
            else:
                match = difflib.get_close_matches(iname, step_groups, n=1, cutoff=0.5)
                new_group_name = match[0] if match else iname
            aligned_ingredients.append({
                "group": new_group_name,
                "ingredients": copy.deepcopy(ing.get("ingredients", [])),
                "is_ingredient": ing.get("is_ingredient", False),
                "subtitle": ing.get("subtitle"),
            })

        aligned = self._refine_group_titles(
            {"ingredients": aligned_ingredients, "steps": aligned_steps},
            groups
        )

        # --- Vérif complétude ---
        ing_names = {g["group"] for g in aligned["ingredients"] if g.get("ingredients")}
        step_names = {g["group"] for g in aligned["steps"] if g.get("steps")}
        perfect = ing_names and step_names and (ing_names == step_names)

        if not perfect:
            default_title = groups[0]["group"] if groups else "Recette"
            merged_block = {
                "group": default_title,
                "ingredients": [],
                "steps": []
            }

            # On conserve les sous-titres d'origine comme titres internes
            for ing in ingredients:
                if ing.get("ingredients"):
                    merged_block["ingredients"].append({
                        "title": ing["group"],
                        "items": ing["ingredients"]
                    })
            for st in steps:
                if st.get("steps"):
                    merged_block["steps"].append({
                        "title": st["group"],
                        "items": st["steps"]
                    })

            aligned = {
                "ingredients": [{
                    "group": default_title,
                    "ingredients": merged_block["ingredients"],
                    "is_ingredient": True,
                    "subtitle": default_title
                }],
                "steps": [{
                    "group": default_title,
                    "steps": merged_block["steps"]
                }]
            }

        return aligned

    def _refine_group_titles(self, aligned: Dict[str, List[Dict[str, Any]]], groups: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
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