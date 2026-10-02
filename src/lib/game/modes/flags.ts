import { capitalOfPhrase } from '../../data/grammar';
import type { GameMode } from '../types';
import { countryChoices, countryNames, textInput } from './shared';

export const flagToCountry: GameMode = {
  id: 'flag-to-country',
  skill: 'flag',
  label: 'Drapeau → pays',
  formats: ['choice', 'input'],
  eligible: () => true,
  build(c, ctx) {
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: ctx.format,
      countryId: c.id,
      prompt: { kind: 'flag', iso2: c.iso2, parts: [{ t: 'De quel pays est ce drapeau ?' }] },
      answer:
        ctx.format === 'input'
          ? textInput(c, ctx, countryNames, 'Nom du pays…')
          : countryChoices(c, ctx, { similarity: 'flag', label: (x) => x.name }),
      solution: { label: c.name, iso2: c.iso2 },
    };
  },
};

export const countryToFlag: GameMode = {
  id: 'country-to-flag',
  skill: 'flag',
  label: 'Pays → drapeau',
  // On ne peut pas « taper » un drapeau : le niveau expert propose plus de choix, plus ressemblants.
  formats: ['choice'],
  eligible: () => true,
  build(c, ctx) {
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: 'choice',
      countryId: c.id,
      prompt: { kind: 'text', parts: [{ t: 'Quel est le drapeau ' }, { t: capitalOfPhrase(c), em: true }, { t: ' ?' }] },
      answer: countryChoices(c, ctx, { similarity: 'flag', label: (x) => x.name, display: 'flag' }),
      solution: { label: c.name, iso2: c.iso2 },
    };
  },
};
