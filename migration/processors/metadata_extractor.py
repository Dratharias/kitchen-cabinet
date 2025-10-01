import re
import json
from typing import Any, Dict

class MetadataExtractor:
    """
    Étape 1 — Extraction des métadonnées.
    """

    def extract(self, md_text: str) -> Dict[str, Any]:
        lines = [l.strip() for l in md_text.splitlines() if l.strip()]

        meta: Dict[str, Any] = {
            "title": "Untitled",
            "tags": [],
            "description": [],
            "notes": [],
            "thumbnail": "",
            "type": "Recette",
            "style": None,
            "author": None,
            "published": True,
            "public": True,
        }

        capture_key: str | None = None
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

            # Multi-lignes pour description et notes
            if capture_key in ("description", "notes"):
                # stop capture si nouvelle section
                if re.match(r"^(ingredients:|steps:|tags:|title:|thumbnail:)" , line, re.IGNORECASE):
                    capture_key = None
                    continue

                if line.startswith("-") or line.startswith("*"):
                    val = line.lstrip("-* ").strip()
                    if capture_key == "description":
                        meta["description"].append(val)
                    elif capture_key == "notes":
                        meta["notes"].append(val)
                elif not re.match(r"^[a-z_]+:", line, re.IGNORECASE):
                    if capture_key == "description" and meta["description"]:
                        meta["description"][-1] += " " + line
                    elif capture_key == "notes" and meta["notes"]:
                        meta["notes"][-1] += " " + line

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
