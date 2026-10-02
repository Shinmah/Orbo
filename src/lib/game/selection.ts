import { filterCountries } from '../data';
import type { Country } from '../data/types';
import type { SessionConfig } from './config';
import { MODES } from './modes';
import { shuffle, weightedSample, type Rng } from './random';
import { autoFormat, reviewBucket, reviewRank, weight, type Card, type ReviewBucket } from './srs';
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

export interface ReviewItem {
  mode: GameMode;
  country: Country;
  card: Card;
  bucket: ReviewBucket;
}

/**
 * Cartes à réviser, les plus urgentes d'abord : ratées, puis échues, puis à consolider.
 * Un pays n'apparaît qu'une fois (sa carte la plus urgente).
 */
export function reviewCards(pool: Country[], modes: GameMode[], cards: Record<string, Card>, now: number): ReviewItem[] {
  const items: ReviewItem[] = [];
  for (const country of pool) for (const mode of modes) {
    if (!mode.eligible(country)) continue;
    const card = cards[cardKey(mode.id, country.id)];
    const bucket = reviewBucket(card, now);
    if (card && bucket) items.push({ mode, country, card, bucket });
  }
  items.sort((a, b) => reviewRank(a.card, now) - reviewRank(b.card, now));
  const seen = new Set<string>();
  return items.filter((i) => !seen.has(i.country.id) && (seen.add(i.country.id), true));
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
    // QCM plus piégeux pour les pays déjà connus, ou en partie libre de niveau Difficile/Expert.
    const freePlayHard = config.maxTier >= 3 && !config.review && !config.only;
    return { mode, country, format, hard: format === 'input' || (card?.box ?? 0) >= 2 || freePlayHard };
  };

  if (config.review) {
    const items = reviewCards(pool, modes, cards, now);
    const n = config.length > 0 ? config.length : items.length;
    return shuffle(items.slice(0, n), rng).map((d) => plan(d.mode, d.country));
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
