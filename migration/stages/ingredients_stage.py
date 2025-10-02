from __future__ import annotations
from typing import Any, Dict, List
import json
import re
import unicodedata
import difflib
import copy
from ..mistral_client import MistralClient
from ..utils.group_matcher import best_match, standardize_group

STOPWORDS_FR = {
    "de","du","des","d","au","aux","la","le","les","et","ou","a","à","en","avec","sans",
    "maison","pro"
}

UNIT_WORDS = {
    "gousse", "paquet", "sachet", "pincée", "tranche", "feuille", "botte",
    "cuil.", "cuil", "cuil. à soupe", "cuil. à thé",
    "cuillère", "cuillère à soupe", "cuillère à thé",
    "tbsp", "tbs", "tablespoon", "tsp", "teaspoon",
    "tasse", "cup", "cups",
    "litre", "litres", "l", "ml",
    "g", "gramme", "grammes", "kg", "kilogramme", "kilogrammes",
    "oz", "ounce", "ounces", "lb", "lbs", "pound", "pounds"
}

CUT_WORDS = {
    "haché", "hache",
    "émincé", "emince",
    "ciselé", "cisele",
    "concassé", "concasse",
    "râpé", "rape",
    "coupé", "coupe",
    "tranché", "tranche",
    "effiloché", "effiloche",
    "découpé", "decoupe",
    "taillé", "taille",
    "en dés", "dés",
    "en rondelles", "rondelles",
    "julienne",
    "lamelles",
    "brunoise",
    "écrasé", "ecrase",
    "pressé", "presse",
    "séché", "seche",
    "grillé", "grille"
}

def strip_accents(text: str) -> str:
    if not text:
        return text
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))

def clean_product(product: str) -> str:
    product = product.strip()
    product = re.sub(r"^\d+[.,]?\d*\s*\w*\s+", "", product)
    product = re.sub(r"\([^)]*\)", "", product)  # retirer parenthèses
    product = strip_accents(product)
    return product.strip()

def _norm(text: str) -> str:
    if text is None:
        return ""
    t = unicodedata.normalize("NFKD", str(text)).lower()
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", "", t)
    return t

def _tokens(text: str) -> list[str]:
    if not text:
        return []
    t = unicodedata.normalize("NFKD", str(text).lower())
    t = "".join(c for c in t if not unicodedata.combining(c))
    t = re.sub(r"[^a-z0-9]+", " ", t)
    toks = [w for w in t.split() if w and w not in STOPWORDS_FR]
    toks = [re.sub(r"s$", "", w) for w in toks]
    return toks

def _product_group_match(group_name: str, product: str) -> bool:
    if not group_name or not product:
        return False

    def lev_dist_leq1(a: str, b: str) -> bool:
        if a == b:
            return True
        if abs(len(a) - len(b)) > 1:
            return False
        if len(a) == len(b):
            diff = sum(1 for x, y in zip(a, b) if x != y)
            return diff <= 1
        if len(a) < len(b):
            a, b = b, a
        i = j = diff = 0
        while i < len(a) and j < len(b):
            if a[i] == b[j]:
                i += 1; j += 1
            else:
                diff += 1
                if diff > 1:
                    return False
                i += 1
        diff += (len(a) - i)
        return diff <= 1

    gt_all = _tokens(group_name)
    pt_all = _tokens(product)
    gt = [t for t in gt_all if len(t) >= 3]
    pt = [t for t in pt_all if len(t) >= 3]

    if not gt or not pt:
        return False

    for g in gt:
        matched = False
        for p in pt:
            if lev_dist_leq1(g, p):
                matched = True
                break
        if not matched:
            return False
    return True

class IngredientsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw_items = self._read_metadata_array(md_text, "ingredients")
        raw_blocks = self._group_from_raw(raw_items, groups)
        mapped = self._map_to_canonical(raw_blocks, groups)
        enriched = self._enrich_ingredients(mapped)
        classified = self._classify_ingredient_groups(enriched)
        return {
            "raw": raw_items,
            "mapped": mapped,
            "enriched": enriched,
            "classified": classified,
        }

    def _group_from_raw(self, items: List[str], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raw_blocks: List[Dict[str, Any]] = []
        current: Dict[str, Any] | None = None
        default_group = groups[0]["group"] if groups else "Default"
        for item in items:
            s = str(item).strip()
            if s.startswith("**"):
                if current:
                    raw_blocks.append(current)
                header = s.lstrip("*").rstrip("*").strip()
                current = {"group": standardize_group(header), "ingredients": []}
            else:
                if current is None:
                    current = {"group": default_group, "ingredients": []}
                s = re.sub(r"\([^)]*\)", "", s).strip()  # retirer contenu entre parenthèses
                current["ingredients"].append(s)
        if current:
            raw_blocks.append(current)
        return raw_blocks

    def _map_to_canonical(self, raw: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        canonical_names = [g["group"] for g in groups]
        mapped: List[Dict[str, Any]] = []
        for block in raw:
            canonical = best_match(block["group"], canonical_names, threshold=0.7) if canonical_names else block["group"]
            mapped.append({"group": canonical, "ingredients": block["ingredients"]})
        return mapped

    def _enrich_ingredients(self, mapped: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        enriched: List[Dict[str, Any]] = []
        for block in mapped:
            out_block = {"group": block["group"], "ingredients": []}
            for ing_str in block["ingredients"]:
                ing_str = re.sub(r"\([^)]*\)", "", ing_str).strip()
                unit = self._extract_unit(ing_str)
                qty = self._extract_quantity(ing_str)
                product_info = self._extract_product(ing_str, unit)
                out_block["ingredients"].append({
                    "quantity": qty,
                    "unit": unit,
                    "product": product_info,
                })
            enriched.append(out_block)
        return enriched

    def _classify_ingredient_groups(self, enriched: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        per_group_products: List[List[str]] = []
        for block in enriched:
            prods = [str(ing.get("product", {}).get("name") or "") for ing in block.get("ingredients", [])]
            per_group_products.append([p for p in prods if p.strip()])
        classified: List[Dict[str, Any]] = []
        for i, block in enumerate(enriched):
            gname = block.get("group", "")
            other_products = [p for j, prods in enumerate(per_group_products) if j != i for p in prods]
            is_ing = any(_product_group_match(gname, p) for p in other_products)
            new_block = {
                "group": gname,
                "ingredients": copy.deepcopy(block.get("ingredients", [])),
                "is_ingredient": bool(is_ing),
                "subtitle": gname if is_ing else None,
            }
            classified.append(new_block)
        return classified

    def _extract_unit(self, ing_str: str) -> str:
        s = re.sub(r"\([^)]*\)", "", ing_str).strip()
        prompt = f"""
Extrait uniquement l'unité de mesure SI ou culinaire de la ligne suivante.
Si aucune unité standard n’est trouvée, retourne null.

Ligne: "{s}"

Réponds uniquement en JSON: {{ "unit": "..." }} ou {{ "unit": null }}
"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("unit") or ""
        except Exception:
            return ""

    def _extract_quantity(self, ing_str: str) -> float | None:
        s = re.sub(r"\([^)]*\)", "", ing_str).strip()
        prompt = f"""
Extrait uniquement la quantité minimale de la ligne suivante.
- Si c'est une fraction (ex: 1/8), calcule la valeur décimale.
- Si c'est une plage (10-15 ou 80 à 100), prends la valeur min.
- Si aucune quantité n’est trouvée, retourne null.

Ligne: "{s}"

Réponds uniquement en JSON: {{ "quantity": nombre|null }}
"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("quantity")
        except Exception:
            return None

    def _extract_product(self, ing_str: str, unit: str = "") -> Dict[str, Any]:
        s = strip_accents(str(ing_str)).replace("\u00a0", " ").strip()
        s = re.sub(r"\([^)]*\)", "", s).strip()
        prompt = f"""
Analyse cette ligne d'ingrédient et sépare le produit et la coupe éventuelle.
- Le champ name contient l'aliment de base (ail, carotte, oignon, etc.).
- Le champ cut contient la préparation: {', '.join(sorted(CUT_WORDS))}.
- Retire toute unité comme gousse, paquet, sachet, etc. du champ name.
- Si aucune coupe n'est trouvée, cut = null.

Ligne: "{s}"

Réponds uniquement en JSON: {{ "name": "...", "cut": "..."|null }}
"""
        try:
            result = self.client.generate_json(prompt)
            name = clean_product(result.get("name", ""))
            cut = result.get("cut")
        except Exception:
            name = clean_product(s)
            cut = None

        if unit and unit in name.lower():
            parts = [w for w in name.split() if w.lower() != unit.lower()]
            name = " ".join(parts)
        if any(u in name.lower() for u in UNIT_WORDS):
            for u in UNIT_WORDS:
                name = re.sub(rf"\\b{u}\\b", "", name, flags=re.I).strip()
        return {"name": name, "cut": cut}

    def _read_metadata_array(self, md_text: str, key: str) -> List[str]:
        lines = md_text.splitlines()
        capture = False
        buf: List[str] = []
        for line in lines:
            low = line.strip().lower()
            if not capture and low.startswith(f"{key}:"):
                capture = True
                buf.append(line.split(":", 1)[1])
                continue
            if capture:
                if low.startswith("steps:"):
                    break
                buf.append(line)
                if "]" in line:
                    break
        raw = " ".join(buf)
        if "[" not in raw or "]" not in raw:
            return []
        inner = raw.split("[", 1)[1].rsplit("]", 1)[0]
        try:
            arr = json.loads("[" + inner + "]")
            return [re.sub(r"\([^)]*\)", "", str(v)).strip() for v in arr]
        except Exception:
            matches = re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)
            return [re.sub(r"\([^)]*\)", "", m).strip() for m in matches]
