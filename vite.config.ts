import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  // Chemins relatifs : le même build fonctionne en ligne et dans l'appli de bureau (Electron).
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
  server: { host: true },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
