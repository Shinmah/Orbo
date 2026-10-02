import { capitalOfPhrase } from '../../data/grammar';
import { matchKey } from '../matching';
import type { GameMode } from '../types';
import { capitalNames, countryChoices, countryNames, textInput } from './shared';

export const countryToCapital: GameMode = {
  id: 'country-to-capital',
  skill: 'capital',
  label: 'Pays → capitale',
  formats: ['choice', 'input'],
  eligible: () => true,
  build(c, ctx) {
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: ctx.format,
      countryId: c.id,
      prompt: { kind: 'text', parts: [{ t: 'Quelle est la capitale ' }, { t: capitalOfPhrase(c), em: true }, { t: ' ?' }] },
      answer:
        ctx.format === 'input'
          ? textInput(c, ctx, capitalNames, 'Nom de la capitale…')
          : countryChoices(c, ctx, { similarity: 'region', label: (x) => x.capital }),
      solution: { label: c.capital, note: c.capitalNote },
    };
  },
};

export const capitalToCountry: GameMode = {
  id: 'capital-to-country',
  skill: 'capital',
  label: 'Capitale → pays',
  formats: ['choice', 'input'],
  // Exclut les cas ambigus (Jérusalem) et les cités-États dont la capitale porte le nom du pays.
  eligible: (c) => c.reverseCapital && !matchKey(c.capital).includes(matchKey(c.name)) && !matchKey(c.name).includes(matchKey(c.capital)),
  build(c, ctx) {
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: ctx.format,
      countryId: c.id,
      prompt: { kind: 'text', parts: [{ t: c.capital, em: true }, { t: ' est la capitale de quel pays ?' }] },
      answer:
        ctx.format === 'input'
          ? textInput(c, ctx, countryNames, 'Nom du pays…')
          : countryChoices(c, ctx, { similarity: 'region', label: (x) => x.name }),
      solution: { label: c.name, iso2: c.iso2, note: c.capitalNote },
    };
  },
};
