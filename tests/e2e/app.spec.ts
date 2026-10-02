import { expect, test, type Page } from '@playwright/test';
import data from '../../src/lib/data/countries.json' with { type: 'json' };
import { capitalOfPhrase, withArticle } from '../../src/lib/data/grammar';
import type { Country } from '../../src/lib/data/types';

const countries = (data as unknown as { countries: Country[] }).countries;

async function configure(page: Page, skill: string, setup: Record<string, unknown>) {
  await page.goto('./');
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [`orbo:setup:${skill}`, JSON.stringify(setup)]);
}

async function startSession(page: Page, slug: string) {
  await page.goto(`./#/jouer/${slug}`);
  await page.getByRole('button', { name: /Commencer/ }).click();
}

const emphasis = (page: Page) => page.locator('.prompt h2 em').first().textContent();

test('accueil : les trois compétences et la révision', async ({ page }) => {
  await page.goto('./');
  for (const name of ['Capitales', 'Drapeaux', 'Carte', 'Révision']) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Capitales' }).click();
  await expect(page).toHaveURL(/#\/jouer\/capitales$/);
});

test('partie QCM complète au clavier, résultats, puis progression conservée', async ({ page }) => {
  await configure(page, 'capital', { direction: 'country-to-capital', continents: [], maxTier: 1, format: 'choice', length: 10 });
  await startSession(page, 'capitales');
  for (let i = 0; i < 10; i++) {
    await expect(page.locator('.choices button').first()).toBeEnabled();
    await page.keyboard.press('1');
    await expect(page.getByRole('status')).toBeVisible();
    await page.keyboard.press('Enter');
  }
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/sur 10/)).toBeVisible();

  await page.reload();
  await page.goto('./#/stats');
  await expect(page.getByText('Questions')).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('orbo:progress')!).totals.answered);
  expect(stored).toBe(10);
});

test('saisie libre : une faute de frappe est tolérée', async ({ page }) => {
  await configure(page, 'capital', { direction: 'country-to-capital', continents: ['europe'], maxTier: 1, format: 'input', length: 10 });
  await startSession(page, 'capitales');
  const phrase = await emphasis(page);
  const c = countries.find((x) => capitalOfPhrase(x) === phrase)!;
  expect(c, `pays introuvable pour « ${phrase} »`).toBeTruthy();
  // Ajoute une faute sur les capitales assez longues, sinon tape en minuscules sans accents.
  const typed = c.capital.length >= 6 ? c.capital.slice(0, -1) : c.capital.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  await page.getByRole('textbox', { name: 'Ta réponse' }).fill(typed);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText(/Bravo|Presque parfait/);
});

test('carte : situer un pays en cliquant dessus', async ({ page }) => {
  await configure(page, 'map', { direction: 'locate-on-map', continents: ['south-america'], maxTier: 1, format: 'auto', length: 10 });
  await startSession(page, 'carte');
  const phrase = await emphasis(page);
  const c = countries.find((x) => withArticle(x) === phrase)!;
  expect(c, `pays introuvable pour « ${phrase} »`).toBeTruthy();
  await page.locator(`path[data-id="${c.id}"]`).dispatchEvent('click');
  await expect(page.getByRole('status')).toContainText('Bravo');
  await expect(page.locator(`path[data-id="${c.id}"]`)).toHaveClass(/correct/);
});

test('drapeaux : une mauvaise réponse montre la bonne', async ({ page }) => {
  await configure(page, 'flag', { direction: 'flag-to-country', continents: [], maxTier: 1, format: 'choice', length: 10 });
  await startSession(page, 'drapeaux');
  const correct = await page.evaluate(() => document.querySelector('.prompt img')?.getAttribute('src'));
  const iso2 = correct!.match(/flags\/(\w+)\.svg/)![1];
  const c = countries.find((x) => x.iso2 === iso2)!;
  const wrong = page.locator('.choices button').filter({ hasNotText: c.name }).first();
  await wrong.click();
  await expect(page.getByRole('status')).toContainText(c.name);
});

