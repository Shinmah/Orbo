/**
 * Jeu « Chemin » : relier un pays de départ à un pays d'arrivée en nommant
 * les pays traversés, de frontière terrestre en frontière terrestre.
 *
 * Tout est calculé sur le graphe des frontières (parcours en largeur) :
 * - un pays proposé est « sur le chemin » s'il appartient à un plus court chemin,
 *   « proche » s'il ne rallonge le trajet que d'un pays, « éloigné » sinon ;
 * - la partie est gagnée dès que les pays proposés relient le départ à l'arrivée ;
 * - variante : un pays interdit, qu'on ne peut pas traverser.
 */
import { COUNTRIES, BY_ID, filterCountries } from '../data';
import type { ContinentId, Country } from '../data/types';
import { allowedTypos, editDistance, matchKey } from './matching';
import { pick, shuffle, type Rng } from './random';

export type PathLength = 'short' | 'medium' | 'long';
export type ForbiddenMode = 'never' | 'sometimes' | 'always';
export type GuessQuality = 'optimal' | 'close' | 'far';

export interface PathOptions {
  continents: ContinentId[];
  length: PathLength;
  forbidden: ForbiddenMode;
  start?: string;
  end?: string;
}

export interface PathPuzzle {
  start: string;
  end: string;
  forbidden?: string;
  /** Nombre minimal de pays à traverser (départ et arrivée exclus). */
  minSteps: number;
  /** Nombre d'essais autorisés. */
  maxGuesses: number;
}

/** Nombre de pays intermédiaires visé selon la longueur choisie. */
export const LENGTHS: Record<PathLength, { label: string; min: number; max: number }> = {
  short: { label: 'Court', min: 1, max: 2 },
  medium: { label: 'Moyen', min: 3, max: 4 },
  long: { label: 'Long', min: 5, max: 8 },
};

/** Essais en plus du minimum : on a le droit de se tromper un peu. */
export const SPARE_GUESSES = 4;

type Graph = Map<string, string[]>;
const GRAPH: Graph = new Map(COUNTRIES.map((c) => [c.id, c.neighbors]));

/** Distances (en nombre de frontières) depuis `from`, sans traverser les pays bloqués. */
export function distancesFrom(from: string, blocked: ReadonlySet<string> = new Set(), allowed?: ReadonlySet<string>) {
  const dist = new Map<string, number>([[from, 0]]);
  const queue = [from];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    for (const n of GRAPH.get(id) ?? []) {
      if (dist.has(n) || blocked.has(n) || (allowed && !allowed.has(n))) continue;
      dist.set(n, dist.get(id)! + 1);
      queue.push(n);
    }
  }
  return dist;
}

/** Un plus court chemin de `a` à `b` (extrémités comprises), ou null. */
export function shortestPath(
  a: string,
  b: string,
  blocked: ReadonlySet<string> = new Set(),
  allowed?: ReadonlySet<string>,
): string[] | null {
  const prev = new Map<string, string>();
  const seen = new Set([a]);
  const queue = [a];
  for (let i = 0; i < queue.length; i++) {
    const id = queue[i];
    if (id === b) break;
    for (const n of GRAPH.get(id) ?? []) {
      if (seen.has(n) || blocked.has(n) || (allowed && !allowed.has(n) && n !== b)) continue;
      seen.add(n);
      prev.set(n, id);
      queue.push(n);
    }
  }
  if (!seen.has(b)) return null;
  const path = [b];
  while (path[0] !== a) path.unshift(prev.get(path[0])!);
  return path;
}

const blockedOf = (p: Pick<PathPuzzle, 'forbidden'>) => new Set(p.forbidden ? [p.forbidden] : []);

/** Qualité d'un pays proposé : sur un plus court chemin, proche, ou éloigné. */
export function guessQuality(p: PathPuzzle, id: string): GuessQuality {
  const blocked = blockedOf(p);
  const fromStart = distancesFrom(p.start, blocked);
  const fromEnd = distancesFrom(p.end, blocked);
  const best = fromStart.get(p.end)!;
  const via = (fromStart.get(id) ?? Infinity) + (fromEnd.get(id) ?? Infinity);
  if (via === best) return 'optimal';
  if (via <= best + 1) return 'close';
  return 'far';
}

/** Chemin trouvé avec les pays proposés (ou null si le départ et l'arrivée ne sont pas encore reliés). */
export function solvedPath(p: PathPuzzle, guessed: Iterable<string>): string[] | null {
  const allowed = new Set([...guessed, p.start, p.end]);
  return shortestPath(p.start, p.end, blockedOf(p), allowed);
}

/** Prochain pays utile à proposer (pour l'indice) : il rapproche au mieux de l'arrivée. */
export function nextHint(p: PathPuzzle, guessed: ReadonlySet<string>): string | null {
  const blocked = blockedOf(p);
  // Pays déjà reliés au départ par les propositions.
  const reached = distancesFrom(p.start, blocked, new Set([...guessed, p.start]));
  const fromEnd = distancesFrom(p.end, blocked);
  let best: { id: string; d: number } | null = null;
  for (const id of reached.keys()) {
    for (const n of GRAPH.get(id) ?? []) {
      if (n === p.end || guessed.has(n) || blocked.has(n) || n === p.start) continue;
      const d = fromEnd.get(n) ?? Infinity;
      if (!best || d < best.d || (d === best.d && n < best.id)) best = { id: n, d };
    }
  }
  return best && best.d < Infinity ? best.id : null;
}

