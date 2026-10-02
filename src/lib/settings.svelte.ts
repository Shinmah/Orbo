import { loadJson, saveJson } from './storage';

export type Theme = 'auto' | 'light' | 'dark';
export type Motion = 'auto' | 'reduce';

export interface Settings {
  theme: Theme;
  motion: Motion;
  /** Objectif quotidien, en nombre de questions. */
  dailyGoal: number;
}

const KEY = 'orbo:settings';
const DEFAULTS: Settings = { theme: 'auto', motion: 'auto', dailyGoal: 20 };

class SettingsStore {
  value = $state<Settings>({ ...DEFAULTS, ...loadJson<Partial<Settings>>(KEY, {}) });

  constructor() {
    this.apply();
  }

  update(patch: Partial<Settings>) {
    this.value = { ...this.value, ...patch };
    saveJson(KEY, this.value);
    this.apply();
  }

  /** Reporte le thème et la préférence d'animation sur <html>. */
  apply() {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (this.value.theme === 'auto') delete root.dataset.theme;
    else root.dataset.theme = this.value.theme;
    if (this.value.motion === 'reduce') root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
  }

  /** Vrai si les animations doivent être coupées (réglage ou préférence système). */
  get reducedMotion(): boolean {
    if (this.value.motion === 'reduce') return true;
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}

export const settings = new SettingsStore();
