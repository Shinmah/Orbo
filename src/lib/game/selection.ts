import { filterCountries } from '../data';
import type { Country } from '../data/types';
import type { SessionConfig } from './config';
import { MODES } from './modes';
import { shuffle, weightedSample, type Rng } from './random';
import { autoFormat, isDue, reviewRank, weight, type Card } from './srs';
import type { BuildContext, Format, GameMode, Question } from './types';

export interface PlannedQuestion {
  mode: GameMode;
  country: Country;
  format: Format;
  hard: boolean;
}

export const cardKey = (mode: string, countryId: string) => `${mode}:${countryId}`;

export function poolFor(config: SessionConfig, all: Country[]): Country[] {
  const base = config.only ? all.filter((c) => config.only!.includes(c.id)) : filterCountries(config, all);
  return base;
}

function formatFor(config: SessionConfig, mode: GameMode, card: Card | undefined): Format {
  if (config.format === 'auto') return autoFormat(mode, card);
  return mode.formats.includes(config.format) ? config.format : mode.formats[0];
}

/** Cartes à revoir : déjà vues, échues ou ratées, les plus urgentes d'abord. */
export function dueCards(
  pool: Country[],
  modes: GameMode[],
  cards: Record<string, Card>,
  now: number,
): { mode: GameMode; country: Country; card: Card }[] {
  const out: { mode: GameMode; country: Country; card: Card }[] = [];
  for (const country of pool) for (const mode of modes) {
    if (!mode.eligible(country)) continue;
    const card = cards[cardKey(mode.id, country.id)];
    if (card && card.seen > 0 && (isDue(card, now) || card.box === 0)) out.push({ mode, country, card });
  }
  return out.sort((a, b) => reviewRank(a.card, now) - reviewRank(b.card, now));
}

/**
 * Choisit les questions d'une partie : un pays n'apparaît qu'une fois,
 * les pays ratés ou à réviser sortent plus souvent.
 */
export function planSession(
  config: SessionConfig,
  all: Country[],
  cards: Record<string, Card>,
  now: number,
  rng: Rng,
): PlannedQuestion[] {
  const pool = poolFor(config, all);
  const modes = config.modes.map((id) => MODES[id]);
  const plan = (mode: GameMode, country: Country): PlannedQuestion => {
    const card = cards[cardKey(mode.id, country.id)];
    const format = formatFor(config, mode, card);
    return { mode, country, format, hard: format === 'input' || (card?.box ?? 0) >= 2 || config.maxTier >= 3 };
  };

  if (config.review) {
    const due = dueCards(pool, modes, cards, now);
    const seen = new Set<string>();
    const picked = due.filter((d) => !seen.has(d.country.id) && seen.add(d.country.id));
    const n = config.length > 0 ? config.length : picked.length;
    return shuffle(picked.slice(0, n), rng).map((d) => plan(d.mode, d.country));
  }

  const options = pool
    .map((country) => {
      const eligible = modes.filter((m) => m.eligible(country));
      const weights = eligible.map((m) => weight(cards[cardKey(m.id, country.id)], now));
      return { country, eligible, weights, w: Math.max(0, ...weights) };
    })
    .filter((o) => o.eligible.length > 0);

  const n = config.length > 0 ? Math.min(config.length, options.length) : options.length;
  return weightedSample(options, (o) => o.w, n, rng).map((o) => {
    const [mode] = weightedSample(o.eligible, (m) => o.weights[o.eligible.indexOf(m)], 1, rng);
    return plan(mode, o.country);
  });
}

export function buildQuestions(plan: PlannedQuestion[], config: SessionConfig, all: Country[], rng: Rng): Question[] {
  const pool = poolFor(config, all);
  return plan.map(({ mode, country, format, hard }) => {
    const ctx: BuildContext = {
      format,
      pool,
      all,
      rng,
      hard,
      choices: mode.id === 'country-to-flag' && hard ? 6 : 4,
    };
    return mode.build(country, ctx);
  });
}