/** Pays pouvant servir de départ ou d'arrivée (au moins une frontière terrestre). */
export const pathCountries = (continents: ContinentId[] = []): Country[] =>
  filterCountries({ continents, maxTier: 4 }).filter((c) => c.neighbors.length > 0);

/**
 * Choisit un pays interdit : sur un plus court chemin, qu'on peut contourner en au plus
 * 3 pays de plus. De préférence un pays qui oblige vraiment à faire un détour.
 */
function chooseForbidden(start: string, end: string, rng: Rng): { id: string; minSteps: number } | null {
  const base = distancesFrom(start).get(end)!;
  const fromStart = distancesFrom(start);
  const fromEnd = distancesFrom(end);
  const onPath = COUNTRIES.filter(
    (c) => c.id !== start && c.id !== end && (fromStart.get(c.id) ?? Infinity) + (fromEnd.get(c.id) ?? Infinity) === base,
  );
  const options = shuffle(onPath, rng)
    .map((c) => ({ id: c.id, d: distancesFrom(start, new Set([c.id])).get(end) }))
    .filter((o): o is { id: string; d: number } => o.d !== undefined && o.d <= base + 3);
  const best = options.find((o) => o.d > base) ?? options[0];
  return best ? { id: best.id, minSteps: best.d - 1 } : null;
}

/**
 * Génère une partie. Lève une erreur explicite si le départ et l'arrivée choisis
 * ne sont pas reliés par la terre.
 */
export function generatePuzzle(opts: PathOptions, rng: Rng): PathPuzzle {
  const pool = pathCountries(opts.continents);
  const { min, max } = LENGTHS[opts.length];
  const wantForbidden = opts.forbidden === 'always' || (opts.forbidden === 'sometimes' && rng() < 0.4);

  const make = (start: string, end: string): PathPuzzle | null => {
    const d = distancesFrom(start).get(end);
    if (d === undefined || d < 2) return null;
    let minSteps = d - 1;
    let forbidden: string | undefined;
    if (wantForbidden) {
      const f = chooseForbidden(start, end, rng);
      if (f) {
        forbidden = f.id;
        minSteps = f.minSteps;
      } else if (opts.forbidden === 'always' && !(opts.start && opts.end)) {
        return null;
      }
    }
    return { start, end, forbidden, minSteps, maxGuesses: minSteps + SPARE_GUESSES };
  };

  if (opts.start && opts.end) {
    if (opts.start === opts.end) throw new Error('Le départ et l’arrivée doivent être différents.');
    const d = distancesFrom(opts.start).get(opts.end);
    if (d === undefined) throw new Error(`Pas de chemin terrestre entre ${BY_ID.get(opts.start)!.name} et ${BY_ID.get(opts.end)!.name}.`);
    if (d < 2) throw new Error(`${BY_ID.get(opts.start)!.name} et ${BY_ID.get(opts.end)!.name} sont voisins : rien à traverser !`);
    return make(opts.start, opts.end)!;
  }

  for (let attempt = 0; attempt < 400; attempt++) {
    const start = opts.start ?? pick(pool, rng).id;
    const dist = distancesFrom(start);
    const ends = (opts.end ? pool.filter((c) => c.id === opts.end) : pool).filter((c) => {
      const d = dist.get(c.id);
      return d !== undefined && d - 1 >= min && d - 1 <= max;
    });
    if (!ends.length) continue;
    const puzzle = make(start, opts.end ?? pick(ends, rng).id);
    if (puzzle && (opts.start || opts.end ? puzzle : puzzle.minSteps >= min)) return puzzle;
  }
  throw new Error('Aucun chemin de cette longueur dans cette région. Essaie une autre longueur ou une autre région.');
}

/** Retrouve un pays à partir d'un nom tapé (accents, tirets et petites fautes tolérés). */
export function findCountry(input: string): Country | null {
  const key = matchKey(input);
  if (!key) return null;
  let best: { c: Country; d: number; allowed: number } | null = null;
  let tie = false;
  for (const c of COUNTRIES) {
    for (const name of [c.name, ...c.altNames]) {
      const k = matchKey(name);
      if (k === key) return c;
      const d = editDistance(key, k);
      if (!best || d < best.d) {
        best = { c, d, allowed: allowedTypos(k) };
        tie = false;
      } else if (d === best.d && best.c !== c) {
        tie = true;
      }
    }
  }
  return best && !tie && best.d <= best.allowed ? best.c : null;
}

/** Points d'une partie gagnée : 100 pour un chemin parfait, moins les essais en trop et les indices. */
export function pathScore(p: PathPuzzle, guesses: number, hints: number): number {
  return Math.max(10, 100 - (guesses - p.minSteps) * 10 - hints * 15);
}
