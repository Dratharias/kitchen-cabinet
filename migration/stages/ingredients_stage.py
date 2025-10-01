from __future__ import annotations
from typing import Any, Dict, List
import json
import re
from ..mistral_client import MistralClient

class IngredientsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw = self._extract_raw(md_text, groups)
        mapped = self._map_to_canonical(raw, groups)
        enriched = self._enrich_ingredients(mapped)
        enriched = self._detect_ingredient_groups(enriched)
        
        return {
            "raw": raw,
            "mapped": mapped,
            "enriched": enriched
        }

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
            prompt = f"Map ce groupe vers le plus proche, attention aux variantes pro et maison: {block['group']}\nOptions: {json.dumps(canonical_names, ensure_ascii=False)}\nFormat: {{\"mapped_group\": \"...\"}}"
            try:
                result = self.client.generate_json(prompt)
                canonical = result.get("mapped_group", block["group"])
            except Exception as e:
                print(f"[ING] Erreur map: {e}")
                canonical = block["group"]
            
            mapped.append({
                "group": canonical,
                "ingredients": block["ingredients"]
            })
        
        return mapped

    def _enrich_ingredients(self, mapped: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        enriched = []
        
        for block in mapped:
            enriched_block = {"group": block["group"], "ingredients": []}
            
            for ing_str in block["ingredients"]:
                if ing_str.strip().startswith("**"):
                    continue
                
                prompt = f"Parse: {ing_str}\nFormat: {{\"quantity\": number|null, \"unit\": \"...\", \"product\": \"...\"}}"
                try:
                    result = self.client.generate_json(prompt)
                    enriched_block["ingredients"].append({
                        "quantity": result.get("quantity"),
                        "unit": result.get("unit", ""),
                        "product": result.get("product", "")
                    })
                except Exception as e:
                    print(f"[ING] Erreur enrich: {e}")
                    enriched_block["ingredients"].append({
                        "quantity": None,
                        "unit": "",
                        "product": ing_str
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
            group_normalized = self._normalize(block["group"])
            block["is_ingredient"] = group_normalized in all_products
            block["subtitle"] = block["group"] if block["is_ingredient"] else None
        
        return enriched

    @staticmethod
    def _normalize(text: str) -> str:
        if not isinstance(text, str):
            text = str(text) if text else ""
        t = text.lower().strip()
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