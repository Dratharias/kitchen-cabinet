from __future__ import annotations
from typing import Any, Dict
from pathlib import Path
import json

from .stages.metadata_stage import MetadataStage
from .stages.groups_stage import GroupsStage
from .stages.ingredients_stage import IngredientsStage
from .stages.steps_stage import StepsStage
from .stages.payload_stage import PayloadStage
from .stages.payload_exporter import PayloadExporter

class RecipePipeline:
    def __init__(self, work_dir: Path, model: str = "mistral-nemo:12b"):
        self.work_dir = work_dir
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.model = model

    def process(self, md_text: str) -> Dict[str, Any]:
        # Stage 1: metadata
        metadata_stage = MetadataStage(self.model)
        metadata = metadata_stage.process(md_text)
        self._write_json("01_metadata.json", metadata)

        # Stage 2: groups
        groups_stage = GroupsStage(self.model)
        groups = groups_stage.process(md_text, metadata["title"])
        self._write_json("01_groups.json", groups)

        # Stage 3.x: ingredients
        ingredients_stage = IngredientsStage(self.model)
        ingredients = ingredients_stage.process(md_text, groups)
        self._write_json("01_ingredients.json", ingredients["raw"])        # raw
        self._write_json("02_ingredients.json", ingredients["mapped"])     # mapped
        self._write_json("03_ingredients.json", ingredients["enriched"])   # enriched
        self._write_json("04_ingredients.json", ingredients["classified"]) # classified with flags

        # Stage 4: steps
        steps_stage = StepsStage(self.model)
        steps = steps_stage.process(md_text, groups)
        self._write_json("01_steps.json", steps["raw"])        
        self._write_json("02_steps.json", steps["mapped"])     

        # Stage 5: payload from classified ingredients
        payload_stage = PayloadStage()
        payload = payload_stage.build(metadata, groups, ingredients["classified"], steps["mapped"]) 
        self._write_json("final_payload.json", payload)

        # Stage 6: export
        slug = self._slugify(metadata.get("title", "untitled"))
        exporter = PayloadExporter("migrated")
        exporter.export(payload, slug)
        return payload

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