/**
 * Registre des modes de jeu.
 * Ajouter un mode : écrire un GameMode (voir capitals.ts) et l'ajouter ci-dessous.
 */
import type { GameMode, ModeId, Skill } from '../types';
import { capitalToCountry, countryToCapital } from './capitals';
import { countryToFlag, flagToCountry } from './flags';
import { locateOnMap, nameOnMap } from './map';

export const MODES: Record<ModeId, GameMode> = {
  'country-to-capital': countryToCapital,
  'capital-to-country': capitalToCountry,
  'flag-to-country': flagToCountry,
  'country-to-flag': countryToFlag,
  'locate-on-map': locateOnMap,
  'name-on-map': nameOnMap,
};

export const MODE_LIST = Object.values(MODES);

export const modesForSkill = (skill: Skill): GameMode[] => MODE_LIST.filter((m) => m.skill === skill);
