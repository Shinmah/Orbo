/**
 * Géométrie de la carte, calculée une seule fois : projection Equal Earth (surfaces
 * respectées), tracés SVG des pays, emprises de zoom.
 */
import { geoEqualEarth, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { Feature, FeatureCollection } from 'geojson';
import topo from '../data/world.topo.json';
import { BY_ID } from '../data';
import type { Country, LonLat } from '../data/types';

export const WIDTH = 1000;
const projection = geoEqualEarth().fitWidth(WIDTH, { type: 'Sphere' });
const path = geoPath(projection);

/** On coupe sous 58° S (pas d'Antarctique) et au-dessus de 84° N. */
export const TOP = Math.floor(projection([0, 84])![1]);
export const BOTTOM = Math.ceil(projection([0, -58])![1]);
export const HEIGHT = BOTTOM - TOP;

export type Box = [[number, number], [number, number]];

export interface Shape {
  id: string;
  d: string;
  /** Pays jouable (sinon territoire affiché en gris). */
  playable: boolean;
}

const fc = feature(topo as unknown as Topology, (topo as any).objects.countries) as unknown as FeatureCollection;

export const SHAPES: Shape[] = fc.features
  .map((f: Feature) => ({ id: String(f.id), d: path(f) ?? '', playable: BY_ID.has(String(f.id)) }))
  // Territoires d'abord : les pays jouables sont dessinés par-dessus.
  .sort((a, b) => Number(a.playable) - Number(b.playable));

export const project = (p: LonLat): [number, number] => projection(p) as [number, number];

/** Emprise projetée d'un rectangle lon/lat (on échantillonne les bords, la projection est courbe). */
export function projectBox([[x0, y0], [x1, y1]]: [LonLat, LonLat]): Box {
  const pts: [number, number][] = [];
  for (let i = 0; i <= 4; i++) {
    const lon = x0 + ((x1 - x0) * i) / 4;
    const lat = y0 + ((y1 - y0) * i) / 4;
    pts.push(project([lon, y0]), project([lon, y1]), project([x0, lat]), project([x1, lat]));
  }
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return [
    [Math.min(...xs), Math.min(...ys)],
    [Math.max(...xs), Math.max(...ys)],
  ];
}

export const countryBox = (c: Country): Box => projectBox(c.map.focus);

/** Taille (en unités de carte) du territoire principal : sert à décider d'afficher un marqueur. */
export const countrySize = (c: Country): number => {
  const [[x0, y0], [x1, y1]] = countryBox(c);
  return Math.max(x1 - x0, y1 - y0);
};

export function unionBox(boxes: Box[]): Box {
  return [
    [Math.min(...boxes.map((b) => b[0][0])), Math.min(...boxes.map((b) => b[0][1]))],
    [Math.max(...boxes.map((b) => b[1][0])), Math.max(...boxes.map((b) => b[1][1]))],
  ];
}

export const WORLD_BOX: Box = [
  [0, TOP],
  [WIDTH, BOTTOM],
];
