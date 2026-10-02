import { describe, expect, it } from 'vitest';
import { COUNTRIES, country } from '../data';
import type { SessionConfig } from './config';
import { evaluate, pointsFor } from './evaluate';
import { MODES } from './modes';
import { createRng } from './random';
import { buildQuestions, cardKey, planSession } from './selection';
import { autoFormat, INPUT_FROM_BOX, review, type Card } from './srs';

const base: SessionConfig = {
  skill: 'capital',
  modes: ['country-to-capital'],
  continents: [],
  maxTier: 4,
  format: 'auto',
  length: 10,
};

describe('planSession', () => {
  it('respecte la longueur et ne répète pas un pays', () => {
    const plan = planSession(base, COUNTRIES, {}, Date.now(), createRng(1));
    expect(plan).toHaveLength(10);
    expect(new Set(plan.map((p) => p.country.id)).size).toBe(10);
  });

  it('applique les filtres de continent et de niveau', () => {
    const plan = planSession({ ...base, continents: ['europe'], maxTier: 1, length: 0 }, COUNTRIES, {}, Date.now(), createRng(2));
    expect(plan.length).toBeGreaterThan(5);
    for (const p of plan) {
      expect(p.country.continents).toContain('europe');
      expect(p.country.tier).toBe(1);
    }
  });

  it('est reproductible avec la même graine (défi du jour)', () => {
    const a = planSession(base, COUNTRIES, {}, 0, createRng(123)).map((p) => p.country.id);
    const b = planSession(base, COUNTRIES, {}, 0, createRng(123)).map((p) => p.country.id);
    expect(a).toEqual(b);
  });

  it('en révision, ne propose que les cartes ratées ou échues, les plus urgentes d’abord', () => {
    const now = Date.now();
    const cards: Record<string, Card> = {
      [cardKey('country-to-capital', 'AUS')]: review(undefined, false, now - 1000),
      [cardKey('country-to-capital', 'FRA')]: review(review(undefined, true, now), true, now),
    };
    const plan = planSession({ ...base, review: true, length: 0 }, COUNTRIES, cards, now, createRng(3));
    expect(plan.map((p) => p.country.id)).toEqual(['AUS']);
  });

  it('passe en saisie libre quand le pays est maîtrisé', () => {
    const now = Date.now();
    let card: Card | undefined;
    for (let i = 0; i < INPUT_FROM_BOX; i++) card = review(card, true, now);
    expect(autoFormat(MODES['country-to-capital'], undefined)).toBe('choice');
    expect(autoFormat(MODES['country-to-capital'], card)).toBe('input');
    expect(autoFormat(MODES['country-to-flag'], card)).toBe('choice');
    expect(autoFormat(MODES['locate-on-map'], card)).toBe('map');
  });
});

describe('evaluate', () => {
  const rng = createRng(5);
  const [q] = buildQuestions(
    [{ mode: MODES['country-to-capital'], country: country('BFA'), format: 'input', hard: false }],
    base,
    COUNTRIES,
    rng,
  );

  it('accepte une faute de frappe et le signale', () => {
    const o = evaluate(q, { kind: 'input', text: 'ouagadougu' });
    expect(o).toMatchObject({ correct: true, typo: true });
    expect(pointsFor(q, o, 0)).toBe(15);
  });

  it('refuse une autre capitale', () => {
    expect(evaluate(q, { kind: 'input', text: 'Niamey' }).correct).toBe(false);
  });

  it('calcule la distance quand on clique à côté sur la carte', () => {
    const [m] = buildQuestions(
      [{ mode: MODES['locate-on-map'], country: country('FRA'), format: 'map', hard: false }],
      base,
      COUNTRIES,
      rng,
    );
    const o = evaluate(m, { kind: 'map', countryId: 'ESP' });
    expect(o.correct).toBe(false);
    expect(o.distanceKm).toBeGreaterThan(500);
    expect(o.distanceKm).toBeLessThan(1500);
    expect(evaluate(m, { kind: 'map', countryId: 'FRA' }).correct).toBe(true);
  });
});

describe('srs', () => {
  it('renvoie en boîte 0 après une erreur', () => {
    const now = Date.now();
    const c = review(review(review(undefined, true, now), true, now), false, now);
    expect(c.box).toBe(0);
    expect(c.wrong).toBe(1);
    expect(c.correct).toBe(2);
  });
});
