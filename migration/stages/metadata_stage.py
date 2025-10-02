from __future__ import annotations
from typing import Dict, Any, List
import json
import re

class MetadataStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        # modèle non utilisé mais laissé pour compatibilité
        self.model = model

    def process(self, md_text: str) -> Dict[str, Any]:
        """
        Extrait directement les métadonnées du frontmatter markdown.
        Le titre est repris tel quel, sans normalisation.
        """
        meta: Dict[str, Any] = {}
        lines = md_text.splitlines()

        # capture les lignes entre --- ... ---
        frontmatter: List[str] = []
        in_block = False
        for line in lines:
            if line.strip() == "---":
                if not in_block:
                    in_block = True
                    continue
                else:
                    break
            if in_block:
                frontmatter.append(line)

        for line in frontmatter:
            if line.startswith("title:"):
                meta["title"] = line.split(":", 1)[1].strip().strip('"')
            elif line.startswith("date:"):
                meta["date"] = line.split(":", 1)[1].strip().strip('"')
            elif line.startswith("tags:"):
                tags_str = line.split(":", 1)[1].strip()
                try:
                    meta["tags"] = json.loads(tags_str)
                except Exception:
                    meta["tags"] = []
            elif line.startswith("description:"):
                desc_str = line.split(":", 1)[1].strip()
                try:
                    meta["description"] = json.loads(desc_str)
                except Exception:
                    meta["description"] = []
            elif line.startswith("notes:"):
                notes_str = line.split(":", 1)[1].strip().strip('"')
                meta["note"] = [notes_str] if notes_str else []
            elif line.startswith("thumbnail:"):
                meta["thumbnail"] = line.split(":", 1)[1].strip()
            elif line.startswith("published:"):
                val = line.split(":", 1)[1].strip().lower()
                meta["published"] = val in ("true", "yes", "1")
            elif line.startswith("gallery:"):
                gal_str = line.split(":", 1)[1].strip()
                try:
                    meta["gallery"] = json.loads(gal_str)
                except Exception:
                    meta["gallery"] = []

        # si certains champs manquent, initialiser
        meta.setdefault("description", [])
        meta.setdefault("note", [])
        meta.setdefault("tags", [])
        meta.setdefault("gallery", [])
        meta.setdefault("published", False)

        return meta
