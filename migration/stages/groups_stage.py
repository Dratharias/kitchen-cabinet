from __future__ import annotations
from typing import Any, Dict, List
import json
import re
from ..mistral_client import MistralClient

class GroupsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, default_title: str) -> List[Dict[str, Any]]:
        raw_groups = self._extract_groups(md_text, default_title)
        canonical_groups = self._format_groups(raw_groups)
        return canonical_groups

    def _extract_groups(self, md_text: str, default_title: str) -> List[str]:
        groups = []
        
        for key in ("ingredients", "steps"):
            items = self._read_array(md_text, key)
            for item in items:
                if item.strip().startswith("**"):
                    name = item.strip().lstrip("*").rstrip("*").strip()
                    if name and name not in groups:
                        groups.append(name)
        
        if not groups:
            groups = [default_title]
        elif default_title not in groups:
            groups.insert(0, default_title)
        
        return groups

    def _format_groups(self, groups: List[str]) -> List[Dict[str, Any]]:
        formatted = []
        for g in groups:
            prompt = f"Reformule ce nom en maximum 4 mots: {g}\nRéponds UNIQUEMENT avec le nom, sans phrase complète."
            try:
                canonical = self.client.generate(prompt).strip().strip('"')
            except Exception as e:
                print(f"[GROUPS] Erreur format: {e}")
                canonical = g
            
            prompt_classify = f"Ce groupe '{canonical}' est-il une recette complète ou un composant?\nRéponds: {{\"is_new_recipe\": true}} si recette complète, {{\"is_new_recipe\": false}} si composant/ingrédient"
            try:
                result = self.client.generate_json(prompt_classify)
                is_recipe = result.get("is_new_recipe", True)
            except Exception as e:
                print(f"[GROUPS] Erreur classify: {e}")
                is_recipe = True
            
            formatted.append({
                "group": canonical,
                "is_new_recipe": is_recipe
            })
        
        return formatted

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