/**
 * Génère les icônes de l'appli à partir du logo SVG :
 *   public/icons/icon-192.png, icon-512.png, maskable-512.png (PWA), apple-touch-icon
 *   build/icon.png (512) et build/icon.ico (Windows, pour le .exe)
 *
 * Usage : npm run icons
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

const ROOT = join(import.meta.dirname, '..');
const logo = await readFile(join(ROOT, 'public/icons/favicon.svg'), 'utf8');
const inner = logo.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** Logo posé sur une tuile arrondie (ou pleine pour l'icône « maskable »). */
function tile(size: number, { maskable = false } = {}): string {
  const pad = maskable ? 0.22 : 0.14;
  const radius = maskable ? 0 : size * 0.23;
  const s = size * (1 - pad * 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#efeafd"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
    <svg x="${size * pad}" y="${size * pad}" width="${s}" height="${s}" viewBox="0 0 64 64">${inner}</svg>
  </svg>`;
}

const render = (svg: string, width: number) => new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();

await mkdir(join(ROOT, 'public/icons'), { recursive: true });
await mkdir(join(ROOT, 'build'), { recursive: true });

await writeFile(join(ROOT, 'public/icons/icon-192.png'), render(tile(192), 192));
await writeFile(join(ROOT, 'public/icons/icon-512.png'), render(tile(512), 512));
await writeFile(join(ROOT, 'public/icons/maskable-512.png'), render(tile(512, { maskable: true }), 512));
await writeFile(join(ROOT, 'public/icons/apple-touch-icon.png'), render(tile(180, { maskable: true }), 180));
await writeFile(join(ROOT, 'build/icon.png'), render(tile(512), 512));

const icoSizes = [16, 24, 32, 48, 64, 128, 256].map((n) => render(tile(n), n));
await writeFile(join(ROOT, 'build/icon.ico'), await pngToIco(icoSizes));
console.log('Icônes générées.');
