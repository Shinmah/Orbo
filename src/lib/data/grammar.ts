import type { Country } from './types';

const startsWithVowel = (s: string) => /^[aeiouàâäéèêëîïôöûüœh]/i.test(s);

/** « Îles Marshall » devient « îles Marshall » derrière un article. */
const inSentence = (c: Pick<Country, 'name' | 'article'>) => (c.article ? c.name.replace(/^Îles /, 'îles ') : c.name);

/** « la France », « le Japon », « les Pays-Bas », « l'Italie », « Cuba ». */
export function withArticle(c: Pick<Country, 'name' | 'article'>): string {
  if (!c.article) return c.name;
  return c.article === "l'" ? `l'${c.name}` : `${c.article} ${inSentence(c)}`;
}

/** « de la France », « du Japon », « des Pays-Bas », « de l'Italie », « d'Israël », « de Cuba ». */
export function capitalOfPhrase(c: Pick<Country, 'name' | 'article'>): string {
  switch (c.article) {
    case 'le':
      return `du ${c.name}`;
    case 'les':
      return `des ${inSentence(c)}`;
    case 'la':
      return `de la ${c.name}`;
    case "l'":
      return `de l'${c.name}`;
    default:
      return startsWithVowel(c.name) ? `d'${c.name}` : `de ${c.name}`;
  }
}

/** Accord du verbe : « Où se trouve la France ? » / « Où se trouvent les Pays-Bas ? » */
export const isPlural = (c: Pick<Country, 'article'>) => c.article === 'les';
