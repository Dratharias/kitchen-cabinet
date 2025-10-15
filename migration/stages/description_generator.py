from __future__ import annotations
from typing import List
from ..mistral_client import MistralClient

class DescriptionGenerator:
    """Generate recipe description from title."""
    
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)
    
    def generate(self, title: str) -> List[str]:
        """
        Generate single-sentence description for recipe.
        Returns list with one element for consistency.
        """
        prompt = f"""Génère une description courte (1 phrase, maximum 20 mots) pour cette recette.
La description doit être appétissante et informative.

Titre: "{title}"

Réponds uniquement en JSON: {{"description": "..."}}"""
        
        try:
            result = self.client.generate_json(prompt)
            desc = result.get("description", "").strip()
            return [desc] if desc else []
        except Exception:
            return []