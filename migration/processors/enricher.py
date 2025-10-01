from __future__ import annotations
from typing import Any, Dict, List
from mistral_client import MistralClient

class Enricher:
    """Passe stylistique appliquée au fil du pipeline.
    Cible uniquement description[] et note[] dans chaque bloc.
    """

    def __init__(self, model: str = "mistral-nemo:12b", md_text: str | None = None):
        self.client = MistralClient(model=model)
        self.md_text = md_text

    def _improve_text(self, text: str, tone: str = "concise") -> str:
        prompt = (
            f"Améliore légèrement la lisibilité en restant {tone}. "
            "Ne change pas le sens. "
            "Texte: " + text
        )
        try:
            return self.client.generate(prompt)
        except Exception as e:
            print(f"[ENRICH] Erreur enrichissement: {e}")
            return text

    def enrich(self, block: Dict[str, Any]) -> Dict[str, Any]:
        """Passe unitaire sur un bloc du pipeline (publication ou content)."""
        if "description" in block and isinstance(block["description"], list):
            block["description"] = [self._improve_text(d) for d in block["description"]]

        if "note" in block and isinstance(block["note"], list):
            block["note"] = [self._improve_text(n) for n in block["note"]]

        return block
