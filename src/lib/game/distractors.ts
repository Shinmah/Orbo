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

function similar(target: Country, candidates: Country[], kind: Similarity): Country[] {
  switch (kind) {
    case 'flag': {
      const group = target.flagGroup;
      const sameGroup = group === undefined ? [] : candidates.filter((c) => c.flagGroup === group);
      const sameRegion = candidates.filter((c) => c.subregion === target.subregion && !sameGroup.includes(c));
      return [...sameGroup, ...sameRegion];
    }
    case 'neighbor':
      return [...candidates]
        .filter((c) => c.continents.some((k) => target.continents.includes(k)))
        .sort((a, b) => geoDistance(a.map.point, target.map.point) - geoDistance(b.map.point, target.map.point))
        .slice(0, 8);
    case 'region':
      return candidates.filter((c) => c.subregion === target.subregion);
  }
}

/**
 * Choisit `n` mauvaises réponses plausibles.
 * - mode normal : un distracteur proche (même région) et le reste au hasard ;
 * - mode difficile : d'abord les plus trompeurs (voisins, drapeaux ressemblants).
 */
export function pickDistractors(target: Country, pool: Country[], all: Country[], n: number, opts: Options): Country[] {
  const display = opts.display ?? ((c: Country) => c.name);
  const targetLabel = display(target);
  const usable = (list: Country[]) => list.filter((c) => c.id !== target.id && display(c) !== targetLabel);

  let candidates = usable(pool);
  if (candidates.length < n * 2) candidates = usable(all);

  const close = shuffle(similar(target, candidates, opts.similarity), opts.rng);
  const ordered = opts.hard
    ? [...close.slice(0, n), ...shuffle(candidates, opts.rng)]
    : [...close.slice(0, 1), ...shuffle(candidates, opts.rng)];

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
