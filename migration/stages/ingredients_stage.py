from __future__ import annotations
from typing import Any, Dict, List
import json
import re
import unicodedata
import copy
from rapidfuzz import fuzz
from ..mistral_client import MistralClient
from ..utils.group_matcher import best_match, standardize_group

STOPWORDS_FR = {
    "de","du","des","d","au","aux","la","le","les","et","ou",
    "a","à","en","avec","sans","maison","pro"
}
UNIT_WORDS = {
    "gousse","paquet","sachet","pincée","tranche","feuille","botte",
    "cuil.","cuil","cuil. à soupe","cuil. à thé",
    "cuillère","cuillère à soupe","cuillère à thé",
    "tbsp","tbs","tablespoon","tsp","teaspoon",
    "tasse","cup","cups","litre","litres","l","ml",
    "g","gramme","grammes","kg","kilogramme","kilogrammes",
    "oz","ounce","ounces","lb","lbs","pound","pounds"
}
CUT_WORDS = {
    "haché","hache","émincé","emince","ciselé","cisele",
    "concassé","concasse","râpé","rape","coupé","coupe",
    "tranché","tranche","effiloché","effiloche","découpé",
    "decoupe","taillé","taille","en dés","dés","en rondelles",
    "rondelles","julienne","lamelles","brunoise","écrasé",
    "ecrase","pressé","presse","séché","seche","grillé","grille"
}


def strip_accents(text: str) -> str:
    if not text:
        return text
    text = unicodedata.normalize("NFKD", text)
    return "".join(c for c in text if not unicodedata.combining(c))


def clean_product(product: str) -> str:
    product = product.strip()
    product = re.sub(r"^\d+[.,]?\d*\s*\w*\s+", "", product)
    product = re.sub(r"\([^)]*\)", "", product)
    product = strip_accents(product)
    return product.strip()


def clean_legacy_links(s: str) -> str:
    if not isinstance(s, str):
        return s
    if "]_:_[" in s and "[" in s:
        try:
            left = s.index("[") + 1
            right = s.index("]_:_[", left)
            return s[left:right].strip()
        except ValueError:
            return s
    return s.strip()


class IngredientsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    # ---------------- MAIN PIPELINE ----------------
    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw_items = self._read_metadata_array(md_text, "ingredients")
        raw_blocks = self._group_from_raw(raw_items, groups)
        mapped = self._map_to_canonical(raw_blocks, groups)
        enriched = self._enrich_ingredients(mapped)
        classified = self.classify_from_mapped(mapped)
        return {
            "raw": raw_items,
            "mapped": mapped,
            "enriched": enriched,
            "classified": classified,
        }

    # ---------------- I/O PARSING ----------------
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
            return [clean_legacy_links(re.sub(r"\([^)]*\)", "", str(v)).strip()) for v in arr]
        except Exception:
            matches = re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)
            return [clean_legacy_links(re.sub(r"\([^)]*\)", "", m).strip()) for m in matches]

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

    # ---------------- ENRICHMENT ----------------
    def _enrich_ingredients(self, mapped: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        enriched: List[Dict[str, Any]] = []
        for block in mapped:
            out_block = {"group": block["group"], "ingredients": []}

            def parse_one(line: str, title: str | None = None) -> Dict[str, Any]:
                s = clean_legacy_links(re.sub(r"\([^)]*\)", "", line).strip())
                unit = self._extract_unit(s)
                qty = self._extract_quantity(s)
                product_info = self._extract_product(s, unit)
                item = {"quantity": qty, "unit": unit, "product": product_info}
                if title:
                    item["title"] = title
                return item

            for ing in block.get("ingredients", []):
                if isinstance(ing, dict) and "title" in ing and "items" in ing and isinstance(ing["items"], list):
                    t = str(ing.get("title") or "").strip() or None
                    for itm in ing["items"]:
                        out_block["ingredients"].append(parse_one(str(itm), t))
                elif isinstance(ing, dict):
                    name = ing.get("product", {}).get("name") if isinstance(ing.get("product"), dict) else None
                    line = name or ""
                    out_block["ingredients"].append(parse_one(line, ing.get("title")))
                else:
                    out_block["ingredients"].append(parse_one(str(ing)))

            enriched.append(out_block)
        return enriched

    # ---------------- CLASSIFICATION ----------------
    def classify_from_mapped(self, mapped: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        classified = []
        for block in mapped:
            gname = block["group"]
            flag = self._is_ingredient_group_from_raw(gname, mapped)
            classified.append({
                "group": gname,
                "ingredients": copy.deepcopy(block["ingredients"]),
                "is_ingredient": flag,
                "subtitle": gname if flag else None,
            })
        return classified

    def _is_ingredient_group_from_raw(self, group: str, all_blocks: List[Dict[str, Any]]) -> bool:
        """Détecte si le groupe est utilisé comme ingrédient ailleurs (tolérance légère)."""
        g_clean = strip_accents(group.lower()).strip()
        g_words = [w for w in re.findall(r"[a-z]+", g_clean) if w not in STOPWORDS_FR and len(w) > 2]
        if not g_words:
            return False

        for block in all_blocks:
            if strip_accents(block["group"].lower()) == g_clean:
                continue

            for ing in block.get("ingredients", []):
                raw_line = ing if isinstance(ing, str) else str(ing)
                raw_clean = strip_accents(raw_line.lower()).strip()
                i_words = [w for w in re.findall(r"[a-z]+", raw_clean) if len(w) > 2]

                # Comparaison floue mot à mot
                matches = 0
                for gw in g_words:
                    best = max((fuzz.ratio(gw, iw) for iw in i_words), default=0)
                    if best >= 78:  # tolérance fautes + pluriels
                        matches += 1

                coverage = matches / len(g_words)
                literal_match = g_clean in raw_clean

                # tolère si 70% des mots sont présents + match flou direct
                if (coverage >= 0.7 or literal_match) and not raw_clean.startswith(g_clean):
                    print(f"[DEBUG] '{group}' vs '{raw_line}' → coverage={coverage:.2f}")
                    return True
        return False




    # ---------------- AI HELPERS ----------------
    def _extract_unit(self, ing_str: str) -> str:
        s = clean_legacy_links(re.sub(r"\([^)]*\)", "", ing_str).strip())
        prompt = f"""\nExtrait uniquement l'unité de mesure SI ou culinaire de la ligne suivante.\nSi aucune unité standard n’est trouvée, retourne null.\n\nLigne: \"{s}\"\n\nRéponds uniquement en JSON: {{ "unit": "..." }} ou {{ "unit": null }}\n"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("unit") or ""
        except Exception:
            return ""

    def _extract_quantity(self, ing_str: str) -> float | None:
        s = clean_legacy_links(re.sub(r"\([^)]*\)", "", ing_str).strip())
        prompt = f"""\nExtrait uniquement la quantité minimale de la ligne suivante.\n- Si c'est une fraction (ex: 1/8), calcule la valeur décimale.\n- Si c'est une plage (10-15 ou 80 à 100), prends la valeur min.\n- Si aucune quantité n’est trouvée, retourne null.\n\nLigne: \"{s}\"\n\nRéponds uniquement en JSON: {{ "quantity": nombre|null }}\n"""
        try:
            result = self.client.generate_json(prompt)
            return result.get("quantity")
        except Exception:
            return None

    def _extract_product(self, ing_str: str, unit: str = "") -> Dict[str, Any]:
        s = clean_legacy_links(strip_accents(str(ing_str))).replace("\u00a0", " ").strip()
        s = re.sub(r"\([^)]*\)", "", s).strip()
        prompt = f"""\nAnalyse cette ligne d'ingrédient et sépare le produit et la coupe éventuelle.\n- Le champ name contient l'aliment de base (ail, carotte, oignon, etc.).\n- Le champ cut contient la préparation: {', '.join(sorted(CUT_WORDS))}.\n- Retire toute unité comme gousse, paquet, sachet, etc. du champ name.\n- Si aucune coupe n'est trouvée, cut = null.\n\nLigne: \"{s}\"\n\nRéponds uniquement en JSON: {{ "name": "...", "cut": "..."|null }}\n"""
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
                name = re.sub(rf"\b{u}\b", "", name, flags=re.I).strip()
        return {"name": name, "cut": cut}
