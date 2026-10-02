import { isPlural, withArticle } from '../../data/grammar';
import type { GameMode } from '../types';
import { countryChoices, countryNames, textInput } from './shared';

export const locateOnMap: GameMode = {
  id: 'locate-on-map',
  skill: 'map',
  label: 'Situer le pays',
  formats: ['map'],
  eligible: () => true,
  build(c) {
    const name = withArticle(c);
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: 'map',
      countryId: c.id,
      prompt: {
        kind: 'map',
        parts: [{ t: isPlural(c) ? 'Où se trouvent ' : 'Où se trouve ' }, { t: name, em: true }, { t: ' ?' }],
      },
      answer: { kind: 'map', targetId: c.id },
      solution: { label: c.name, iso2: c.iso2 },
    };
  },
};

export const nameOnMap: GameMode = {
  id: 'name-on-map',
  skill: 'map',
  label: 'Nommer le pays',
  formats: ['choice', 'input'],
  eligible: () => true,
  build(c, ctx) {
    return {
      key: `${this.id}:${c.id}`,
      mode: this.id,
      skill: this.skill,
      format: ctx.format,
      countryId: c.id,
      prompt: { kind: 'map', parts: [{ t: 'Quel est ce pays ?' }], highlight: c.id },
      answer:
        ctx.format === 'input'
          ? textInput(c, ctx, countryNames, 'Nom du pays…')
          : countryChoices(c, ctx, { similarity: 'neighbor', label: (x) => x.name }),
      solution: { label: c.name, iso2: c.iso2 },
    };
  },
};
