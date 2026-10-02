import { geoDistance } from 'd3-geo';
import type { Country } from '../data/types';
import { shuffle, type Rng } from './random';

export type Similarity = 'region' | 'flag' | 'neighbor';

interface Options {
  rng: Rng;
  hard: boolean;
  similarity: Similarity;
  /** Valeur affichée : deux choix ne doivent jamais afficher le même texte. */
  display?: (c: Country) => string;
}

const distance = (a: Country, b: Country) => geoDistance(a.map.point, b.map.point);

/**
 * Candidats classés du plus trompeur au moins trompeur :
 * - carte : les pays les plus proches géographiquement ;
 * - drapeaux : drapeaux ressemblants, puis même sous-région, puis pays proches ;
 * - capitales / noms : même sous-région, puis pays proches.
 */
function ranked(target: Country, candidates: Country[], kind: Similarity): Country[] {
  const byDistance = [...candidates].sort((a, b) => distance(a, target) - distance(b, target));
  if (kind === 'neighbor') return byDistance;
  const sameRegion = byDistance.filter((c) => c.subregion === target.subregion);
  if (kind === 'flag') {
    const sameGroup = target.flagGroup === undefined ? [] : candidates.filter((c) => c.flagGroup === target.flagGroup);
    return [...new Set([...sameGroup, ...sameRegion, ...byDistance])];
  }
  return [...new Set([...sameRegion, ...byDistance])];
}

/**
 * Choisit `n` mauvaises réponses plausibles, à tous les niveaux : on pioche au hasard
 * parmi les candidats les plus proches (voisins, même région, drapeaux ressemblants),
 * pour qu'une réponse ne se devine jamais par élimination des pays « hors sujet ».
 * En mode difficile, on prend les plus trompeurs.
 */
export function pickDistractors(target: Country, pool: Country[], all: Country[], n: number, opts: Options): Country[] {
  const display = opts.display ?? ((c: Country) => c.name);
  const targetLabel = display(target);
  const usable = (list: Country[]) => list.filter((c) => c.id !== target.id && display(c) !== targetLabel);

  let candidates = usable(pool);
  if (candidates.length < n * 3) candidates = usable(all);

  const order = ranked(target, candidates, opts.similarity);
  // Fenêtre de tirage : les n plus proches (difficile) ou les n+3 plus proches (normal).
  const window = opts.hard ? n : n + 3;
  const ordered = [...shuffle(order.slice(0, window), opts.rng), ...order.slice(window)];

  const out: Country[] = [];
  const labels = new Set([targetLabel]);
  for (const c of ordered) {
    if (out.length === n) break;
    const label = display(c);
    if (labels.has(label)) continue;
    labels.add(label);
    out.push(c);
  }
  return out;
}
