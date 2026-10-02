/** Types des données générées par scripts/data/build.ts. */

export type ContinentId = 'africa' | 'north-america' | 'south-america' | 'asia' | 'europe' | 'oceania';

export type Article = 'le' | 'la' | "l'" | 'les' | '';

export type Tier = 1 | 2 | 3 | 4;

export type LonLat = [number, number];

export interface Country {
  /** Code ISO 3166-1 alpha-3, identifiant unique (aussi l'id de la forme sur la carte). */
  id: string;
  /** Code ISO alpha-2 en minuscules : nom du fichier drapeau (public/flags/fr.svg). */
  iso2: string;
  status: 'member' | 'observer';
  name: string;
  article: Article;
  /** Autres noms acceptés en saisie libre. */
  altNames: string[];
  capital: string;
  /** Autres orthographes / autres capitales officielles acceptées en saisie libre. */
  capitalAlt: string[];
  capitalNote?: string;
  /** false si la question « capitale → pays » serait ambiguë. */
  reverseCapital: boolean;
  continents: ContinentId[];
  subregion: string;
  tier: Tier;
  /** Groupe de drapeaux ressemblants (index), pour des QCM plus durs. */
  flagGroup?: number;
  population: number;
  areaKm2: number;
  /** Pays voisins par une frontière terrestre (jeu « Chemin »). */
  neighbors: string[];
  map: {
    /** Point d'ancrage (étiquette / marqueur des petits pays). */
    point: LonLat;
    /** Emprise du territoire principal (sans DOM-TOM lointains, etc.), pour le zoom. */
    focus: [LonLat, LonLat];
    /** Trop petit pour être cliqué au niveau de zoom monde : on affiche un marqueur. */
    small: boolean;
  };
}

export interface CountryData {
  generatedAt: string;
  countries: Country[];
}
