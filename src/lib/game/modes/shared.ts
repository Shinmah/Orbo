import type { Country } from '../../data/types';
import { matchKey } from '../matching';
import { pickDistractors, type Similarity } from '../distractors';
import { shuffle } from '../random';
import type { AnswerSpec, BuildContext, Choice } from '../types';

export const countryNames = (c: Country) => [c.name, ...c.altNames];
export const capitalNames = (c: Country) => [c.capital, ...c.capitalAlt];

/** QCM dont les choix sont des pays (affichés par leur nom, leur capitale ou leur drapeau). */
export function countryChoices(
  target: Country,
  ctx: BuildContext,
  opts: { similarity: Similarity; label: (c: Country) => string; display?: 'text' | 'flag' },
): AnswerSpec {
  const others = pickDistractors(target, ctx.pool, ctx.all, ctx.choices - 1, {
    rng: ctx.rng,
    hard: ctx.hard,
    similarity: opts.similarity,
    display: opts.display === 'flag' ? (c) => c.iso2 : opts.label,
  });
  const choices: Choice[] = shuffle([target, ...others], ctx.rng).map((c) => ({ id: c.id, label: opts.label(c), iso2: c.iso2 }));
  return { kind: 'choice', display: opts.display ?? 'text', choices, correctId: target.id };
}

/** Saisie libre : réponses acceptées + réponses des autres pays (pour refuser les confusions). */
export function textInput(target: Country, ctx: BuildContext, names: (c: Country) => string[], placeholder: string): AnswerSpec {
  const accepted = names(target);
  const own = new Set(accepted.map(matchKey));
  const confusables = ctx.all.filter((c) => c.id !== target.id).flatMap(names).filter((n) => !own.has(matchKey(n)));
  return { kind: 'input', accepted, confusables, placeholder };
}
