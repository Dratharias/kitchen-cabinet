from __future__ import annotations
from typing import Any, Dict, List
import json
import re
import unicodedata
from ..mistral_client import MistralClient
from ..utils.group_matcher import best_match

# --- Helpers JSON ---

MOJIBAKE_FIXES = {
    "√©": "é",
    "√¨": "è",
    "√®": "ê",
    "√¢": "â",
    "√´": "ô",
    "√º": "ù",
    "√ª": "à",
    "√±": "ç",
}

def fix_mojibake(text: str) -> str:
    if not text:
        return text
    out = str(text)
    for bad, good in MOJIBAKE_FIXES.items():
        out = out.replace(bad, good)
    return unicodedata.normalize("NFC", out)

def coerce_json(s: str) -> dict:
    text = s.strip()
    if "{" in text and "}" in text:
        text = text[text.find("{"): text.rfind("}") + 1]
    text = re.sub(r'([{",])([A-Za-z_][A-Za-z0-9_]*)\s*:', r'\1"\2":', text)
    text = re.sub(r"'", '"', text)
    text = re.sub(r",\s*([}\]])", r"\1", text)
    text = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', text)
    return json.loads(text)

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

# --- Stage principal ---

class IngredientsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw = self._extract_raw(md_text, groups)
        mapped = self._map_to_canonical(raw, groups)
        enriched = self._enrich_ingredients(mapped)
        enriched = self._detect_ingredient_groups(enriched)
        return {"raw": raw, "mapped": mapped, "enriched": enriched}

    def _extract_raw(self, md_text: str, groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        items = self._read_array(md_text, "ingredients")
        raw_blocks = []
        current = None
        default_group = groups[0]["group"] if groups else "Default"

        for item in items:
            if item.strip().startswith("**"):
                if current:
                    raw_blocks.append(current)
                header = item.strip().lstrip("*").rstrip("*").strip()
                current = {"group": header, "ingredients": []}
            elif current is not None:
                current["ingredients"].append(item)
            else:
                if not current:
                    current = {"group": default_group, "ingredients": []}
                current["ingredients"].append(item)

        if current:
            raw_blocks.append(current)
        return raw_blocks

    def _map_to_canonical(self, raw: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        canonical_names = [g["group"] for g in groups]
        mapped = []
        for block in raw:
            canonical = best_match(block["group"], canonical_names, threshold=0.7)
            mapped.append({
                "group": canonical,
                "ingredients": block["ingredients"]
            })
        return mapped

    # --- Extraction en 3 passes ---
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
        except Exception as e:
            print(f"[ING-unit] Erreur: {e}")
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
        except Exception as e:
            print(f"[ING-qty] Erreur: {e}")
            return None

    def _extract_product(self, ing_str: str) -> str:
        ing_str = strip_accents(ing_str).replace("\u00a0", " ").strip()

        prompt = f"""
Extrait uniquement le produit alimentaire et ses qualificatifs de la ligne suivante.
- Ne répète pas la quantité ni l’unité dans le champ "product".
- Garde les mots comme "fruit", "tranche", "gousse" dans le produit.
- Retire seulement les préfixes "de", "d'", "du", "des", et "au gout".
- Garde les adjectifs (presse, rape, seche, filtre).
- Ne retourne que le produit, pas la quantité ni l’unité.

Ligne: "{ing_str}"

Réponds uniquement en JSON: {{ "product": "..." }}
"""
        try:
            result = self.client.generate_json(prompt)
            product = result.get("product", "")
        except Exception as e:
            print(f"[ING-prod] Erreur: {e}")
            product = ing_str.strip()

        return clean_product(product)

    def _fix_product_text(self, product: str) -> str:
        if not product:
            return product
        return fix_mojibake(product)

    def _enrich_ingredients(self, mapped: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        enriched = []
        for block in mapped:
            enriched_block = {"group": block["group"], "ingredients": []}
            for ing_str in block["ingredients"]:
                if ing_str.strip().startswith("**"):
                    continue

                unit = self._extract_unit(ing_str)
                qty = self._extract_quantity(ing_str)
                product = self._extract_product(ing_str)
                product = self._fix_product_text(product)

                enriched_block["ingredients"].append({
                    "quantity": qty,
                    "unit": unit,
                    "product": product
                })
            enriched.append(enriched_block)
        return enriched

    def _detect_ingredient_groups(self, enriched: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        all_products = set()
        for block in enriched:
            for ing in block["ingredients"]:
                product = self._normalize(ing.get("product", ""))
                if product:
                    all_products.add(product)

        for block in enriched:
            gname = block["group"]
            gnorm = self._normalize(gname)

            match = best_match(gnorm, list(all_products), threshold=0.7)

            is_ing = False
            if match and match != gnorm:
                is_ing = True
            else:
                for p in all_products:
                    if gnorm in p:
                        is_ing = True
                        break

            block["is_ingredient"] = is_ing
            block["subtitle"] = block["group"] if is_ing else None
        return enriched

    @staticmethod
    def _normalize(text: str) -> str:
        if not isinstance(text, str):
            text = str(text) if text else ""
        t = text.lower().strip()
        t = unicodedata.normalize("NFKD", t)
        t = "".join(c for c in t if not unicodedata.combining(c))
        t = re.sub(r"[^a-z0-9]+", "", t)
        return t

    def _read_array(self, md_text: str, key: str) -> List[str]:
        lines = md_text.splitlines()
        capture = False
        buf = []

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
