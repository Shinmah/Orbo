import { describe, expect, it } from 'vitest';
import { country } from '../data';
import { createRng } from './random';
import {
  distancesFrom,
  findCountry,
  generatePuzzle,
  guessQuality,
  LENGTHS,
  nextHint,
  pathScore,
  shortestPath,
  solvedPath,
  type PathPuzzle,
} from './path';

describe('graphe des frontières', () => {
  it('trouve un plus court chemin France → Turquie', () => {
    const path = shortestPath('FRA', 'TUR')!;
    expect(path[0]).toBe('FRA');
    expect(path.at(-1)).toBe('TUR');
    expect(path.length - 2).toBe(distancesFrom('FRA').get('TUR')! - 1);
    for (let i = 1; i < path.length; i++) expect(country(path[i - 1]).neighbors).toContain(path[i]);
  });

  it("n'a pas de chemin vers une île", () => {
    expect(shortestPath('FRA', 'JPN')).toBeNull();
  });

  it('contourne un pays interdit', () => {
    const direct = shortestPath('ESP', 'DEU')!;
    expect(direct).toEqual(['ESP', 'FRA', 'DEU']);
    // Sans la France, il faut passer par le Maroc (Ceuta) et faire le tour par le Moyen-Orient.
    const around = shortestPath('ESP', 'DEU', new Set(['FRA']))!;
    expect(around).not.toContain('FRA');
    expect(around[1]).toBe('MAR');
    expect(shortestPath('ITA', 'DEU', new Set(['AUT', 'CHE']))).toEqual(['ITA', 'FRA', 'DEU']);
  });
});

describe('partie', () => {
  const p: PathPuzzle = { start: 'FRA', end: 'POL', minSteps: 1, maxGuesses: 5 };

  it('classe les pays proposés', () => {
    expect(guessQuality(p, 'DEU')).toBe('optimal');
    expect(guessQuality(p, 'CZE')).toBe('close');
    expect(guessQuality(p, 'PRT')).toBe('far');
    expect(guessQuality(p, 'JPN')).toBe('far');
  });

  it('détecte la victoire quand les pays proposés relient départ et arrivée', () => {
    expect(solvedPath(p, ['CZE'])).toBeNull();
    expect(solvedPath(p, ['CHE', 'AUT', 'CZE'])).toEqual(['FRA', 'CHE', 'AUT', 'CZE', 'POL']);
    expect(solvedPath(p, ['CHE', 'AUT', 'CZE', 'DEU'])).toEqual(['FRA', 'DEU', 'POL']);
  });

  it("ne compte pas le pays interdit dans le chemin", () => {
    const q: PathPuzzle = { start: 'FRA', end: 'POL', forbidden: 'DEU', minSteps: 3, maxGuesses: 7 };
    expect(solvedPath(q, ['DEU'])).toBeNull();
    expect(guessQuality(q, 'DEU')).toBe('far');
    expect(guessQuality(q, 'CHE')).toBe('optimal');
  });

  it("propose un indice utile", () => {
    const hint = nextHint(p, new Set())!;
    expect(country('FRA').neighbors).toContain(hint);
    expect(guessQuality(p, hint)).toBe('optimal');
  });

  it('compte les points', () => {
    expect(pathScore(p, 1, 0)).toBe(100);
    expect(pathScore(p, 3, 1)).toBe(65);
    expect(pathScore(p, 20, 3)).toBe(10);
  });
});

describe('génération', () => {
  it.each(['short', 'medium', 'long'] as const)('respecte la longueur %s', (length) => {
    const rng = createRng(7);
    for (let i = 0; i < 30; i++) {
      const g = generatePuzzle({ continents: [], length, forbidden: 'never' }, rng);
      expect(g.minSteps).toBeGreaterThanOrEqual(LENGTHS[length].min);
      expect(g.minSteps).toBeLessThanOrEqual(LENGTHS[length].max);
      expect(distancesFrom(g.start).get(g.end)! - 1).toBe(g.minSteps);
    }
  });

  it('reste dans la région choisie', () => {
    const rng = createRng(8);
    for (let i = 0; i < 20; i++) {
      const g = generatePuzzle({ continents: ['europe'], length: 'medium', forbidden: 'never' }, rng);
      expect(country(g.start).continents).toContain('europe');
      expect(country(g.end).continents).toContain('europe');
    }
  });

  it('place un pays interdit contournable', () => {
    const rng = createRng(9);
    for (let i = 0; i < 20; i++) {
      const g = generatePuzzle({ continents: [], length: 'medium', forbidden: 'always' }, rng);
      expect(g.forbidden).toBeDefined();
      const path = shortestPath(g.start, g.end, new Set([g.forbidden!]))!;
      expect(path).not.toContain(g.forbidden);
      expect(path.length - 2).toBe(g.minSteps);
    }
  });

  it('accepte un départ et une arrivée choisis', () => {
    const g = generatePuzzle({ continents: [], length: 'short', forbidden: 'never', start: 'FRA', end: 'TUR' }, createRng(1));
    expect(g).toMatchObject({ start: 'FRA', end: 'TUR' });
    expect(() => generatePuzzle({ continents: [], length: 'short', forbidden: 'never', start: 'FRA', end: 'JPN' }, createRng(1))).toThrow(
      /Pas de chemin terrestre/,
    );
  });
});

describe('findCountry', () => {
  it('reconnaît les noms, alias et petites fautes', () => {
    expect(findCountry('allemagne')?.id).toBe('DEU');
    expect(findCountry('la Suisse')?.id).toBe('CHE');
    expect(findCountry('Tchequie')?.id).toBe('CZE');
    expect(findCountry('République tchèque')?.id).toBe('CZE');
    expect(findCountry('Hongri')?.id).toBe('HUN');
    expect(findCountry('Bulgari')?.id).toBe('BGR');
  });

  it('refuse les saisies ambiguës ou inconnues', () => {
    expect(findCountry('Atlantide')).toBeNull();
    expect(findCountry('')).toBeNull();
    expect(findCountry('Nigera')).toBeNull(); // aussi proche de Niger que de Nigeria
    expect(findCountry('Nigeria')?.id).toBe('NGA');
  });
});
