from __future__ import annotations
from typing import Any, Dict, List, Tuple
import json
import re
import unicodedata
from mistral_client import MistralClient

class StepsExtractor:
    def __init__(self, model: str = "mistral-nemo:12b"):
        self.client = MistralClient(model=model)

    # -------------------- utils fuzzy --------------------
    @staticmethod
    def _strip_accents(s: str) -> str:
        return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

    @classmethod
    def _key_tokens(cls, text: str) -> Tuple[str, Tuple[str, ...]]:
        t = cls._strip_accents(text.lower())
        t = t.replace('/', ' ')
        t = re.sub(r"[^a-z0-9]+", " ", t)
        toks = tuple(tok for tok in t.split() if len(tok) >= 2 and tok not in {"ou","et","de","du","des","la","le","les","aux"})
        return " ".join(toks), toks

    def _deduplicate_semantic_groups(self, groups: List[str]) -> Dict[str, str]:
        key_to_groups: Dict[str, List[str]] = {}
        for g in groups:
            key, toks = self._key_tokens(g)
            key_to_groups.setdefault(key, []).append(g)

        canonical: Dict[str, str] = {}
        for key, group_list in key_to_groups.items():
            if len(group_list) == 1:
                canonical[group_list[0]] = group_list[0]
            else:
                chosen = max(group_list, key=len)
                print(f"[STEPS][DEDUP] Fusion: {group_list} → '{chosen}'")
                for g in group_list:
                    canonical[g] = chosen
        return canonical

    # -------------------- markdown array reader --------------------
    def _read_array_items(self, md_text: str, key: str) -> List[str]:
        lines = md_text.splitlines()
        capture = False
        buf: List[str] = []
        for line in lines:
            low = line.strip().lower()
            if not capture and low.startswith(f"{key}:"):
                capture = True
                buf.append(line.split(':', 1)[1])
                continue
            if capture:
                buf.append(line)
                raw = " ".join(buf)
                if '[' in raw and ']' in raw:
                    break
        raw = " ".join(buf)
        if '[' not in raw or ']' not in raw:
            return []
        inner = raw.split('[', 1)[1].rsplit(']', 1)[0]
        try:
            arr = json.loads('[' + inner + ']')
            return [str(v) for v in arr]
        except Exception:
            return re.findall(r'"([^"\\]*(?:\\.[^"\\]*)*)"', inner)

    # -------------------- main --------------------
    def extract(self, md_text: str, groups: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        items = self._read_array_items(md_text, 'steps')

        # Extraction brute des headers et steps (inchangés, pas de normalisation de contenu)
        raw_blocks: List[Dict[str, Any]] = []
        current_block: Dict[str, Any] | None = None
        for s in items:
            t = s.strip()
            if not t:
                continue
            if t.startswith('**'):
                header = t.lstrip('*').rstrip('*').strip()
                if current_block:
                    raw_blocks.append(current_block)
                current_block = {"group": header, "steps": []}
                continue
            if current_block is not None:
                current_block["steps"].append(t)
        if current_block:
            raw_blocks.append(current_block)
        print(f"[STEPS][RAW] Extraits depuis markdown: {len(raw_blocks)} groupes")

        candidate_groups = [g["group"] for g in groups]
        canonical_map = self._deduplicate_semantic_groups(candidate_groups)
        unique_targets = list(set(canonical_map.values()))
        print(f"[STEPS][DEDUP] {len(candidate_groups)} → {len(unique_targets)} groupes (après déduplication)")

        cleaned: Dict[str, str] = {}
        for rb in raw_blocks:
            src = rb["group"]
            dst = self._fuzzy_resolve(src, unique_targets) or src
            dst_canon = canonical_map.get(dst, dst)
            cleaned[src] = dst_canon
        print(f"[STEPS][MAP] {cleaned}")

        buffers: Dict[str, List[str]] = {c: [] for c in unique_targets}
        for rb in raw_blocks:
            src = rb["group"]
            target_canonical = cleaned.get(src, canonical_map.get(src, src))
            buffers.setdefault(target_canonical, [])
            # steps bruts conservés tels quels
            buffers[target_canonical].extend(rb["steps"])

        results: List[Dict[str, Any]] = []
        for g in groups:
            gname_canonical = canonical_map.get(g["group"], g["group"])
            steps = buffers.get(gname_canonical, [])
            print(f"[STEPS] Groupe '{g['group']}' (→ '{gname_canonical}') → {len(steps)} steps")
            results.append({"group": g["group"], "steps": steps})
        return results

    # -------------------- fallback fuzzy --------------------
    def _fuzzy_resolve(self, target: str, candidates: List[str]) -> str | None:
        tk, ttoks = self._key_tokens(target)
        key2name: Dict[str, str] = {}
        for n in candidates:
            nk, _ = self._key_tokens(n)
            if nk not in key2name:
                key2name[nk] = n
        if tk in key2name:
            return key2name[tk]
        best_name, best_sim, best_ed = None, -1.0, 10**9
        best_ed_name = None
        for n in candidates:
            nk, ntoks = self._key_tokens(n)
            sim = self._jaccard(ttoks, ntoks)
            if sim > best_sim:
                best_sim, best_name = sim, n
            ed = self._edit_distance(" ".join(ttoks), " ".join(ntoks))
            if ed < best_ed:
                best_ed, best_ed_name = ed, n
        if best_sim >= 0.6:
            return best_name
        if best_ed <= 2:
            return best_ed_name
        return None

    @staticmethod
    def _jaccard(a: Tuple[str, ...], b: Tuple[str, ...]) -> float:
        sa, sb = set(a), set(b)
        if not sa and not sb:
            return 1.0
        return len(sa & sb) / max(1, len(sa | sb))

    @staticmethod
    def _edit_distance(a: str, b: str) -> int:
        la, lb = len(a), len(b)
        if la == 0:
            return lb
        if lb == 0:
            return la
        dp = list(range(lb + 1))
        for i in range(1, la + 1):
            prev = dp[0]
            dp[0] = i
            ca = a[i - 1]
            for j in range(1, lb + 1):
                tmp = dp[j]
                cost = 0 if ca == b[j - 1] else 1
                dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + cost)
                prev = tmp
        return dp[lb]
