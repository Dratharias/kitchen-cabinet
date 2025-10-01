from __future__ import annotations
import requests
import json
from typing import Any, Dict

class MistralClient:
    """Client pour appeler Mistral via API Ollama locale."""

    def __init__(self, model: str = "mistral-nemo:12b", base_url: str = "http://localhost:11434"):
        self.model = model
        self.base_url = base_url
        self.generate_url = f"{base_url}/api/generate"

    def generate(self, prompt: str, system: str = "", temperature: float = 0.1) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system,
            "stream": False,
            "options": {"temperature": temperature},
        }
        response = requests.post(self.generate_url, json=payload, timeout=120)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "").strip()

    # alias pour compat ancienne API
    def complete(self, prompt: str, **kwargs) -> str:
        return self.generate(prompt, **kwargs)

    def generate_json(self, prompt: str, system: str = "") -> Dict[str, Any]:
        full_system = f"{system}\n\nRéponds UNIQUEMENT avec du JSON valide, sans texte avant ou après."
        response_text = self.generate(prompt, system=full_system, temperature=0.1)
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            response_text = "\n".join(lines[1:-1]) if len(lines) > 2 else response_text
        return json.loads(response_text)
