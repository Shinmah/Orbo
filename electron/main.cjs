/**
 * Orbo — appli de bureau (Electron).
 *
 * L'interface est servie depuis le dossier dist/ via un protocole local « app:// »
 * plutôt que file:// : l'origine reste identique d'un lancement à l'autre, donc la
 * progression (localStorage) est conservée, et aucune page distante n'est chargée.
 */
const { app, BrowserWindow, Menu, ipcMain, nativeTheme, net, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { LATEST_API, RELEASES_PAGE, interpretRelease, latestDownloadUrl } = require('./updates.cjs');

const SCHEME = 'app';
const HOST = 'orbo';
const DIST = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

// Une seule fenêtre à la fois : relancer l'appli remet la fenêtre existante au premier plan.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

function serveDist() {
  protocol.handle(SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const relative = decodeURIComponent(pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.normalize(path.join(DIST, relative));
    // Interdit de sortir du dossier dist/.
    if (!file.startsWith(DIST)) return new Response('Interdit', { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    title: 'Orbo',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15131a' : '#fbf9fd',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Les liens externes s'ouvrent dans le navigateur, jamais dans l'appli.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${SCHEME}://${HOST}/`)) {
      event.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });

  win.loadURL(`${SCHEME}://${HOST}/index.html`);
  return win;
}

// ---------------------------------------------------------------------------
// Mises à jour : vérifie la dernière version publiée sur GitHub.
// - dépôt public : téléchargement dans l'appli, puis lancement de l'installateur ;
// - dépôt privé (invisible sans compte) : ouverture du lien de téléchargement dans le navigateur.
// ---------------------------------------------------------------------------

/** La version portable (un seul .exe) ne peut pas se remplacer elle-même. */
const portable = Boolean(process.env.PORTABLE_EXECUTABLE_FILE);
/** Dernière version disponible trouvée : l'installation n'utilise que cette adresse, jamais une adresse venant de la page. */
let available = null;

function registerUpdateHandlers() {
  ipcMain.handle('orbo:info', () => ({
    version: app.getVersion(),
    packaged: app.isPackaged,
    portable,
    platform: process.platform,
  }));

  ipcMain.handle('orbo:check-update', async () => {
    available = null;
    try {
      const res = await net.fetch(LATEST_API, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': `Orbo/${app.getVersion()}` },
      });
      const body = res.status === 200 ? await res.json() : null;
      const result = interpretRelease(res.status, body, { current: app.getVersion(), portable, platform: process.platform });
      if (result.status === 'available') available = result;
      return result;
    } catch {
      return { status: 'offline' };
    }
  });

  ipcMain.handle('orbo:install-update', async (event) => {
    if (!available || !available.canInstall) return { ok: false };
    const target = path.join(app.getPath('temp'), `Orbo-Setup-${available.version}.exe`);
    try {
      const res = await net.fetch(available.url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get('content-length')) || 0;
      const file = fs.createWriteStream(target);
      const reader = res.body.getReader();
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        if (!file.write(Buffer.from(value))) await new Promise((r) => file.once('drain', r));
        if (total) event.sender.send('orbo:update-progress', received / total);
      }
      await new Promise((resolve, reject) => file.end((err) => (err ? reject(err) : resolve())));
      // Lance l'installateur puis ferme Orbo pour qu'il puisse remplacer les fichiers.
      const error = await shell.openPath(target);
      if (error) throw new Error(error);
      setTimeout(() => app.quit(), 800);
      return { ok: true };
    } catch (e) {
      return { ok: false, message: String(e && e.message ? e.message : e) };
    }
  });

  ipcMain.handle('orbo:open-download', () => {
    const url = available ? available.url : app.isPackaged ? latestDownloadUrl(portable) : RELEASES_PAGE;
    return shell.openExternal(url);
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerUpdateHandlers();
  serveDist();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
