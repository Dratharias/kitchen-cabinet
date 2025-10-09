import { distance } from "fastest-levenshtein";

const STOPWORDS_FR = new Set([
  "de","du","des","d","au","aux","la","le","les","et","ou",
  "a","à","en","avec","sans","maison","pro",
]);

function stripAccents(text: string): string {
  return text ? text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "") : text;
}

function tokenize(s: string): string[] {
  return stripAccents(s.toLowerCase())
    .match(/[a-z]+/g)
    ?.filter((w) => w.length > 2 && !STOPWORDS_FR.has(w)) || [];
}

// calcule un ratio de similarité 0–100, identique à fuzz.ratio
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const dist = distance(a, b);
  const maxLen = Math.max(a.length, b.length);
  return Math.round(((1 - dist / maxLen) * 100) * 100) / 100;
}

/**
 * Équivalent direct de IngredientsStage._is_ingredient_group_from_raw()
 */
export function isIngredientMatch(group: string, candidateLines: string[]): boolean {
  const gClean = stripAccents(group.toLowerCase()).trim();
  const gWords = tokenize(gClean);
  if (!gWords.length) return false;

  for (const line of candidateLines) {
    const rawClean = stripAccents(line.toLowerCase()).trim();
    const iWords = tokenize(rawClean);
    if (!iWords.length) continue;

    let matches = 0;
    for (const gw of gWords) {
      const best = Math.max(...iWords.map((iw) => similarity(gw, iw)));
      if (best >= 78) matches++;
    }

    const coverage = matches / gWords.length;
    const literalMatch = rawClean.includes(gClean);

    console.log(coverage, literalMatch, " | ", group, candidateLines)

    if ((coverage >= 0.7 || literalMatch) && !rawClean.startsWith(gClean)) {
      return true;
    }
  }
  return false;
}
