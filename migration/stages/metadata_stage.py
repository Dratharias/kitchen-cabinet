from __future__ import annotations
from typing import Any, Dict
import re
import json
from ..mistral_client import MistralClient

class MetadataStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str) -> Dict[str, Any]:
        meta = self._extract_raw(md_text)
        meta = self._enrich_prep_servings(meta)
        meta = self._normalize_title(meta)
        meta = self._normalize_description(meta)
        return meta

    def _extract_raw(self, md_text: str) -> Dict[str, Any]:
        lines = [l.strip() for l in md_text.splitlines() if l.strip()]
        meta = {
            "title": "Untitled",
            "tags": [],
            "description": [],
            "notes": [],
            "thumbnail": "",
            "type": "Recette",
            "style": None,
            "author": None,
            "public": True,
            "published": True,
        }

        capture_key = None
        for line in lines:
            m = re.match(r"^(title|tags|description|notes|thumbnail):\s*(.*)$", line, re.IGNORECASE)
            if m:
                key, rest = m.group(1).lower(), m.group(2)
                capture_key = key

                if key == "tags":
                    meta["tags"] = self._parse_value(rest)
                elif key == "description":
                    meta["description"] = self._parse_value(rest)
                elif key == "notes":
                    val = self._parse_value(rest)
                    meta["notes"] = val if isinstance(val, list) else [val] if val else []
                elif key == "thumbnail":
                    meta["thumbnail"] = rest.strip()
                elif key == "title":
                    meta["title"] = rest.strip() or "Untitled"
                continue

            if capture_key in ("description", "notes"):
                if re.match(r"^(ingredients:|steps:|tags:|title:|thumbnail:)", line, re.IGNORECASE):
                    capture_key = None
                    continue

                if line.startswith("-") or line.startswith("*"):
                    val = line.lstrip("-* ").strip()
                    meta[capture_key].append(val)
                elif not re.match(r"^[a-z_]+:", line, re.IGNORECASE):
                    if meta[capture_key]:
                        meta[capture_key][-1] += " " + line

        return meta

    def _enrich_prep_servings(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        context = {
            "title": meta["title"],
            "description": meta["description"],
            "notes": meta["notes"]
        }
        prompt = f"""Extrait uniquement temps de préparation (en minutes) et nombre de portions.
Input: {json.dumps(context, ensure_ascii=False)}
Format: {{"prep_time": number|null, "servings": number|null}}"""
        
        try:
            result = self.client.generate_json(prompt)
            meta["prep_time"] = result.get("prep_time")
            meta["servings"] = result.get("servings")
        except Exception as e:
            print(f"[META] Erreur prep/servings: {e}")
            meta["prep_time"] = None
            meta["servings"] = None
        
        return meta

    def _normalize_title(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        prompt = f"Nettoie uniquement la mise en forme de ce titre (supprime markdown, espaces inutiles, parenthèses): {meta['title']}\nRéponds UNIQUEMENT avec le titre nettoyé, sans le reformuler."
        try:
            meta["title"] = self.client.generate(prompt).strip().strip('"')
        except Exception as e:
            print(f"[META] Erreur titre: {e}")
        return meta

    def _normalize_description(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        context = {
            "title": meta["title"],
            "description": meta["description"],
            "notes": meta["notes"]
        }
        prompt = f"""Écris UNE phrase vendeuse décrivant ce plat.
Input: {json.dumps(context, ensure_ascii=False)}"""
        
        try:
            new_desc = self.client.generate(prompt).strip().strip('"')
            meta["description"] = [new_desc]
        except Exception as e:
            print(f"[META] Erreur description: {e}")
        
        return meta

    @staticmethod
    def _parse_value(raw: str) -> Any:
        raw = raw.strip()
        if not raw:
            return []
        if raw.startswith("[") and raw.endswith("]"):
            try:
                val = json.loads(raw)
                if isinstance(val, list):
                    return [str(v).strip() for v in val if v]
            except json.JSONDecodeError:
                pass
            inner = raw[1:-1].strip()
            if not inner:
                return []
            parts = [p.strip(' "\'') for p in inner.split(",") if p.strip()]
            return parts
        return raw.strip(' "\'')