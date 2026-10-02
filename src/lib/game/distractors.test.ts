import { describe, expect, it } from 'vitest';
import { geoDistance } from 'd3-geo';
import { COUNTRIES, country, filterCountries } from '../data';
import { pickDistractors } from './distractors';
import { createRng } from './random';

const km = (a: string, b: string) => geoDistance(country(a).map.point, country(b).map.point) * 6371;

describe('distracteurs', () => {
  it('carte : la Norvège est entourée de pays voisins ou proches, jamais de pays lointains', () => {
    const rng = createRng(1);
    for (let i = 0; i < 50; i++) {
      const picked = pickDistractors(country('NOR'), COUNTRIES, COUNTRIES, 3, { rng, hard: false, similarity: 'neighbor' });
      expect(picked).toHaveLength(3);
      for (const c of picked) expect(km('NOR', c.id)).toBeLessThan(2000);
    }
  });

  it('capitales : les mauvaises réponses viennent de la même région du monde', () => {
    const rng = createRng(2);
    for (const id of ['FRA', 'SEN', 'PER', 'THA', 'KAZ']) {
      const target = country(id);
      const picked = pickDistractors(target, COUNTRIES, COUNTRIES, 3, { rng, hard: false, similarity: 'region', display: (c) => c.capital });
      for (const c of picked) expect(c.continents.some((k) => target.continents.includes(k)) || km(id, c.id) < 3000).toBe(true);
    }
  });

  it('drapeaux : les drapeaux ressemblants sortent en premier en mode difficile', () => {
    const picked = pickDistractors(country('TCD'), COUNTRIES, COUNTRIES, 3, {
      rng: createRng(3),
      hard: true,
      similarity: 'flag',
      display: (c) => c.iso2,
    });
    expect(picked.map((c) => c.id).sort()).toEqual(['AND', 'MDA', 'ROU']);
  });

  it('ne répète jamais une réponse et exclut la bonne', () => {
    const rng = createRng(4);
    const pool = filterCountries({ continents: ['europe'], maxTier: 1 });
    for (const target of pool) {
      const picked = pickDistractors(target, pool, COUNTRIES, 3, { rng, hard: false, similarity: 'neighbor' });
      expect(new Set(picked.map((c) => c.id)).size).toBe(3);
      expect(picked.map((c) => c.id)).not.toContain(target.id);
    }
  });
});
