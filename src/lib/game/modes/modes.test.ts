import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '../../data';
import { createRng } from '../random';
import type { BuildContext, Format } from '../types';
import { MODE_LIST } from './index';

describe.each(MODE_LIST.map((m) => [m.id, m] as const))('mode %s', (_id, mode) => {
  const eligible = COUNTRIES.filter((c) => mode.eligible(c));

  it('a des pays éligibles', () => {
    expect(eligible.length).toBeGreaterThan(150);
  });

  it.each(mode.formats.map((f) => [f]))('construit une question valide pour chaque pays (format %s)', (format: Format) => {
    const rng = createRng(42);
    for (const c of eligible) {
      for (const hard of [false, true]) {
        const ctx: BuildContext = { format, pool: COUNTRIES, all: COUNTRIES, rng, hard, choices: 4 };
        const q = mode.build(c, ctx);
        expect(q.countryId).toBe(c.id);
        expect(q.key).toBe(`${mode.id}:${c.id}`);
        expect(q.prompt.parts.map((p) => p.t).join('')).not.toMatch(/undefined|null/);
        if (q.answer.kind === 'choice') {
          const { choices, correctId } = q.answer;
          expect(choices).toHaveLength(4);
          expect(choices.filter((x) => x.id === correctId)).toHaveLength(1);
          const shown = choices.map((x) => (q.answer.kind === 'choice' && q.answer.display === 'flag' ? x.iso2 : x.label));
          expect(new Set(shown).size).toBe(4);
        }
        if (q.answer.kind === 'input') {
          expect(q.answer.accepted.length).toBeGreaterThan(0);
          expect(q.answer.confusables).not.toContain(q.answer.accepted[0]);
        }
      }
    }
  });
});

it('la capitale → pays exclut les cités-États et Jérusalem', () => {
  const mode = MODE_LIST.find((m) => m.id === 'capital-to-country')!;
  const excluded = COUNTRIES.filter((c) => !mode.eligible(c)).map((c) => c.id).sort();
  expect(excluded).toEqual(expect.arrayContaining(['ISR', 'PSE', 'SGP', 'MCO', 'VAT', 'LUX', 'DJI']));
  expect(excluded).not.toContain('FRA');
});
