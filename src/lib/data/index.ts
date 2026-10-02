import raw from './countries.json';
import type { ContinentId, Country, CountryData, Tier } from './types';

export type { ContinentId, Country, Tier } from './types';

export const DATA = raw as unknown as CountryData;
export const COUNTRIES: Country[] = DATA.countries;
export const BY_ID = new Map(COUNTRIES.map((c) => [c.id, c]));

export const country = (id: string): Country => {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`Pays inconnu : ${id}`);
  return c;
};

export const CONTINENTS: { id: ContinentId; label: string }[] = [
  { id: 'africa', label: 'Afrique' },
  { id: 'north-america', label: 'Amérique du Nord' },
  { id: 'south-america', label: 'Amérique du Sud' },
  { id: 'asia', label: 'Asie' },
  { id: 'europe', label: 'Europe' },
  { id: 'oceania', label: 'Océanie' },
];

export const TIERS: { tier: Tier; label: string; description: string }[] = [
  { tier: 1, label: 'Facile', description: 'Les pays les plus connus' },
  { tier: 2, label: 'Moyen', description: 'Les grands classiques' },
  { tier: 3, label: 'Difficile', description: 'Pour aller plus loin' },
  { tier: 4, label: 'Expert', description: 'Micro-États et petites îles compris' },
];

export interface CountryFilter {
  /** Vide = le monde entier. */
  continents: ContinentId[];
  /** Niveau maximum inclus (les niveaux sont cumulatifs). */
  maxTier: Tier;
}

export function filterCountries(f: CountryFilter, list: Country[] = COUNTRIES): Country[] {
  return list.filter(
    (c) => c.tier <= f.maxTier && (f.continents.length === 0 || c.continents.some((k) => f.continents.includes(k))),
  );
}
