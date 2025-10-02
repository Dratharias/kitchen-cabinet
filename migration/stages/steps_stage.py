from __future__ import annotations
from typing import Any, Dict, List, Tuple
import copy
import re
import json
import difflib
from ..mistral_client import MistralClient

class StepsStage:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def process(self, md_text: str, groups: List[Dict[str, Any]]) -> Dict[str, Any]:
        raw_items = self._read_metadata_array(md_text, "steps")
        raw_blocks = self._group_from_raw(raw_items, groups)
        mapped = self._map_groups(raw_blocks, groups)
        classified = self._classify(mapped, groups)
        return {
            "raw": raw_items,
            "grouped": raw_blocks,
            "mapped": mapped,
            "classified": classified,
        }

    def _read_metadata_array(self, md_text: str, key: str) -> List[str]:
        lines = md_text.splitlines()
        capture = False
        buf: List[str] = []
        for line in lines:
            low = line.strip().lower()
            if not capture and low.startswith(f"{key}:"):
                capture = True
                buf.append(line.split(":", 1)[1])
                continue
            if capture:
                if low.startswith("gallery:") or low.startswith("published:"):
                    break
                buf.append(line)
                if "]" in line:
                    break
        raw = " ".join(buf)
        if "[" not in raw or "]" not in raw:
            return []
        inner = raw.split("[", 1)[1].rsplit("]", 1)[0]
        try:
            arr = json.loads("[" + inner + "]")
            return [str(v) for v in arr]
        except Exception:
            return re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)

    def _group_from_raw(self, items: List[str], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        raw_blocks: List[Dict[str, Any]] = []
        current: Dict[str, Any] | None = None
        default_group = groups[0]["group"] if groups else "Default"
        for item in items:
            s = str(item).strip()
            if s.startswith("**"):
                if current:
                    raw_blocks.append(current)
                header = s.lstrip("*").rstrip("*").strip()
                current = {"group": header, "steps": []}
            else:
                if current is None:
                    current = {"group": default_group, "steps": []}
                current["steps"].append(item)
        if current:
            raw_blocks.append(current)
        return raw_blocks

    def _map_groups(self, blocks: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Essaie d'associer 1:1 les groupes de steps aux groupes d'ingrédients
        en utilisant une heuristique de similarité + fallback Mistral.
        """
        canonical_names = [g["group"] for g in groups]
        output: List[Dict[str, Any]] = []

        used_groups: set[str] = set()
        for block in blocks:
            chosen_group = block["group"]

            matches = difflib.get_close_matches(chosen_group, canonical_names, n=1, cutoff=0.6)
            if matches:
                candidate = matches[0]
                if candidate not in used_groups:
                    chosen_group = candidate
                    used_groups.add(candidate)
                else:
                    chosen_group = self._ask_mistral(chosen_group, canonical_names, used_groups)
            else:
                chosen_group = self._ask_mistral(chosen_group, canonical_names, used_groups)

            output.append({
                "group": chosen_group,
                "steps": copy.deepcopy(block["steps"])
            })
        return output

    def _ask_mistral(self, step_group: str, canonical_names: List[str], used_groups: set[str]) -> str:
        available = [g for g in canonical_names if g not in used_groups]
        prompt = f"""
Tu dois associer le groupe de steps suivant à un groupe d'ingrédients.
Groupes possibles: {available}

Nom du groupe de steps: {step_group}

Réponds uniquement en JSON: {{ "group": "nom" }}
"""
        try:
            result = self.client.generate_json(prompt)
            chosen = result.get("group") or step_group
            if chosen in available:
                used_groups.add(chosen)
            return chosen
        except Exception:
            return step_group

    def _classify(self, mapped: List[Dict[str, Any]], groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        classified: List[Dict[str, Any]] = []
        for block in mapped:
            gname = block.get("group", "")
            is_ing = any(gname.lower() in g["group"].lower() for g in groups)
            classified.append({
                "group": gname,
                "steps": copy.deepcopy(block.get("steps", [])),
                "is_ingredient": is_ing,
                "subtitle": gname if is_ing else None,
            })
        return classified
