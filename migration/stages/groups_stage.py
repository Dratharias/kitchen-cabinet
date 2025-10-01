from __future__ import annotations
from typing import Any, Dict, List
import json
import re
from ..utils.group_matcher import standardize_group, deduplicate_groups

class GroupsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        # modèle conservé pour compatibilité, non utilisé
        self.model = model

    def process(self, md_text: str, default_title: str) -> List[Dict[str, Any]]:
        raw_groups = self._extract_groups(md_text, default_title)
        formatted = self._format_groups(raw_groups)
        deduped = deduplicate_groups(formatted)
        return deduped

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
        return [{"group": standardize_group(g)} for g in groups]

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
