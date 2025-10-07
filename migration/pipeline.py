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
        md_text = _fix_str(md_text)

        # --- 1. Metadata
        metadata_stage = MetadataStage(self.model)
        metadata = _fix_recursive(metadata_stage.process(md_text))
        self._write_json("01_metadata.json", metadata)

        # --- 2. Groups
        groups_stage = GroupsStage(self.model)
        groups = _fix_recursive(groups_stage.process(md_text, metadata["title"]))
        self._write_json("01_groups.json", groups)

        # --- 3. Ingredients (avec classification unique)
        ingredients_stage = IngredientsStage(self.model)
        raw_ing = ingredients_stage._read_metadata_array(md_text, "ingredients")
        raw_blocks = ingredients_stage._group_from_raw(raw_ing, groups)
        mapped = ingredients_stage._map_to_canonical(raw_blocks, groups)
        classified = ingredients_stage.classify_from_mapped(mapped)  # flag déjà calculé ici
        self._write_json("01_ingredients.json", raw_ing)
        self._write_json("02_ingredients.json", mapped)

        # --- 4. Steps
        steps_stage = StepsStage(self.model)
        steps = _fix_recursive(steps_stage.process(md_text, groups))
        self._write_json("01_steps.json", steps["raw"])
        self._write_json("02_steps.json", steps["mapped"])

        # --- 5. Align groups (préserve les flags calculés)
        aligned = _fix_recursive(self.group_aligner.align(classified, steps["mapped"], groups))
        self._write_json("03_aligned.json", aligned)

        # remplacer les groupes pour les passes suivantes
        ingredients = aligned["ingredients"]
        steps = aligned["steps"]

        # --- 6. Enrichissement (sans reclassification)
        enriched = _fix_recursive(ingredients_stage._enrich_ingredients(ingredients))
        self._write_json("03_ingredients.json", enriched)
        self._write_json("04_ingredients.json", ingredients)  # les flags originaux conservés

        # --- 7. Build payload
        payload_stage = PayloadStage()
        payload = _fix_recursive(payload_stage.build(metadata, groups, ingredients, steps))
        self._write_json("final_payload.json", payload)

        # --- 8. Export final
        self._post_fix_file(self.work_dir / "final_payload.json")
        slug = self._slugify(metadata.get("title", "untitled"))
        PayloadExporter("migrated").export(payload, slug)
        return payload

    # ---------------- UTILITAIRES ----------------
    def _post_fix_file(self, path: Path) -> None:
        try:
            raw = path.read_text(encoding="utf-8")
            fixed = _fix_str(raw)
            try:
                obj = json.loads(fixed)
                path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
            except Exception:
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
    print(f"✓ Processed: {payload['payload']['1']['title']}")
