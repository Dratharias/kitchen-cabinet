from __future__ import annotations
from typing import Any, Dict, List
import json
import re
from ..utils.group_matcher import best_match

class StepsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        # modèle non utilisé, conservé pour compatibilité
        self.model = model

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw = self._extract_raw(md_text, groups)
        mapped = self._map_to_canonical(raw, groups)
        return {"raw": raw, "mapped": mapped}

    def _extract_raw(self, md_text: str, groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        items = self._read_array(md_text, "steps")
        raw_blocks = []
        current = None
        default_group = groups[0]["group"] if groups else "Default"

        for item in items:
            if item.strip().startswith("**"):
                if current:
                    raw_blocks.append(current)
                header = item.strip().lstrip("*").rstrip("*").strip()
                current = {"group": header, "steps": []}
            elif current is not None:
                current["steps"].append(item)
            else:
                if not current:
                    current = {"group": default_group, "steps": []}
                current["steps"].append(item)

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
                "steps": block["steps"]
            })
        return mapped

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
