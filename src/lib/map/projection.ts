/**
 * Projection de Miller : cylindrique, les formes ressemblent à celles des cartes
 * habituelles (proche de Mercator), sans gonfler autant les hautes latitudes.
 * Partagée entre l'appli et le script de build des données.
 */
import { geoProjection, type GeoProjection } from 'd3-geo';

function millerRaw(lambda: number, phi: number): [number, number] {
  return [lambda, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))];
}
millerRaw.invert = (x: number, y: number): [number, number] => [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI];

/** Largeur de référence de la carte, en unités. */
export const MAP_WIDTH = 1000;
/** Latitudes affichées : de l'Arctique habité au cap Horn (pas d'Antarctique). */
export const NORTH = 83.7;
export const SOUTH = -57;

export function createProjection(): GeoProjection {
  return geoProjection(millerRaw).fitWidth(MAP_WIDTH, { type: 'Sphere' });
}
