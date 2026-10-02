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
