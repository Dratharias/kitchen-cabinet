from __future__ import annotations
from typing import Any, Dict, List
import json
import re
import unicodedata
import difflib
from ..mistral_client import MistralClient
from ..utils.group_matcher import best_match, normalize, standardize_group

# --- Helpers texte ---

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

# --- Stage principal ---

class IngredientsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Lit UNIQUEMENT la métadonnée `ingredients` et découpe les sous-groupes `**Titre`.
        Retourne des blocs par groupe, prêts pour PayloadStage.
        """
        raw_blocks = self._extract_grouped(md_text, groups)
        mapped = self._map_to_canonical(raw_blocks, groups)
        enriched = self._enrich_ingredients(mapped)
        enriched = self._detect_ingredient_groups(enriched)
        return {"raw": raw_blocks, "mapped": mapped, "enriched": enriched}

    # --- Extraction groupée ---
    def _extract_grouped(self, md_text: str, groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        items = self._read_metadata_array(md_text, "ingredients")
        raw_blocks: List[Dict[str, Any]] = []
        current: Dict[str, Any] | None = None
        default_group = groups[0]["group"] if groups else "Default"

        for item in items:
            s = str(item).strip()
            if s.startswith("**"):
                # nouveau sous-groupe
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

    # --- Mapping ---
    def _map_to_canonical(self, raw: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        canonical_names = [g["group"] for g in groups]
        mapped: List[Dict[str, Any]] = []
        for block in raw:
            if canonical_names:
                # d’abord matcher normalement
                canonical = best_match(block["group"], canonical_names, threshold=0.7)
                if canonical == block["group"]:
                    # fallback plus permissif: comparaison lower/normalize
                    bn = normalize(block["group"])
                    for cand in canonical_names:
                        if normalize(cand) in bn or bn in normalize(cand):
                            canonical = cand
                            break
            else:
                canonical = block["group"]
            mapped.append({"group": canonical, "ingredients": block["ingredients"]})
        return mapped

    # --- Enrichissement ---
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

    # --- Détection groupe ingredient par CROSS-MATCH ---
    def _detect_ingredient_groups(self, enriched: List[Dict[str, Any]], threshold: float = 0.85) -> List[Dict[str, Any]]:
        # Produits normalisés par groupe
        per_group_products: List[List[str]] = []
        for block in enriched:
            prods = [_norm(ing.get("product")) for ing in block.get("ingredients", []) if ing.get("product")]
            per_group_products.append([p for p in prods if p])

        for i, block in enumerate(enriched):
            gnorm = _norm(block.get("group"))
            other_products = {p for j, prods in enumerate(per_group_products) if j != i for p in prods}

            is_ing = False
            if gnorm and other_products:
                # similarité ou inclusion
                for p in other_products:
                    if not p:
                        continue
                    if gnorm in p or p in gnorm:
                        is_ing = True
                        break
                    if difflib.SequenceMatcher(None, gnorm, p).ratio() >= threshold:
                        is_ing = True
                        break

            block["is_ingredient"] = bool(is_ing)
            block["subtitle"] = block["group"] if is_ing else None
        return enriched

    # --- Extraction AI ---
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

    # --- Lecture de la métadonnée ingredients ---
    def _read_metadata_array(self, md_text: str, key: str) -> List[str]:
        # Capture la valeur JSON-like sur une seule ou plusieurs lignes
        pattern = re.compile(rf"^{key}:\s*\[(.*?)\]", re.IGNORECASE | re.MULTILINE | re.DOTALL)
        m = pattern.search(md_text)
        if not m:
            return []
        inner = m.group(1)
        try:
            arr = json.loads("[" + inner + "]")
            return [str(v) for v in arr]
        except Exception:
            return re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)
