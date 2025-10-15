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


# -------------------- HELPERS --------------------

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


def _normalize_group_name(name: str) -> str:
    import re
    n = unicodedata.normalize("NFKD", name or "")
    n = "".join(c for c in n if not unicodedata.combining(c))
    n = n.lower().strip()
    return re.sub(r"[^a-z0-9]+", " ", n)


# -------------------- PIPELINE --------------------

class RecipePipeline:
    def __init__(self, work_dir: Path, model: str = "mistral-nemo:12b"):
        self.work_dir = work_dir
        self.work_dir.mkdir(parents=True, exist_ok=True)
        self.model = model
        self.group_aligner = GroupAligner()

    def process(self, md_text: str) -> Dict[str, Any]:
        md_text = _fix_str(md_text)

        # --- 1. Metadata ---
        metadata_stage = MetadataStage(self.model)
        metadata = _fix_recursive(metadata_stage.process(md_text))
        self._write_json("01_metadata.json", metadata)

        # --- 2. Groups ---
        groups_stage = GroupsStage(self.model)
        groups = _fix_recursive(groups_stage.process(md_text, metadata["title"]))
        self._write_json("02_groups.json", groups)

        # --- 3. Ingredients (raw + mapped) ---
        ingredients_stage = IngredientsStage(self.model)
        raw_items = ingredients_stage._read_metadata_array(md_text, "ingredients")
        raw_blocks = ingredients_stage._group_from_raw(raw_items, groups)
        mapped = ingredients_stage._map_to_canonical(raw_blocks, groups)
        self._write_json("03_ingredients_raw.json", raw_items)
        self._write_json("04_ingredients_mapped.json", mapped)

        # --- 4. Steps ---
        steps_stage = StepsStage(self.model)
        steps = _fix_recursive(steps_stage.process(md_text, groups))
        self._write_json("05_steps_raw.json", steps["raw"])
        self._write_json("06_steps_mapped.json", steps["mapped"])

        # --- 5. Align groups ---
        aligned = _fix_recursive(
            self.group_aligner.align(mapped, steps["mapped"], groups)
        )
        self._write_json("07_aligned.json", aligned)

        # --- 6. Enrich + classify ---
        enriched = _fix_recursive(
            ingredients_stage._enrich_ingredients(aligned["ingredients"])
        )
        classified = _fix_recursive(
            ingredients_stage.classify_from_mapped(aligned["ingredients"])
        )
        self._write_json("08_ingredients_enriched.json", enriched)
        self._write_json("09_ingredients_classified.json", classified)

        # --- 7. Fusion des flags is_ingredient ---
        flags = {_normalize_group_name(c["group"]): c for c in classified}
        for block in enriched:
            norm = _normalize_group_name(block.get("group", ""))
            c = flags.get(norm)
            if c:
                block["is_ingredient"] = bool(c.get("is_ingredient", False))
                if c.get("subtitle"):
                    block["subtitle"] = c["subtitle"]

        self._write_json("10_ingredients_fused.json", enriched)

        # --- 8. Build payload final ---
        payload_stage = PayloadStage()
        payload = _fix_recursive(
            payload_stage.build(metadata, groups, enriched, aligned["steps"])
        )
        self._write_json("11_final_payload.json", payload)

        # --- 9. Export final JSON ---
        self._post_fix_file(self.work_dir / "11_final_payload.json")
        slug = self._slugify(metadata.get("title", "untitled"))
        PayloadExporter("migrated").export(payload, slug)
        return payload

    # -------------------- UTILITIES --------------------

    def _post_fix_file(self, path: Path) -> None:
        try:
            raw = path.read_text(encoding="utf-8")
            fixed = _fix_str(raw)
            try:
                obj = json.loads(fixed)
                path.write_text(
                    json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8"
                )
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


# -------------------- CLI ENTRY --------------------

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
