/**
 * Logique pure des mises à jour (sans Electron) : comparaison de versions et
 * lecture de la réponse de l'API GitHub « dernière version ». Testée par vitest.
 */

const REPO = 'Shinmah/Orbo';
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;
const LATEST_API = `https://api.github.com/repos/${REPO}/releases/latest`;

/** Noms fixes des fichiers publiés : le lien « dernière version » reste le même d'une version à l'autre. */
const ASSETS = { installer: 'Orbo-Setup.exe', portable: 'Orbo-portable.exe' };

/** Compare deux versions « 1.0.12 » : négatif si a < b, 0 si égales, positif si a > b. */
function compareVersions(a, b) {
  const pa = String(a).replace(/^v/, '').split('.').map(Number);
  const pb = String(b).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** Lien direct vers le dernier .exe (fonctionne aussi pour un dépôt privé si l'on est connecté à GitHub). */
function latestDownloadUrl(portable) {
  return `https://github.com/${REPO}/releases/latest/download/${portable ? ASSETS.portable : ASSETS.installer}`;
}

/**
 * Interprète la réponse de l'API GitHub.
 * @returns {{status: 'available'|'none'|'private'|'error', version?: string, notes?: string, url?: string, canInstall?: boolean, message?: string}}
 */
function interpretRelease(httpStatus, release, { current, portable, platform }) {
  // 404 : dépôt privé (invisible sans compte) ou aucune version encore publiée.
  if (httpStatus === 404) return { status: 'private', url: latestDownloadUrl(portable) };
  if (httpStatus !== 200 || !release || !release.tag_name) {
    return { status: 'error', message: `GitHub a répondu ${httpStatus}.`, url: RELEASES_PAGE };
  }
  const version = String(release.tag_name).replace(/^v/, '');
  if (compareVersions(version, current) <= 0) return { status: 'none', version };
  const wanted = portable ? ASSETS.portable : ASSETS.installer;
  const asset = (release.assets || []).find((a) => a.name === wanted);
  return {
    status: 'available',
    version,
    notes: String(release.body || '').trim().slice(0, 600),
    url: asset ? asset.browser_download_url : release.html_url || RELEASES_PAGE,
    // Installation dans l'appli : seulement pour la version installée sous Windows.
    canInstall: !!asset && !portable && platform === 'win32',
  };
}

module.exports = { REPO, RELEASES_PAGE, LATEST_API, ASSETS, compareVersions, latestDownloadUrl, interpretRelease };
