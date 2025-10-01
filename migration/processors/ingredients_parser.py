import json
from typing import Any, Dict, List

class IngredientsParser:
    """
    Étape 2 — Extraction des ingrédients bruts.
    Supporte uniquement le format array YAML multi-ligne :
    ingredients: [
      "**Section",
      "item1",
      "item2"
    ]
    """

    def parse(self, md_text: str) -> List[Dict[str, Any]]:
        lines = [l.rstrip() for l in md_text.splitlines()]
        raw = self._extract_multiline_array(lines, "ingredients")
        
        if not raw:
            print("[INGREDIENTS] Aucun bloc ingredients trouvé")
            return []

        try:
            items = json.loads(raw)
            groups: List[Dict[str, Any]] = []
            current_group: Dict[str, Any] = {"group": "", "ingredients": []}

            for item in items:
                s = str(item).strip()
                if s.startswith("**"):
                    if current_group["group"] or current_group["ingredients"]:
                        groups.append(current_group)
                    group_name = s.strip("* ")
                    print(f"[INGREDIENTS] Nouveau groupe détecté: {group_name}")
                    current_group = {"group": group_name, "ingredients": []}
                else:
                    current_group["ingredients"].append({
                        "quantity": None,
                        "unit": "",
                        "product": s,
                        "multiply_factor": 1
                    })

            if current_group["group"] or current_group["ingredients"]:
                groups.append(current_group)

            for g in groups:
                print(f"[INGREDIENTS] Groupe final '{g['group']}' → {len(g['ingredients'])} ingrédients")
            
            return groups
        except Exception as e:
            print("[ERROR] parse ingredients:", e)
            return []

    def _extract_multiline_array(self, lines: List[str], key: str) -> str:
        buf: List[str] = []
        capture = False
        for line in lines:
            if not capture and line.lower().startswith(f"{key}:"):
                start = line.split("[", 1)
                if len(start) == 2:
                    buf.append("[" + start[1].strip())
                else:
                    buf.append("[")
                capture = True
                continue
            if capture:
                buf.append(line.strip())
                if line.strip().endswith("]"):
                    break
        return " ".join(buf) if buf else ""
