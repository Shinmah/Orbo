/**
 * Comparaison tolérante des réponses tapées au clavier.
 *
 * - ignore accents, majuscules, tirets, apostrophes, espaces et articles initiaux
 *   (« la France », « cote d ivoire », « Port au Prince »…) ;
 * - tolère les fautes de frappe (distance de Damerau-Levenshtein) selon la longueur ;
 * - refuse une réponse plus proche d'une AUTRE réponse possible que de la bonne
 *   (« Niger » n'est pas accepté pour « Nigeria », ni « Irak » pour « Iran »).
 */

/** Forme canonique lisible (espaces conservés). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\bste\b/g, 'sainte')
    .replace(/\bst\b/g, 'saint')
    .trim()
    .replace(/^(le|la|les|l) (?=\S)/, '');
}

/** Clé de comparaison : forme canonique sans espaces. */
export const matchKey = (s: string) => normalize(s).replace(/ /g, '');

/** Distance de Damerau-Levenshtein (variante « optimal string alignment »). */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

/** Nombre de fautes tolérées selon la longueur de la bonne réponse. */
export function allowedTypos(key: string): number {
  if (key.length <= 4) return 0;
  if (key.length <= 8) return 1;
  return 2;
}

export type MatchResult =
  | { correct: true; exact: boolean; matched: string }
  | { correct: false; closest?: string };

/**
 * @param input       texte tapé
 * @param accepted    réponses acceptées (la première est la forme « officielle »)
 * @param confusables réponses des autres questions possibles (autres pays, autres capitales)
 */
export function matchAnswer(input: string, accepted: string[], confusables: string[] = []): MatchResult {
  const key = matchKey(input);
  if (!key) return { correct: false };

  let best = { d: Infinity, label: accepted[0], allowed: 0 };
  for (const a of accepted) {
    const k = matchKey(a);
    const d = editDistance(key, k);
    if (d < best.d) best = { d, label: a, allowed: allowedTypos(k) };
  }
  if (best.d === 0) return { correct: true, exact: true, matched: best.label };

  let closestOther = { d: Infinity, label: '' };
  for (const c of confusables) {
    const d = editDistance(key, matchKey(c));
    if (d < closestOther.d) closestOther = { d, label: c };
  }

  if (best.d <= best.allowed && best.d < closestOther.d) {
    return { correct: true, exact: false, matched: best.label };
  }
  return { correct: false, closest: closestOther.d <= 2 ? closestOther.label : undefined };
}
