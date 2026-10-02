import { geoDistance } from 'd3-geo';
import { BY_ID } from '../data';
import { matchAnswer } from './matching';
import type { Outcome, Question, Response } from './types';

const EARTH_RADIUS_KM = 6371;

export function evaluate(q: Question, r: Response): Outcome {
  if (r.kind === 'skip') return { correct: false };
  const a = q.answer;

  if (a.kind === 'choice' && r.kind === 'choice') {
    const chosen = a.choices.find((c) => c.id === r.choiceId);
    return { correct: r.choiceId === a.correctId, given: chosen?.label };
  }

  if (a.kind === 'input' && r.kind === 'input') {
    const m = matchAnswer(r.text, a.accepted, a.confusables);
    return m.correct ? { correct: true, typo: !m.exact, given: r.text } : { correct: false, given: r.text };
  }

  if (a.kind === 'map' && r.kind === 'map') {
    if (r.countryId === a.targetId) return { correct: true, pickedId: r.countryId };
    const picked = BY_ID.get(r.countryId);
    const target = BY_ID.get(a.targetId);
    const distanceKm =
      picked && target ? Math.round((geoDistance(picked.map.point, target.map.point) * EARTH_RADIUS_KM) / 10) * 10 : undefined;
    return { correct: false, pickedId: r.countryId, given: picked?.name, distanceKm };
  }

  return { correct: false };
}

/** Points gagnés : plus pour la saisie libre et la carte, bonus de série plafonné. */
export function pointsFor(q: Question, o: Outcome, streak: number): number {
  if (!o.correct) return 0;
  const base = q.format === 'input' ? 20 : q.format === 'map' ? 15 : 10;
  return base - (o.typo ? 5 : 0) + Math.min(streak, 10);
}
