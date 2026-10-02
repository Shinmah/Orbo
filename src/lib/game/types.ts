import type { Country } from '../data/types';
import type { Rng } from './random';
import type { Skill } from './skills';

export type { Skill } from './skills';

/** Façon de répondre : QCM, saisie libre, ou clic sur la carte. */
export type Format = 'choice' | 'input' | 'map';

export type ModeId =
  | 'country-to-capital'
  | 'capital-to-country'
  | 'flag-to-country'
  | 'country-to-flag'
  | 'locate-on-map'
  | 'name-on-map';

/** Morceau de phrase, éventuellement mis en valeur (« Quelle est la capitale **du Japon** ? »). */
export interface TextPart {
  t: string;
  em?: boolean;
}

export type Prompt =
  | { kind: 'text'; parts: TextPart[] }
  | { kind: 'flag'; iso2: string; parts: TextPart[] }
  | { kind: 'map'; parts: TextPart[]; highlight?: string };

export interface Choice {
  id: string;
  label: string;
  iso2?: string;
}

export type AnswerSpec =
  | { kind: 'choice'; display: 'text' | 'flag'; choices: Choice[]; correctId: string }
  | { kind: 'input'; accepted: string[]; confusables: string[]; placeholder: string }
  | { kind: 'map'; targetId: string };

export interface Question {
  /** Identifiant de la « carte de révision » : mode + pays. */
  key: string;
  mode: ModeId;
  skill: Skill;
  format: Format;
  countryId: string;
  prompt: Prompt;
  answer: AnswerSpec;
  /** Correction affichée après la réponse. */
  solution: { label: string; iso2?: string; note?: string };
}

export type Response =
  | { kind: 'choice'; choiceId: string }
  | { kind: 'input'; text: string }
  | { kind: 'map'; countryId: string }
  | { kind: 'skip' };

export interface Outcome {
  correct: boolean;
  /** Accepté malgré une faute de frappe : on montre la bonne orthographe. */
  typo?: boolean;
  /** Ce que le joueur a répondu, pour la correction. */
  given?: string;
  /** Pour la carte : identifiant du pays cliqué et distance à la cible. */
  pickedId?: string;
  distanceKm?: number;
}

export interface BuildContext {
  format: Format;
  /** Pays de la partie (filtres appliqués) : on y pioche les distracteurs en priorité. */
  pool: Country[];
  /** Tous les pays (repli si le pool est trop petit). */
  all: Country[];
  rng: Rng;
  /** Distracteurs plus trompeurs (pays voisins, drapeaux ressemblants). */
  hard: boolean;
  /** Nombre de choix pour un QCM. */
  choices: number;
}

/**
 * Un mode de jeu. Pour en ajouter un : créer un fichier dans modes/ qui exporte
 * un objet GameMode, puis l'ajouter au registre (modes/index.ts).
 */
export interface GameMode {
  id: ModeId;
  skill: Skill;
  /** Libellé court du sens de la question (« Pays → capitale »). */
  label: string;
  /** Formats possibles, du plus facile au plus difficile. */
  formats: Format[];
  eligible(c: Country): boolean;
  build(c: Country, ctx: BuildContext): Question;
}
