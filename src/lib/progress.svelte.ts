/**
 * Progression du joueur, sauvegardée localement (localStorage, format versionné).
 * Pas de compte : tout reste sur l'appareil.
 */
import { COUNTRIES } from './data';
import type { Country } from './data/types';
import { MODE_LIST, modesForSkill } from './game/modes';
import { cardKey } from './game/selection';
import { mastery, review, type Card, type Mastery } from './game/srs';
import type { Outcome, Question, Skill } from './game/types';
import { settings } from './settings.svelte';
import { loadJson, removeKey, saveJson } from './storage';

const KEY = 'orbo:progress';
const VERSION = 1;

export interface DayStats {
  answered: number;
  correct: number;
}

export interface ProgressData {
  version: number;
  cards: Record<string, Card>;
  days: Record<string, DayStats>;
  totals: { answered: number; correct: number; bestStreak: number; sessions: number; points: number };
  /** Jeu « Chemin ». */
  paths: { played: number; won: number; perfect: number; bestScore: number };
}

const empty = (): ProgressData => ({
  version: VERSION,
  cards: {},
  days: {},
  totals: { answered: 0, correct: 0, bestStreak: 0, sessions: 0, points: 0 },
  paths: { played: 0, won: 0, perfect: 0, bestScore: 0 },
});

function load(): ProgressData {
  const raw = loadJson<ProgressData | null>(KEY, null);
  if (!raw || typeof raw !== 'object' || raw.version !== VERSION) return empty();
  // Migration future : if (raw.version === 1) { … }
  return { ...empty(), ...raw, totals: { ...empty().totals, ...raw.totals }, paths: { ...empty().paths, ...raw.paths } };
}

/** Date locale au format AAAA-MM-JJ. */
export function dayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface CountryStats {
  country: Country;
  seen: number;
  correct: number;
  wrong: number;
  /** Taux d'erreur lissé, pour classer les pays « les plus ratés ». */
  errorScore: number;
}

class ProgressStore {
  data = $state<ProgressData>(load());

  private save() {
    saveJson(KEY, $state.snapshot(this.data));
  }

  card(mode: string, countryId: string): Card | undefined {
    return this.data.cards[cardKey(mode, countryId)];
  }

  /** Enregistre une réponse : carte de révision, stats du jour, totaux. */
  record(q: Question, o: Outcome, now = Date.now()) {
    this.data.cards[q.key] = review(this.data.cards[q.key], o.correct, now);
    const day = dayKey(new Date(now));
    const d = this.data.days[day] ?? { answered: 0, correct: 0 };
    this.data.days[day] = { answered: d.answered + 1, correct: d.correct + (o.correct ? 1 : 0) };
    this.data.totals.answered++;
    if (o.correct) this.data.totals.correct++;
    this.save();
  }

  /** Un pays proposé dans le jeu « Chemin » compte comme une réponse (juste s'il est sur un plus court chemin). */
  recordPathGuess(optimal: boolean, now = Date.now()) {
    const day = dayKey(new Date(now));
    const d = this.data.days[day] ?? { answered: 0, correct: 0 };
    this.data.days[day] = { answered: d.answered + 1, correct: d.correct + (optimal ? 1 : 0) };
    this.data.totals.answered++;
    if (optimal) this.data.totals.correct++;
    this.save();
  }

  endPath(won: boolean, perfect: boolean, points: number) {
    const p = this.data.paths;
    p.played++;
    if (won) p.won++;
    if (perfect) p.perfect++;
    p.bestScore = Math.max(p.bestScore, points);
    this.data.totals.sessions++;
    this.data.totals.points += points;
    this.save();
  }

  endSession(bestStreak: number, points: number) {
    const t = this.data.totals;
    t.sessions++;
    t.points += points;
    t.bestStreak = Math.max(t.bestStreak, bestStreak);
    this.save();
  }

  reset() {
    this.data = empty();
    removeKey(KEY);
  }

  // ------------------------------------------------------------ statistiques

  get today(): DayStats {
    return this.data.days[dayKey()] ?? { answered: 0, correct: 0 };
  }

  /** Jours consécutifs (jusqu'à aujourd'hui ou hier) où l'objectif quotidien a été atteint. */
  get dayStreak(): number {
    const goal = settings.value.dailyGoal;
    const d = new Date();
    if ((this.data.days[dayKey(d)]?.answered ?? 0) < goal) d.setDate(d.getDate() - 1);
    let n = 0;
    while ((this.data.days[dayKey(d)]?.answered ?? 0) >= goal) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  get daysPlayed(): number {
    return Object.values(this.data.days).filter((d) => d.answered > 0).length;
  }

  /** Maîtrise d'un pays pour une compétence = la meilleure des cartes de ses modes. */
  masteryOf(countryId: string, skill: Skill): Mastery {
    return Math.max(0, ...modesForSkill(skill).map((m) => mastery(this.card(m.id, countryId)))) as Mastery;
  }

  /** Nombre de pays connus (≥ 2) ou maîtrisés pour une compétence. */
  learnedCount(skill: Skill, countries: Country[] = COUNTRIES): number {
    return countries.filter((c) => this.masteryOf(c.id, skill) >= 2).length;
  }

  /** Nombre de pays à réviser maintenant (cartes déjà vues, ratées ou échues). */
  dueCount(skills: Skill[] = ['capital', 'flag', 'map'], now = Date.now()): number {
    const modes = new Set(MODE_LIST.filter((m) => skills.includes(m.skill)).map((m) => m.id));
    const countries = new Set<string>();
    for (const [key, c] of Object.entries(this.data.cards)) {
      const [mode, id] = key.split(':');
      if (modes.has(mode as never) && c.seen > 0 && (c.box === 0 || c.due <= now)) countries.add(id);
    }
    return countries.size;
  }

  /** Statistiques par pays, toutes compétences (ou une seule) confondues. */
  countryStats(skill?: Skill): CountryStats[] {
    const modes = new Set((skill ? modesForSkill(skill) : MODE_LIST).map((m) => m.id as string));
    const acc = new Map<string, { seen: number; correct: number; wrong: number }>();
    for (const [key, c] of Object.entries(this.data.cards)) {
      const [mode, id] = key.split(':');
      if (!modes.has(mode)) continue;
      const a = acc.get(id) ?? { seen: 0, correct: 0, wrong: 0 };
      acc.set(id, { seen: a.seen + c.seen, correct: a.correct + c.correct, wrong: a.wrong + c.wrong });
    }
    return COUNTRIES.filter((c) => acc.has(c.id)).map((country) => {
      const a = acc.get(country.id)!;
      return { country, ...a, errorScore: (a.wrong + 0.5) / (a.seen + 2) + a.wrong * 0.01 };
    });
  }

  /** Les pays les plus ratés. */
  mostMissed(limit = 10, skill?: Skill): CountryStats[] {
    return this.countryStats(skill)
      .filter((s) => s.wrong > 0)
      .sort((a, b) => b.errorScore - a.errorScore)
      .slice(0, limit);
  }
}

export const progress = new ProgressStore();
