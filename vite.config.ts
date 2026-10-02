import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { Plugin } from 'vite';
import { serviceWorker } from './scripts/vite/service-worker.ts';

/** Politique de sécurité du contenu, ajoutée au build : aucune ressource externe autorisée. */
const csp = (): Plugin => ({
  name: 'orbo-csp',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace(
      '<meta charset="UTF-8" />',
      `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'" />`,
    ),
});

export default defineConfig({
  plugins: [svelte(), csp(), serviceWorker()],
  // Chemins relatifs : le même build fonctionne en ligne et dans l'appli de bureau (Electron).
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  server: { host: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