test('réglages : le mode sombre s’applique et persiste', async ({ page }) => {
  await page.goto('./#/reglages');
  await page.getByRole('radio', { name: 'Sombre' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

/** Plus court chemin terrestre, calculé directement sur les données (comme dans l'appli). */
function shortest(from: string, to: string): string[] {
  const prev = new Map<string, string>();
  const queue = [from];
  const seen = new Set([from]);
  for (let i = 0; i < queue.length; i++) {
    for (const n of countries.find((c) => c.id === queue[i])!.neighbors) {
      if (seen.has(n)) continue;
      seen.add(n);
      prev.set(n, queue[i]);
      queue.push(n);
    }
  }
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return path;
}

test('chemin : relier la France à la Turquie en tapant les pays', async ({ page }) => {
  await page.goto('./#/jouer/chemin');
  await page.locator('select').nth(0).selectOption('FRA');
  await page.locator('select').nth(1).selectOption('TUR');
  await page.getByRole('radio', { name: 'Jamais' }).click();
  await page.getByRole('button', { name: /Commencer/ }).click();
  await expect(page.getByText('France', { exact: true }).first()).toBeVisible();

  const input = page.getByRole('textbox', { name: 'Ta réponse' });
  await input.fill('Atlantide');
  await input.press('Enter');
  await expect(page.locator('.msg')).toContainText('pays inconnu');

  for (const id of shortest('FRA', 'TUR').slice(1, -1)) {
    const name = countries.find((c) => c.id === id)!.name;
    await input.fill(name.toLowerCase());
    await input.press('Enter');
  }
  await expect(page.getByText('Chemin parfait !')).toBeVisible();
  const paths = await page.evaluate(() => JSON.parse(localStorage.getItem('orbo:progress')!).paths);
  expect(paths).toMatchObject({ played: 1, won: 1, perfect: 1, bestScore: 100 });
});

test('chemin : le pays interdit est refusé', async ({ page }) => {
  await page.goto('./#/jouer/chemin');
  await page.locator('select').nth(0).selectOption('ESP');
  await page.locator('select').nth(1).selectOption('POL');
  await page.getByRole('radio', { name: 'Toujours' }).click();
  await page.getByRole('button', { name: /Commencer/ }).click();
  const meta = await page.locator('.meta').textContent();
  const forbidden = countries.find((c) => meta!.includes(`passer par ${c.article === "l'" ? "l'" : c.article ? c.article + ' ' : ''}${c.name}`))!;
  expect(forbidden).toBeTruthy();
  const input = page.getByRole('textbox', { name: 'Ta réponse' });
  await input.fill(forbidden.name);
  await input.press('Enter');
  await expect(page.locator('.msg')).toContainText('Interdit');
});

/** Simule l'appli de bureau (window.orbo) pour tester l'interface des mises à jour. */
async function fakeDesktop(page: Page, check: Record<string, unknown>) {
  await page.addInitScript((result) => {
    let progress: ((r: number) => void) | null = null;
    (window as any).__opened = 0;
    (window as any).orbo = {
      info: async () => ({ version: '1.0.4', packaged: true, portable: false, platform: 'win32' }),
      checkUpdate: async () => result,
      installUpdate: async () => {
        for (const r of [0.25, 0.6, 1]) {
          await new Promise((res) => setTimeout(res, 120));
          progress?.(r);
        }
        return { ok: true };
      },
      openDownload: async () => void ((window as any).__opened += 1),
      onProgress: (cb: (r: number) => void) => ((progress = cb), () => {}),
    };
  }, check);
}

test('mise à jour : bandeau sur l’accueil puis installation', async ({ page }) => {
  await fakeDesktop(page, { status: 'available', version: '1.0.7', notes: 'Jeu Chemin', canInstall: true });
  await page.goto('./');
  await expect(page.getByText('Orbo 1.0.7 est disponible')).toBeVisible({ timeout: 6000 });
  await page.getByRole('button', { name: 'Mettre à jour', exact: true }).click();
  await expect(page.getByText("L'installateur s'ouvre, Orbo va se fermer.")).toBeVisible();
});

test('mise à jour : dépôt privé, téléchargement dans le navigateur', async ({ page }) => {
  await fakeDesktop(page, { status: 'private' });
  await page.goto('./#/reglages');
  await expect(page.getByText('1.0.4').first()).toBeVisible();
  await page.getByRole('button', { name: 'Rechercher une mise à jour' }).click();
  await expect(page.getByText(/dépôt GitHub d'Orbo est privé/)).toBeVisible();
  await page.getByRole('button', { name: 'Télécharger la dernière version' }).click();
  expect(await page.evaluate(() => (window as any).__opened)).toBe(1);
});

test('mise à jour : section absente de la version web', async ({ page }) => {
  await page.goto('./#/reglages');
  await expect(page.getByRole('heading', { name: 'Thème' }).or(page.getByText('Apparence'))).toBeVisible();
  await expect(page.getByText('Mises à jour')).toHaveCount(0);
});

test('mise à jour : le bouton de l’accueil télécharge la dernière version (dépôt privé)', async ({ page }) => {
  await fakeDesktop(page, { status: 'private' });
  await page.goto('./');
  const button = page.getByRole('button', { name: 'Télécharger la dernière version d’Orbo' });
  await expect(button).toBeVisible({ timeout: 6000 });
  await button.click();
  expect(await page.evaluate(() => (window as any).__opened)).toBe(1);
});

test('chemin : le premier indice donne la première lettre, le second la moitié du nom', async ({ page }) => {
  await page.goto('./#/jouer/chemin');
  await page.locator('select').nth(0).selectOption('FRA');
  await page.locator('select').nth(1).selectOption('POL');
  await page.getByRole('radio', { name: 'Jamais' }).click();
  await page.getByRole('button', { name: /Commencer/ }).click();
  await page.getByRole('button', { name: 'Indice' }).click();
  await expect(page.locator('.msg')).toContainText('commence par « A… »');
  await page.getByRole('button', { name: 'Encore un indice' }).click();
  await expect(page.locator('.msg')).toContainText('« Allem… »');
  await expect(page.getByRole('button', { name: 'Indice' })).toBeDisabled();
});

test('révision : jamais vide après une partie, même sans erreur', async ({ page }) => {
  await configure(page, 'capital', { direction: 'country-to-capital', continents: ['europe'], maxTier: 1, format: 'choice', length: 10 });
  await startSession(page, 'capitales');
  // Répond juste à tout : on lit la bonne réponse dans les données.
  for (let i = 0; i < 10; i++) {
    const phrase = await emphasis(page);
    const c = countries.find((x) => capitalOfPhrase(x) === phrase)!;
    await page.locator('.choices button', { hasText: new RegExp(`^\\s*\\d?\\s*${c.capital}\\s*$`) }).first().click();
    await expect(page.getByRole('status')).toContainText('Bravo');
    await page.keyboard.press('Enter');
  }
  await page.goto('./');
  await expect(page.getByText(/10\s*pays à consolider/)).toBeVisible();
  await expect(page.getByText('10/195').first()).toBeVisible();
  await page.goto('./#/revision');
  await expect(page.getByRole('button', { name: /Réviser · 10 questions/ })).toBeEnabled();
});
