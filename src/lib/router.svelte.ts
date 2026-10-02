/**
 * Routeur minimal basé sur le hash (#/stats) : fonctionne à l'identique dans le
 * navigateur et dans l'appli de bureau, sans configuration serveur.
 */
export type RouteName = 'home' | 'setup' | 'play' | 'path' | 'review' | 'stats' | 'settings' | 'design';

export interface Route {
  name: RouteName;
  params: Record<string, string>;
  path: string;
}

const TABLE: [RegExp, RouteName, string[]][] = [
  [/^\/$/, 'home', []],
  [/^\/jouer\/([a-z]+)$/, 'setup', ['skill']],
  [/^\/partie$/, 'play', []],
  [/^\/chemin$/, 'path', []],
  [/^\/revision$/, 'review', []],
  [/^\/stats$/, 'stats', []],
  [/^\/reglages$/, 'settings', []],
  [/^\/design$/, 'design', []],
];

function parse(hash: string): Route {
  const path = hash.replace(/^#/, '') || '/';
  for (const [re, name, keys] of TABLE) {
    const m = path.match(re);
    if (m) return { name, path, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1]])) };
  }
  return { name: 'home', path: '/', params: {} };
}

class Router {
  current = $state<Route>(parse(typeof location === 'undefined' ? '' : location.hash));
  /** Nombre de pages ouvertes depuis l'arrivée dans l'appli (pour savoir si « retour » reste dans l'appli). */
  private depth = 0;

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('hashchange', () => {
      this.current = parse(location.hash);
      window.scrollTo({ top: 0 });
    });
  }

  go(path: string, { replace = false } = {}) {
    if (replace) {
      history.replaceState(null, '', `#${path}`);
      this.current = parse(`#${path}`);
    } else if (path !== this.current.path) {
      this.depth++;
      location.hash = path;
    }
  }

  back(fallback = '/') {
    if (this.depth > 0) {
      this.depth--;
      history.back();
    } else {
      this.go(fallback, { replace: true });
    }
  }
}

export const router = new Router();
