from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict

class PayloadExporter:
    def __init__(self, migrated_dir: str = "migrated"):
        self.migrated_dir = Path(migrated_dir)
        self.migrated_dir.mkdir(parents=True, exist_ok=True)

    def export(self, payload: Dict[str, Any], slug: str) -> Path:
        """
        Exporte le payload final en JSON dans migrated/<slug>.json
        """
        out_path = self.migrated_dir / f"{slug}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)
        return out_path
