import { describe, expect, it } from 'vitest';
import updates from '../../electron/updates.cjs';

const { compareVersions, interpretRelease, latestDownloadUrl } = updates;

const release = (tag: string) => ({
  tag_name: tag,
  html_url: `https://github.com/Shinmah/Orbo/releases/tag/${tag}`,
  body: 'Jeu Chemin\n\n- sons',
  assets: [
    { name: 'Orbo-Setup.exe', browser_download_url: `https://github.com/Shinmah/Orbo/releases/download/${tag}/Orbo-Setup.exe` },
    { name: 'Orbo-portable.exe', browser_download_url: `https://github.com/Shinmah/Orbo/releases/download/${tag}/Orbo-portable.exe` },
  ],
});
const win = { current: '1.0.4', portable: false, platform: 'win32' };

describe('mises à jour', () => {
  it('compare les versions numériquement', () => {
    expect(compareVersions('1.0.10', '1.0.9')).toBeGreaterThan(0);
    expect(compareVersions('v1.0.4', '1.0.4')).toBe(0);
    expect(compareVersions('1.0.4', '1.1.0')).toBeLessThan(0);
  });

  it('propose une version plus récente, installable sous Windows', () => {
    const r = interpretRelease(200, release('v1.0.7'), win);
    expect(r).toMatchObject({ status: 'available', version: '1.0.7', canInstall: true });
    expect(r.url).toMatch(/v1\.0\.7\/Orbo-Setup\.exe$/);
    expect(r.notes).toContain('Jeu Chemin');
  });

  it('ne propose rien si la version est déjà installée', () => {
    expect(interpretRelease(200, release('v1.0.4'), win)).toMatchObject({ status: 'none' });
    expect(interpretRelease(200, release('v1.0.3'), win)).toMatchObject({ status: 'none' });
  });

  it('version portable : lien vers le .exe portable, pas d’installation automatique', () => {
    const r = interpretRelease(200, release('v1.0.7'), { ...win, portable: true });
    expect(r).toMatchObject({ status: 'available', canInstall: false });
    expect(r.url).toMatch(/Orbo-portable\.exe$/);
  });

  it('dépôt privé (404) : lien direct vers le dernier .exe', () => {
    const r = interpretRelease(404, null, win);
    expect(r).toEqual({ status: 'private', url: latestDownloadUrl(false) });
    expect(r.url).toBe('https://github.com/Shinmah/Orbo/releases/latest/download/Orbo-Setup.exe');
  });

  it('erreur GitHub : renvoie vers la page des versions', () => {
    expect(interpretRelease(500, null, win)).toMatchObject({ status: 'error' });
  });
});
