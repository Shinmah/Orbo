/**
 * Générateur pseudo-aléatoire initialisable (mulberry32).
 * Une même graine donne toujours la même partie : c'est ce qui permettra
 * un « défi du jour » identique pour tout le monde, sans serveur.
 */
export type Rng = () => number;

export function createRng(seed: number = Date.now()): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Graine dérivée d'un texte (ex. la date « 2026-10-02 »). */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pick = <T>(items: readonly T[], rng: Rng): T => items[Math.floor(rng() * items.length)];

/** Tirage sans remise pondéré (algorithme d'Efraimidis-Spirakis). */
export function weightedSample<T>(items: readonly T[], weight: (t: T) => number, n: number, rng: Rng): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(rng(), 1 / Math.max(weight(item), 1e-6)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, n)
    .map((x) => x.item);
}
