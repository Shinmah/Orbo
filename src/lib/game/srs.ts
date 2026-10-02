/**
 * Répétition espacée simple (système de Leitner à 6 boîtes).
 *
 * Chaque « carte » = un pays dans un mode de jeu (ex. capitale de l'Australie).
 * - bonne réponse : la carte monte d'une boîte et revient plus tard ;
 * - mauvaise réponse : retour à la boîte 0, elle redevient prioritaire.
 *
 * Niveaux affichés au joueur :
 * - « à revoir » : la dernière réponse était fausse ;
 * - « connu » : dès la première bonne réponse ;
 * - « maîtrisé » : 3 bonnes réponses d'affilée (espacées dans le temps).
 *
 * Passage automatique QCM → saisie : à partir de la boîte 2, c'est-à-dire après
 * deux bonnes réponses d'affilée, le pays est demandé en saisie libre.
 */
import type { Format, GameMode } from './types';

export interface Card {
  box: number;
  /** Date (ms) à partir de laquelle la carte est à réviser. */
  due: number;
  seen: number;
  correct: number;
  wrong: number;
  last: number;
}

const DAY = 24 * 60 * 60 * 1000;
/** Délai avant la prochaine révision, en jours, selon la boîte. */
export const INTERVAL_DAYS = [0, 1, 2, 4, 9, 21];
export const MAX_BOX = INTERVAL_DAYS.length - 1;
export const INPUT_FROM_BOX = 2;
export const MASTERED_FROM_BOX = 3;

export function review(card: Card | undefined, correct: boolean, now: number): Card {
  const c: Card = card ? { ...card } : { box: 0, due: now, seen: 0, correct: 0, wrong: 0, last: now };
  c.seen++;
  c.last = now;
  if (correct) {
    c.correct++;
    c.box = Math.min(c.box + 1, MAX_BOX);
  } else {
    c.wrong++;
    c.box = 0;
  }
  c.due = now + INTERVAL_DAYS[c.box] * DAY;
  return c;
}

export const isDue = (c: Card, now: number) => c.due <= now;

/** 0 = jamais vu, 1 = à revoir (dernière réponse fausse), 2 = connu, 3 = maîtrisé. */
export type Mastery = 0 | 1 | 2 | 3;
export function mastery(c: Card | undefined): Mastery {
  if (!c || c.seen === 0) return 0;
  if (c.box === 0) return 1;
  if (c.box >= MASTERED_FROM_BOX) return 3;
  return 2;
}

/**
 * Pourquoi réviser cette carte :
 * - failed : ratée la dernière fois (la plus urgente) ;
 * - due : sa date de révision est arrivée ;
 * - consolidate : connue mais pas encore maîtrisée, on peut la renforcer ;
 * - null : maîtrisée et pas encore à revoir.
 */
export type ReviewBucket = 'failed' | 'due' | 'consolidate';
export function reviewBucket(c: Card | undefined, now: number): ReviewBucket | null {
  if (!c || c.seen === 0) return null;
  if (c.box === 0) return 'failed';
  if (isDue(c, now)) return 'due';
  if (c.box < MASTERED_FROM_BOX) return 'consolidate';
  return null;
}
export const BUCKET_ORDER: Record<ReviewBucket, number> = { failed: 0, due: 1, consolidate: 2 };

/** Format choisi automatiquement pour ce pays dans ce mode. */
export function autoFormat(mode: GameMode, card: Card | undefined): Format {
  if (mode.formats.includes('input') && (card?.box ?? 0) >= INPUT_FROM_BOX) return 'input';
  return mode.formats[0];
}

/** Priorité d'une carte dans une partie libre : erreurs récentes > à réviser > nouvelles > connues. */
export function weight(c: Card | undefined, now: number): number {
  if (!c || c.seen === 0) return 3;
  if (c.box === 0) return 6 + Math.min(c.wrong, 4);
  if (isDue(c, now)) return 4;
  return 1 / (1 + c.box);
}

/** Priorité en mode révision (plus petit = plus urgent) : catégorie, puis boîte, erreurs, ancienneté. */
export function reviewRank(c: Card, now: number): number {
  const bucket = reviewBucket(c, now);
  const base = bucket === null ? 3000 : BUCKET_ORDER[bucket] * 1000;
  const overdueDays = Math.max(0, (now - c.due) / DAY);
  const ageDays = (now - c.last) / DAY;
  return base + c.box * 10 - Math.min(c.wrong, 5) * 2 - Math.min(overdueDays + ageDays, 30) * 0.2;
}
