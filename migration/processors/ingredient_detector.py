from __future__ import annotations
from typing import Any, Dict, List, Tuple
import re
import unicodedata

class IngredientDetector:
    def __init__(self):
        pass

    @staticmethod
    def _strip_accents(s: str) -> str:
        return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

    @classmethod
    def _key_tokens(cls, text: str) -> Tuple[str, Tuple[str, ...]]:
        t = cls._strip_accents(text.lower())
        t = t.replace('/', ' ')
        t = re.sub(r"[^a-z0-9]+", " ", t)
        toks = tuple(tok for tok in t.split() if len(tok) >= 2 and tok not in {"ou","et","de","du","des","la","le","les","aux"})
        return " ".join(toks), toks

    def _deduplicate_semantic_groups(self, groups: List[str]) -> Dict[str, str]:
        key_to_groups: Dict[str, List[str]] = {}
        for g in groups:
            key, toks = self._key_tokens(g)
            key_to_groups.setdefault(key, []).append(g)

        canonical: Dict[str, str] = {}
        for key, group_list in key_to_groups.items():
            if len(group_list) == 1:
                canonical[group_list[0]] = group_list[0]
            else:
                chosen = max(group_list, key=len)
                print(f"[DETECTOR][DEDUP] Fusion: {group_list} → '{chosen}'")
                for g in group_list:
                    canonical[g] = chosen
        return canonical

    def detect(self, ingredients: List[Dict[str, Any]], steps: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Fusionne ingrédients et steps en une seule liste [{group, ingredients, steps}].
        Important : les données de produits et d'unités sont laissées inchangées, aucune normalisation.
        """
        group_names = [g["group"] for g in groups]
        canonical_map = self._deduplicate_semantic_groups(group_names)

        grouped: Dict[str, Dict[str, Any]] = {canonical_map[g]: {"group": canonical_map[g], "ingredients": [], "steps": []} for g in group_names}

        # assign ingrédients sans toucher aux champs product/unit
        for ing in ingredients:
            g = ing.get("group")
            if not g:
                continue
            canon = canonical_map.get(g, g)
            grouped.setdefault(canon, {"group": canon, "ingredients": [], "steps": []})
            grouped[canon]["ingredients"].append(ing)

        # assign steps
        for st in steps:
            g = st.get("group")
            if not g:
                continue
            canon = canonical_map.get(g, g)
            grouped.setdefault(canon, {"group": canon, "ingredients": [], "steps": []})
            grouped[canon]["steps"].extend(st.get("steps", []))

        print(f"[DETECTOR] Ingrédients groupés: {len(ingredients)}/{len(grouped)}")
        print(f"[DETECTOR] Steps groupés: {len(steps)}/{len(grouped)}")

        return list(grouped.values())
