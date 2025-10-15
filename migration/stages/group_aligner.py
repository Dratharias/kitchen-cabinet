from __future__ import annotations
from typing import Any, Dict, List, Tuple
import copy
import difflib
import re
from ..utils.group_matcher import normalize_root

VARIANT_RE = re.compile(r"\b(maison|pro)\b", re.I)
AGG_RE = re.compile(r"versions?.*maison.*pro", re.I)

def _variant(name: str) -> str | None:
    m = VARIANT_RE.search(name or "")
    return m.group(1).capitalize() if m else None

def _is_aggregator(name: str) -> bool:
    return bool(AGG_RE.search(name or ""))

class GroupAligner:
    def align(self, ingredients: List[Dict[str, Any]], steps: List[Dict[str, Any]], groups: List[Dict[str, Any]]):
        ing_names = [i["group"] for i in ingredients]
        step_names = [s["group"] for s in steps]

        def score_pair(ing: str, step: str) -> float:
            name_ratio = difflib.SequenceMatcher(None, ing.lower(), step.lower()).ratio()
            root_ratio = difflib.SequenceMatcher(None, normalize_root(ing), normalize_root(step)).ratio()
            same_variant = _variant(ing) == _variant(step)
            if same_variant: name_ratio += 0.1
            return 0.6 * name_ratio + 0.4 * root_ratio

        # --- Construire toutes les paires (ing, step, score)
        pairs: List[Tuple[int, int, float]] = []
        for i, ing in enumerate(ingredients):
            if _is_aggregator(ing["group"]):  # ignorer agrégateurs directs
                continue
            for j, st in enumerate(steps):
                if _is_aggregator(st["group"]):
                    continue
                sc = score_pair(ing["group"], st["group"])
                if sc >= 0.45:  # ignorer matches faibles
                    pairs.append((i, j, sc))

        # --- Trier les paires par score décroissant
        pairs.sort(key=lambda x: x[2], reverse=True)

        matched_ing, matched_step = set(), set()
        links: List[Tuple[int, int, float]] = []

        # --- Appariement exclusif : un seul match par groupe
        for i, j, sc in pairs:
            if i not in matched_ing and j not in matched_step:
                links.append((i, j, sc))
                matched_ing.add(i)
                matched_step.add(j)

        # --- Construire les blocs alignés
        aligned_ingredients, aligned_steps = [], []
        for (i, j, sc) in links:
            ing = copy.deepcopy(ingredients[i])
            st = copy.deepcopy(steps[j])
            name = ing["group"]
            # si variante cohérente -> garde nom du step plus précis
            if _variant(st["group"]) == _variant(name):
                name = st["group"]
            aligned_ingredients.append({
                "group": name,
                "ingredients": ing.get("ingredients", []),
                "is_ingredient": ing.get("is_ingredient", False),
                "subtitle": ing.get("subtitle"),
                "score": round(sc, 3),
            })
            aligned_steps.append({"group": name, "steps": st.get("steps", []), "score": round(sc, 3)})

        # --- Grouper les orphelins
        orphans_ing = [i for k, i in enumerate(ingredients) if k not in matched_ing and not _is_aggregator(i["group"])]
        orphans_step = [s for k, s in enumerate(steps) if k not in matched_step and not _is_aggregator(s["group"])]

        if orphans_ing or orphans_step:
            default_title = groups[0]["group"] if groups else "Recette"
            merged_ing = {
                "group": default_title,
                "ingredients": [{"title": o["group"], "items": o.get("ingredients", [])} for o in orphans_ing],
                "is_ingredient": True,
                "subtitle": default_title,
                "score": 0.0,
            }
            merged_step = {
                "group": default_title,
                "steps": [{"title": o["group"], "items": o.get("steps", [])} for o in orphans_step],
                "score": 0.0,
            }
            aligned_ingredients.append(merged_ing)
            aligned_steps.append(merged_step)

        # --- Nettoyage final : suppression du champ interne "score"
        for arr in (aligned_ingredients, aligned_steps):
            for b in arr:
                b.pop("score", None)

        return {"ingredients": aligned_ingredients, "steps": aligned_steps}
