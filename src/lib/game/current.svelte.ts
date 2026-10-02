/** Partie en cours : la configuration passe de l'écran de préparation à l'écran de jeu. */
import { router } from '../router.svelte';
import type { SessionConfig } from './config';

const KEY = 'orbo:current';

function load(): SessionConfig | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionConfig) : null;
  } catch {
    return null;
  }
}

class CurrentSession {
  config = $state<SessionConfig | null>(load());
  /** Incrémenté à chaque lancement : force l'écran de jeu à repartir de zéro. */
  run = $state(0);

  start(config: SessionConfig) {
    this.config = { ...config, seed: config.seed ?? Date.now() };
    this.run++;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(this.config));
    } catch {
      /* ignoré */
    }
    if (router.current.name === 'play') return;
    router.go('/partie');
  }
}

export const current = new CurrentSession();
