from __future__ import annotations
from typing import Any, Dict
from mistral_client import MistralClient
import json
import re

class DescriptionNormalizer:
    """
    Pré-tri: détection automatique du temps de préparation et portions dans steps/notes.
    Injection dans contents[0].data.total_prep_time et servings.
    Ensuite, reformulation de description[] en une phrase courte et vendeuse.
    """

    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    def normalize(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pub = next(iter(payload["payload"].values()))

        # Étape 1: pré-tri pour prep_time et servings
        prep_time = self._find_prep_time(pub)
        servings = self._find_servings(pub)

        try:
            pub["contents"][0]["data"]["total_prep_time"] = prep_time or 0
            pub["contents"][0]["data"]["servings"] = servings
        except Exception:
            pass

        # Étape 2: reformulation description[]
        title = pub.get("title", "")
        description = pub.get("description", [])
        note = pub.get("note", [])

        context = {
            "title": title,
            "description": description,
            "note": note,
            "prep_time": prep_time,
            "servings": servings,
        }

        try:
            prompt = (
                "Reformule en UNE SEULE phrase courte, claire et vendeuse (sujet, verbe, complément).\n"
                "Décris simplement ce qu'est ce plat ou cette boisson. Pas de détails techniques.\n"
                "Ne mets pas de guillemets autour de la phrase.\n"
                f"Input: {json.dumps(context, ensure_ascii=False)}"
            )
            new_desc = self.client.generate(prompt)
            pub["description"] = [new_desc.strip().strip('"')]
        except Exception as e:
            print(f"[NORMALIZER] Erreur: {e}")

        return payload

    # --------- helpers ---------
    def _find_prep_time(self, pub: Dict[str, Any]) -> int | None:
        texts = []
        for c in pub.get("contents", []):
            for seg in c.get("content_segments", []):
                texts.append(seg.get("segment", {}).get("data", {}).get("paragraph", ""))
        texts += pub.get("note", [])

        pattern = re.compile(r"(\d+)\s*(minutes|min|heures|hrs|h)", re.IGNORECASE)
        for t in texts:
            m = pattern.search(t)
            if m:
                try:
                    val = int(m.group(1))
                    if "h" in m.group(2).lower():
                        return val * 60
                    return val
                except Exception:
                    continue
        return None

    def _find_servings(self, pub: Dict[str, Any]) -> int | None:
        texts = pub.get("description", []) + pub.get("note", [])
        pattern = re.compile(r"(\d+)\s*(personnes|portions|servings)", re.IGNORECASE)
        for t in texts:
            m = pattern.search(t)
            if m:
                try:
                    return int(m.group(1))
                except Exception:
                    continue
        return None
