import { describe, expect, it } from 'vitest';
import { editDistance, matchAnswer, normalize } from './matching';

describe('normalize', () => {
  it('ignore accents, casse, tirets, apostrophes et articles', () => {
    expect(normalize("Côte d'Ivoire")).toBe('cote d ivoire');
    expect(normalize('  LA  France ')).toBe('france');
    expect(normalize('Saint-Marin')).toBe('saint marin');
    expect(normalize('St Marin')).toBe('saint marin');
    expect(normalize('Nukuʻalofa')).toBe('nuku alofa');
    expect(normalize('Chișinău')).toBe('chisinau');
  });
});

describe('editDistance', () => {
  it('compte une transposition comme une seule faute', () => {
    expect(editDistance('paris', 'pairs')).toBe(1);
    expect(editDistance('niger', 'nigeria')).toBe(2);
    expect(editDistance('abc', 'abc')).toBe(0);
  });
});

describe('matchAnswer', () => {
  const others = ['Nigeria', 'Niger', 'Iran', 'Irak', 'Mali', 'Malawi'];

  it('accepte une saisie exacte modulo accents et tirets', () => {
    expect(matchAnswer('cote divoire', ["Côte d'Ivoire"])).toMatchObject({ correct: true });
    expect(matchAnswer('port au prince', ['Port-au-Prince'])).toMatchObject({ correct: true, exact: true });
  });

  it('tolère une faute de frappe sur un mot long', () => {
    const r = matchAnswer('Ouagadougu', ['Ouagadougou'], ['Niamey', 'Bamako']);
    expect(r).toMatchObject({ correct: true, exact: false });
  });

  it('refuse les mots courts mal écrits', () => {
    expect(matchAnswer('Lomo', ['Lima'], []).correct).toBe(false);
  });

  it('refuse une réponse qui désigne un autre pays', () => {
    expect(matchAnswer('Niger', ['Nigeria'], others.filter((o) => o !== 'Nigeria')).correct).toBe(false);
    expect(matchAnswer('Irak', ['Iran'], others.filter((o) => o !== 'Iran')).correct).toBe(false);
    expect(matchAnswer('Mali', ['Malawi'], others.filter((o) => o !== 'Malawi')).correct).toBe(false);
  });

  it('accepte les noms alternatifs', () => {
    expect(matchAnswer('Birmanie', ['Myanmar', 'Birmanie']).correct).toBe(true);
  });

  it('refuse une saisie vide', () => {
    expect(matchAnswer('   ', ['Paris']).correct).toBe(false);
  });
});
