import type { ContinentId, Tier } from '../data/types';
import type { ModeId, Skill } from './types';

/** Réglages d'une partie, choisis sur l'écran de préparation. */
export interface SessionConfig {
  skill: Skill | 'mixed';
  modes: ModeId[];
  continents: ContinentId[];
  maxTier: Tier;
  /** auto = QCM puis saisie libre quand le pays est maîtrisé. */
  format: 'auto' | 'choice' | 'input';
  /** Nombre de questions (0 = tous les pays du filtre). */
  length: number;
  /** Partie de révision : uniquement les cartes à revoir. */
  review?: boolean;
  /** Restreint la partie à ces pays (ex. « revoir mes erreurs »). */
  only?: string[];
  seed?: number;
}
