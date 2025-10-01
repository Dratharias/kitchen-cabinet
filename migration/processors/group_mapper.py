from __future__ import annotations
from typing import Any, Dict, List
import json
from mistral_client import MistralClient
from .ingredients_parser import IngredientsParser

class GroupMapper:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    # --- Public API ---
    def map_groups(self, md_text: str, default_title: str) -> List[Dict[str, Any]]:
        # 1) Essaye d'extraire les headers à partir des tableaux "ingredients" et "steps"
        headers = self._extract_array_headers(md_text)
        print(f"[GROUP_MAPPER] Headers détectés: {headers}")

        # 2) Fallback robuste: si rien trouvé, réutiliser le parseur d'ingrédients
        if not headers:
            print("[GROUP_MAPPER] Fallback via IngredientsParser.parse()")
            ing_groups = IngredientsParser().parse(md_text)
            headers = [g["group"] for g in ing_groups if g.get("group")] \
                      or [default_title]

        # 3) Injecter le titre global en tête s'il manque
        if default_title and default_title not in headers:
            headers.insert(0, default_title)

        # 4) Classifier via Mistral (tolérance stricte au compte)
        return self._classify_groups(headers)

    # --- Extraction helpers ---
    def _extract_array_headers(self, md_text: str) -> List[str]:
        items: List[str] = []
        for key in ("ingredients", "steps"):
            items.extend(self._read_array_items(md_text, key))

        headers: List[str] = []
        seen = set()
        for s in items:
            t = self._strip_quotes_commas(s).strip()
            if t.startswith("**"):
                name = t.lstrip("*").strip()
                if name.endswith("**"):
                    name = name[:-2].rstrip()
                if name and name not in seen:
                    headers.append(name)
                    seen.add(name)
                    print(f"[GROUP_MAPPER] Header détecté: {name}")
        print(f"[GROUP_MAPPER] Total headers trouvés: {len(headers)}")
        return headers

    def _read_array_items(self, md_text: str, key: str) -> List[str]:
        raw = self._extract_multiline_array_strict(md_text, key)
        if not raw:
            return []
        try:
            arr = json.loads(raw)
            return [str(v) for v in arr]
        except Exception as e:
            print(f"[GROUP_MAPPER] ERROR json.loads sur {key}: {e}")
            return []

    def _extract_multiline_array_strict(self, md_text: str, key: str) -> str:
        """Capture un tableau JSON multi-ligne en s'arrêtant UNIQUEMENT à la ligne qui se termine par ']'.
        Retourne une chaîne JSON complète (ex: "[ \"a\", \"b\" ]") ou "" si absent.
        """
        lines = [l.rstrip() for l in md_text.splitlines()]
        buf: List[str] = []
        capture = False
        for line in lines:
            low = line.lower()
            if not capture and low.startswith(f"{key}:"):
                # Début: tout après le premier '[' si présent, sinon on ajoute '['
                if "[" in line:
                    buf.append("[" + line.split("[", 1)[1].strip())
                else:
                    buf.append("[")
                capture = True
                continue
            if capture:
                buf.append(line.strip())
                if line.strip().endswith("]"):
                    break
        raw = " ".join(buf) if buf else ""
        if raw:
            # Normaliser: s'assurer que la chaîne commence bien par '['
            if not raw.strip().startswith("["):
                raw = "[" + raw
        return raw

    @staticmethod
    def _strip_quotes_commas(s: str) -> str:
        t = s.strip()
        if t.endswith(','):
            t = t[:-1]
        if (t.startswith('"') and t.endswith('"')) or (t.startswith("'") and t.endswith("'")):
            t = t[1:-1]
        return t

    # --- Classification ---
    def _classify_groups(self, groups: List[str]) -> List[Dict[str, Any]]:
        print(f"[GROUP_MAPPER] Groupes à classifier: {groups}")
        if not groups:
            return []

        prompt = f"""Tu dois classifier EXACTEMENT {len(groups)} groupes. Ne fusionne RIEN.

Groupes à analyser:
{json.dumps(groups, ensure_ascii=False, indent=2)}

Règles STRICTES:
- Tu DOIS retourner EXACTEMENT {len(groups)} éléments dans le array \"groups\"
- Chaque groupe doit apparaître TEL QUEL dans ta réponse
- is_new_recipe=true si c'est une recette complète (ex: \"Tarte aux pommes\", \"Version végane\")
- is_new_recipe=false si c'est une section/composant (ex: \"Pâte\", \"Garniture\")

Format de réponse OBLIGATOIRE:
{{
  \"groups\": [
    {{\"group\": \"NOM EXACT\", \"is_new_recipe\": true/false}},
    ...
  ]
}}"""
        system = (
            "Tu es un classificateur strict. Tu retournes TOUJOURS le nombre exact d'éléments demandés."
        )
        try:
            result = self.client.generate_json(prompt, system=system)
            classified = result.get("groups", [])
            print(f"[GROUP_MAPPER] Mistral a retourné {len(classified)} groupes sur {len(groups)} attendus")
            if len(classified) != len(groups):
                print("[GROUP_MAPPER] WARNING: Mistral a ignoré des groupes, fallback par défaut")
                return [{"group": g, "is_new_recipe": True} for g in groups]
            print(f"[GROUP_MAPPER] Résultat classification: {classified}")
            return classified
        except Exception as e:
            print(f"[GROUP_MAPPER] ERROR Mistral: {e}")
            return [{"group": g, "is_new_recipe": True} for g in groups]
