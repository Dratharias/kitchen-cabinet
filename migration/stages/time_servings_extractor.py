from __future__ import annotations
import re
from typing import Dict, Any, List

class TimeServingsExtractor:
    """Extract time and servings from description array."""
    
    TIME_PATTERNS = [
        (r'(?:temps|durée|cuisson|préparation|marinade|repos|attente):\s*(\d+)\s*h(?:eures?)?\s*(\d+)', lambda m: int(m[1]) * 60 + int(m[2])),
        (r'(?:temps|durée|cuisson|préparation|marinade|repos|attente):\s*(\d+)\s*h(?:eures?)?', lambda m: int(m[1]) * 60),
        (r'(?:temps|durée|cuisson|préparation|marinade|repos|attente):\s*(\d+)\s*min(?:utes?)?', lambda m: int(m[1])),
    ]
    
    SERVINGS_PATTERNS = [
        r'(?:rendement|portions?):\s*(\d+)\s*(?:à|a|-)\s*(\d+)',
        r'(?:rendement|portions?):\s*(\d+)',
        r'(\d+)\s*personnes?',
        r'(\d+)\s*poritons?',
    ]

    def extract(self, description: List[str]) -> Dict[str, Any]:
        """
        Returns: {"total_prep_time": int|None, "servings": int|None}
        """
        total_time = None
        servings = None
        
        for line in description:
            normalized = line.lower().strip()
            
            if not total_time:
                total_time = self._extract_time(normalized)
            
            if not servings:
                servings = self._extract_servings(normalized)
        
        return {
            "total_prep_time": total_time,
            "servings": servings
        }
    
    def _extract_time(self, text: str) -> int | None:
        """Extract time in minutes. Sums all time mentions."""
        total = 0
        found = False
        
        for pattern, converter in self.TIME_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                total += converter(match)
                found = True
        
        return total if found else None
    
    def _extract_servings(self, text: str) -> int | None:
        """Extract servings count. Takes minimum if range."""
        for pattern in self.SERVINGS_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                min_servings = int(match[1])
                return min_servings
        
        return None