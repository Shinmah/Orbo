/** Partie « Chemin » en cours : les options passent de l'écran de préparation à l'écran de jeu. */
import { router } from '../router.svelte';
import type { PathOptions } from './path';

const KEY = 'orbo:path-current';

export interface PathConfig extends PathOptions {
  seed?: number;
}

function load(): PathConfig | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PathConfig) : null;
  } catch {
    return null;
  }
}

class CurrentPath {
  config = $state<PathConfig | null>(load());
  run = $state(0);

  start(config: PathConfig) {
    this.config = { ...config, seed: config.seed ?? Date.now() };
    this.run++;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(this.config));
    } catch {
      /* ignoré */
    }
    if (router.current.name !== 'path') router.go('/chemin');
  }
}

export const currentPath = new CurrentPath();
