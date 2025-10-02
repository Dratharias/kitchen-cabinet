from __future__ import annotations
from typing import Any, Dict
from pathlib import Path
import json
import unicodedata
import ftfy

from .stages.metadata_stage import MetadataStage
from .stages.groups_stage import GroupsStage
from .stages.ingredients_stage import IngredientsStage
from .stages.steps_stage import StepsStage
from .stages.payload_stage import PayloadStage
from .stages.payload_exporter import PayloadExporter
from .stages.group_aligner import GroupAligner


def _fix_str(s: str) -> str:
    # Répare le mojibake puis normalise en NFC
    return unicodedata.normalize("NFC", ftfy.fix_text(s))


def _fix_recursive(data: Any) -> Any:
    if isinstance(data, str):
        return _fix_str(data)
    if isinstance(data, list):
        return [_fix_recursive(v) for v in data]
    if isinstance(data, dict):
        return {k: _fix_recursive(v) for k, v in data.items()}
    return data


class RecipePipeline:
    def __init__(self, work_dir: Path, model: str = "mistral-nemo:12b"):
        self.work_dir = work_dir
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.model = model
        self.group_aligner = GroupAligner()

    def process(self, md_text: str) -> Dict[str, Any]:
        # Pré-fix du Markdown entier pour éviter de propager le mojibake
        md_text = _fix_str(md_text)

        # Stage 1: metadata
        metadata_stage = MetadataStage(self.model)
        metadata = metadata_stage.process(md_text)
        metadata = _fix_recursive(metadata)
        self._write_json("01_metadata.json", metadata)

        # Stage 2: groups
        groups_stage = GroupsStage(self.model)
        groups = groups_stage.process(md_text, metadata["title"])
        groups = _fix_recursive(groups)
        self._write_json("01_groups.json", groups)

        # Stage 3: ingredients (raw + mapped)
        ingredients_stage = IngredientsStage(self.model)
        ingredients = ingredients_stage.process(md_text, groups)
        ingredients = _fix_recursive(ingredients)
        self._write_json("01_ingredients.json", ingredients["raw"])
        self._write_json("02_ingredients.json", ingredients["mapped"])

        # Stage 4: steps (raw + mapped)
        steps_stage = StepsStage(self.model)
        steps = steps_stage.process(md_text, groups)
        steps = _fix_recursive(steps)
        self._write_json("01_steps.json", steps["raw"])
        self._write_json("02_steps.json", steps["mapped"])

        # Stage 5: align groups BEFORE enriching/classifying ingredients
        aligned = self.group_aligner.align(ingredients["mapped"], steps["mapped"], groups)
        aligned = _fix_recursive(aligned)
        self._write_json("03_aligned.json", aligned)

        # Remplacer les groupes pour les passes suivantes
        ingredients["mapped"] = aligned["ingredients"]
        steps["mapped"] = aligned["steps"]

        # Stage 6: enrich + classify ingredients (with aligned groups)
        enriched = ingredients_stage._enrich_ingredients(ingredients["mapped"])
        classified = ingredients_stage._classify_ingredient_groups(enriched)
        enriched = _fix_recursive(enriched)
        classified = _fix_recursive(classified)
        self._write_json("03_ingredients.json", enriched)
        self._write_json("04_ingredients.json", classified)

        # Stage 7: payload
        payload_stage = PayloadStage()
        payload = payload_stage.build(metadata, groups, classified, steps["mapped"])
        payload = _fix_recursive(payload)
        self._write_json("final_payload.json", payload)

        # Post-fix sur le fichier écrit pour éliminer toute corruption résiduelle
        self._post_fix_file(self.work_dir / "final_payload.json")

        # Stage 8: export
        slug = self._slugify(metadata.get("title", "untitled"))
        exporter = PayloadExporter("migrated")
        exporter.export(payload, slug)
        return payload

    def _post_fix_file(self, path: Path) -> None:
        try:
            raw = path.read_text(encoding="utf-8")
            fixed = _fix_str(raw)
            try:
                # si c'est du JSON valide on re-formate proprement
                obj = json.loads(fixed)
                path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
                # sinon on écrit le texte corrigé tel quel
                path.write_text(fixed, encoding="utf-8")
        except Exception:
            pass

    def _write_json(self, filename: str, data: Any) -> None:
        path = self.work_dir / filename
        with path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _slugify(self, text: str) -> str:
        return (
            text.lower()
            .replace(" ", "-")
            .replace("/", "-")
            .replace(".", "")
        )

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3 or sys.argv[1] != "-f":
        print("Usage: python pipeline.py -f <markdown_file>")
        sys.exit(1)

    md_file = Path(sys.argv[2])
    if not md_file.exists():
        print(f"File not found: {md_file}")
        sys.exit(1)

    work_dir = Path("output")
    pipeline = RecipePipeline(work_dir)

    md_text = md_file.read_text(encoding="utf-8")
    payload = pipeline.process(md_text)

    # Titre déjà corrigé par les passes ftfy
    print(f"✓ Processed: {payload['payload']['1']['title']}")
