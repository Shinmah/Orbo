/**
 * Mises à jour de l'appli de bureau. N'existe que dans Electron (window.orbo) ;
 * la version web, elle, se met à jour toute seule (service worker).
 */

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'none'
  | 'available'
  | 'private'
  | 'offline'
  | 'error'
  | 'downloading'
  | 'installing';

interface CheckResult {
  status: 'available' | 'none' | 'private' | 'offline' | 'error';
  version?: string;
  notes?: string;
  canInstall?: boolean;
  message?: string;
}

interface OrboBridge {
  info(): Promise<{ version: string; packaged: boolean; portable: boolean; platform: string }>;
  checkUpdate(): Promise<CheckResult>;
  installUpdate(): Promise<{ ok: boolean; message?: string }>;
  openDownload(): Promise<void>;
  onProgress(callback: (ratio: number) => void): () => void;
}

declare global {
  interface Window {
    orbo?: OrboBridge;
  }
}

/** Version du build web (injectée par Vite). */
declare const __APP_VERSION__: string;

class Updates {
  /** Vrai dans l'appli de bureau. */
  readonly supported = typeof window !== 'undefined' && !!window.orbo;
  current = $state(typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '');
  portable = $state(false);
  status = $state<UpdateStatus>('idle');
  latest = $state<CheckResult | null>(null);
  progress = $state(0);
  message = $state('');
  private started = false;

  /** Au lancement de l'appli installée : vérification discrète, une seule fois. */
  async init() {
    if (!this.supported || this.started) return;
    this.started = true;
    const info = await window.orbo!.info();
    this.current = info.version;
    this.portable = info.portable;
    window.orbo!.onProgress((ratio) => (this.progress = ratio));
    if (info.packaged) setTimeout(() => void this.check(), 1500);
  }

  async check() {
    if (!this.supported || this.status === 'checking' || this.status === 'downloading') return;
    this.status = 'checking';
    this.message = '';
    const result = await window.orbo!.checkUpdate();
    this.latest = result;
    this.status = result.status;
    this.message = result.message ?? '';
  }

  /** Installe dans l'appli si possible, sinon ouvre le téléchargement dans le navigateur. */
  async install() {
    if (!this.supported) return;
    if (this.status === 'available' && this.latest?.canInstall) {
      this.status = 'downloading';
      this.progress = 0;
      const res = await window.orbo!.installUpdate();
      if (res.ok) {
        this.status = 'installing';
      } else {
        this.status = 'error';
        this.message = res.message ? `Le téléchargement a échoué (${res.message}).` : 'Le téléchargement a échoué.';
      }
      return;
    }
    await window.orbo!.openDownload();
  }

  get updateAvailable(): boolean {
    return this.status === 'available' || this.status === 'downloading' || this.status === 'installing';
  }
}

export const updates = new Updates();
