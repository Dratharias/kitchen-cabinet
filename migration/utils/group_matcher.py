from __future__ import annotations
import difflib
import re
import unicodedata
from typing import Dict, List

def normalize(text: str) -> str:
    """Normalise un texte pour comparaison."""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text)

def best_match(name: str, candidates: List[str], threshold: float = 0.7) -> str:
    """Retourne le candidat le plus proche du nom donné selon la similarité."""
    if not candidates:
        return name
    norm_name = normalize(name)
    norm_candidates = {c: normalize(c) for c in candidates}

    best = max(
        norm_candidates.items(),
        key=lambda item: difflib.SequenceMatcher(None, norm_name, item[1]).ratio()
    )
    ratio = difflib.SequenceMatcher(None, norm_name, best[1]).ratio()
    return best[0] if ratio >= threshold else name

def standardize_group(name: str, max_words: int = 7) -> str:
    """Standardise un nom de groupe en conservant les accents."""
    # Nettoyage markdown et parenthèses
    clean = name.strip().lstrip("*").rstrip("*").strip()
    clean = re.sub(r"[\(\)]", "", clean)

    # Remplacer séparateurs douteux
    clean = clean.replace("/", " et ")
    clean = re.sub(r"[^a-zA-ZÀ-ÿ0-9\s]", " ", clean)

    # Découpe mots
    words = clean.split()
    if len(words) > max_words:
        words = words[:max_words]

    # Capitalisation mot par mot avec accents préservés
    std = " ".join(w.capitalize() for w in words)
    return std.strip()


def normalize_root(name: str) -> str:
    """Normalise le nom en retirant Maison/Pro pour comparaison de racine."""
    n = unicodedata.normalize("NFKD", name)
    n = "".join(c for c in n if not unicodedata.combining(c))
    n = n.lower()
    n = re.sub(r"\b(maison|pro)\b", "", n)
    n = re.sub(r"[^a-z0-9]+", " ", n)
    return n.strip()

def deduplicate_groups(groups: List[Dict[str,str]], threshold: float = 0.85) -> List[Dict[str,str]]:
    roots = {}
    for g in groups:
        root = normalize_root(g["group"])
        # trouver racine déjà existante proche
        match = None
        for r in roots:
            ratio = difflib.SequenceMatcher(None, root, r).ratio()
            if ratio >= threshold:
                match = r
                break
        if match:
            roots[match].append(g["group"])
        else:
            roots[root] = [g["group"]]
    
    # reconstruire groupes uniques
    result = []
    for _, variants in roots.items():
        # garder les versions distinctes Maison / Pro
        maison = [v for v in variants if re.search(r"\bMaison\b", v, re.I)]
        pro = [v for v in variants if re.search(r"\bPro\b", v, re.I)]
        base = variants[0]
        if maison:
            result.append({"group": sorted(maison, key=len)[0]})
        if pro:
            result.append({"group": sorted(pro, key=len)[0]})
        if not maison and not pro:
            result.append({"group": base})
    return result