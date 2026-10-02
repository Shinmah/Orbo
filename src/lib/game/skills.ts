/** Les trois grandes compétences travaillées dans Orbo. */
export type Skill = 'capital' | 'flag' | 'map';

export interface SkillInfo {
  id: Skill;
  /** Segment d'URL (#/jouer/capitales). */
  slug: string;
  label: string;
  tagline: string;
  tone: 'violet' | 'pink' | 'green';
}

export const SKILLS: Record<Skill, SkillInfo> = {
  capital: { id: 'capital', slug: 'capitales', label: 'Capitales', tagline: 'Pays et capitales, dans les deux sens', tone: 'violet' },
  flag: { id: 'flag', slug: 'drapeaux', label: 'Drapeaux', tagline: 'Reconnaître les drapeaux du monde', tone: 'pink' },
  map: { id: 'map', slug: 'carte', label: 'Carte', tagline: 'Situer les pays sur la carte', tone: 'green' },
};

export const SKILL_LIST = Object.values(SKILLS);

export const skillFromSlug = (slug: string): Skill | undefined => SKILL_LIST.find((s) => s.slug === slug)?.id;
