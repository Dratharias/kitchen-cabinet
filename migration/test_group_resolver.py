import unittest
from processors.group_resolver import GroupResolver

class TestGroupResolver(unittest.TestCase):
    def setUp(self):
        self.resolver = GroupResolver()

    def _log_and_resolve(self, target: str, known: list[str]) -> str:
        print("\n[TEST] Target:", target)
        print("[TEST] Known:", known)
        resolved = self.resolver.resolve(target, known)
        print("[TEST] Resolved →", resolved)
        return resolved

    def test_bleuet_match(self):
        known = ["Soda aux bleuets maison", "Soda aux bleuets pro"]
        target = "Soda bleuet maison"
        resolved = self._log_and_resolve(target, known)
        self.assertEqual(resolved, "Soda aux bleuets maison")

    def test_fraise_citron_match(self):
        known = ["Soda à la fraise-citron maison", "Soda à la fraise-citron pro"]
        target = "Soda fraise-citron pro"
        resolved = self._log_and_resolve(target, known)
        self.assertEqual(resolved, "Soda à la fraise-citron pro")

    def test_limonade_match(self):
        known = ["Limonade florale ou thé maison", "Limonade florale ou thé pro"]
        target = "Limonade florale/thé maison"
        resolved = self._log_and_resolve(target, known)
        self.assertEqual(resolved, "Limonade florale ou thé maison")

if __name__ == "__main__":
    unittest.main()