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

def strip_accents(text: str) -> str:
    if not text:
        return text
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))

def clean_product(product: str) -> str:
    product = product.strip()
    product = re.sub(r"^\d+[.,]?\d*\s*\w*\s+", "", product)
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
    """Match strict proposé:
    - Tokenise et retire stopwords.
    - Ne garde que les tokens de longueur >= 3.
    - Chaque token du groupe doit trouver dans le produit un token à distance d'édition <= 1.
    """
    if not group_name or not product:
        return False

    def lev_dist_leq1(a: str, b: str) -> bool:
        # optimisation pour seuil 1
        if a == b:
            return True
        if abs(len(a) - len(b)) > 1:
            return False
        # substitution
        if len(a) == len(b):
            diff = sum(1 for x, y in zip(a, b) if x != y)
            return diff <= 1
        # insertion/suppression
        # garantir a la plus longue
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
                i += 1  # sauter un char dans la plus longue
        # si il reste un char en plus
        diff += (len(a) - i)
        return diff <= 1

    gt_all = _tokens(group_name)
    pt_all = _tokens(product)

    # garder tokens pertinents
    gt = [t for t in gt_all if len(t) >= 3]
    pt = [t for t in pt_all if len(t) >= 3]

    if not gt or not pt:
        return False

    # chaque token du groupe doit être couvert par un token produit avec dist <=1
    for g in gt:
        matched = False
        for p in pt:
            if lev_dist_leq1(g, p):
                matched = True
                break
        if not matched:
            return False
    return True
    gnorm = _norm(group_name)
    pnorm = _norm(product)
    if difflib.SequenceMatcher(None, gnorm, pnorm).ratio() >= 0.72:
        return True
    gt = set(_tokens(group_name))
    pt = set(_tokens(product))
    if not gt or not pt:
        return False
    inter = gt & pt
    union = gt | pt
    # garde-fou: éviter faux positifs si un seul mot commun pour un groupe multi-mots
    if len(inter) == 1 and len(gt) > 2:
        return False
    jaccard = len(inter) / len(union)
    if jaccard >= 0.45:
        return True
    if len(inter) >= max(1, int(0.6 * len(gt))):
        return True
    return False

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
                current["ingredients"].append(item)
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
                unit = self._extract_unit(ing_str)
                qty = self._extract_quantity(ing_str)
                product = self._extract_product(ing_str)
                out_block["ingredients"].append({
                    "quantity": qty,
                    "unit": unit,
                    "product": product,
                })
            enriched.append(out_block)
        return enriched

    def _classify_ingredient_groups(self, enriched: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        per_group_products: List[List[str]] = []
        for block in enriched:
            prods = [str(ing.get("product") or "") for ing in block.get("ingredients", [])]
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
        prompt = f"""
Extrait uniquement l'unité de mesure SI ou culinaire de la ligne suivante.
Si aucune unité standard n’est trouvée, retourne null.

Ligne: "{ing_str}"

Réponds uniquement en JSON: {{ "unit": "..." }} ou {{ "unit": null }}
"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("unit") or ""
        except Exception:
            return ""

    def _extract_quantity(self, ing_str: str) -> float | None:
        prompt = f"""
Extrait uniquement la quantité minimale de la ligne suivante.
- Si c'est une fraction (ex: 1/8), calcule la valeur décimale.
- Si c'est une plage (10-15 ou 80 à 100), prends la valeur min.
- Si aucune quantité n’est trouvée, retourne null.

Ligne: "{ing_str}"

Réponds uniquement en JSON: {{ "quantity": nombre|null }}
"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("quantity")
        except Exception:
            return None

    def _extract_product(self, ing_str: str) -> str:
        s = strip_accents(str(ing_str)).replace("\u00a0", " ").strip()
        prompt = f"""
Extrait uniquement le produit alimentaire et ses qualificatifs de la ligne suivante.
- Ne répète pas la quantité ni l’unité dans le champ "product".
- Garde les mots comme "fruit", "tranche", "gousse" dans le produit.
- Retire seulement les préfixes "de", "d'", "du", "des", et "au gout".
- Garde les adjectifs (presse, rape, seche, filtre).
- Ne retourne que le produit, pas la quantité ni l’unité.

Ligne: "{s}"

Réponds uniquement en JSON: {{ "product": "..." }}
"""
        try:
            result = self.client.generate_json(prompt)
            product = result.get("product", "")
        except Exception:
            product = s
        return clean_product(product)

    def _read_metadata_array(self, md_text: str, key: str) -> List[str]:
        lines = md_text.splitlines()
        capture = False
        buf: List[str] = []
        for line in lines:
            low = line.strip().lower()
            if not capture and low.startswith(f"{key}:"):
                capture = True
                buf.append(line.split(':', 1)[1])
                continue
            if capture:
                buf.append(line)
                raw = " ".join(buf)
                if '[' in raw and ']' in raw:
                    break
        raw = " ".join(buf)
        if '[' not in raw or ']' not in raw:
            return []
        inner = raw.split('[', 1)[1].rsplit(']', 1)[0]
        try:
            arr = json.loads('[' + inner + ']')
            return [str(v) for v in arr]
        except Exception:
            return re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)
