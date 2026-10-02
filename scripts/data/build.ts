/**
 * Construit les données statiques de l'appli à partir de data/raw/ et data/curation/ :
 *   - src/lib/data/countries.json  (pays, capitales, noms, niveaux…)
 *   - src/lib/data/world.topo.json (carte simplifiée, point de vue France)
 *   - public/flags/{iso2}.svg      (drapeaux, copiés depuis flag-icons)
 *
 * Usage : npm run data:build   (puis npm run data:validate)
 */
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { geoArea, geoCentroid, geoContains, geoDistance, geoPath } from 'd3-geo';
import { topology } from 'topojson-server';
import { neighbors as topoNeighbors } from 'topojson-client';
import { createProjection } from '../../src/lib/map/projection';
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson';
import type { Article, ContinentId, Country, CountryData, LonLat, Tier } from '../../src/lib/data/types';

const ROOT = join(import.meta.dirname, '../..');
const RAW = join(ROOT, 'data/raw');
const CUR = join(ROOT, 'data/curation');
const OUT = join(ROOT, 'src/lib/data');
const FLAGS_OUT = join(ROOT, 'public/flags');
const FLAGS_SRC = join(ROOT, 'node_modules/flag-icons/flags/4x3');

const EARTH_RADIUS_KM = 6371;
const readJson = async <T = any>(path: string): Promise<T> => JSON.parse(await readFile(path, 'utf8'));
const wd = (row: any, key: string): string | undefined => row[key]?.value;

// ---------------------------------------------------------------------------
// Pays
// ---------------------------------------------------------------------------

const SUBREGIONS: Record<string, { fr: string; continent: ContinentId }> = {
  'Eastern Africa': { fr: "Afrique de l'Est", continent: 'africa' },
  'Middle Africa': { fr: 'Afrique centrale', continent: 'africa' },
  'Northern Africa': { fr: 'Afrique du Nord', continent: 'africa' },
  'Southern Africa': { fr: 'Afrique australe', continent: 'africa' },
  'Western Africa': { fr: "Afrique de l'Ouest", continent: 'africa' },
  Caribbean: { fr: 'Caraïbes', continent: 'north-america' },
  'Central America': { fr: 'Amérique centrale', continent: 'north-america' },
  'North America': { fr: 'Amérique du Nord', continent: 'north-america' },
  'South America': { fr: 'Amérique du Sud', continent: 'south-america' },
  'Central Asia': { fr: 'Asie centrale', continent: 'asia' },
  'Eastern Asia': { fr: "Asie de l'Est", continent: 'asia' },
  'South-Eastern Asia': { fr: 'Asie du Sud-Est', continent: 'asia' },
  'Southern Asia': { fr: 'Asie du Sud', continent: 'asia' },
  'Western Asia': { fr: 'Moyen-Orient', continent: 'asia' },
  'Central Europe': { fr: 'Europe centrale', continent: 'europe' },
  'Eastern Europe': { fr: "Europe de l'Est", continent: 'europe' },
  'Northern Europe': { fr: 'Europe du Nord', continent: 'europe' },
  'Southeast Europe': { fr: 'Balkans', continent: 'europe' },
  'Southern Europe': { fr: 'Europe du Sud', continent: 'europe' },
  'Western Europe': { fr: "Europe de l'Ouest", continent: 'europe' },
  'Australia and New Zealand': { fr: 'Australie et Nouvelle-Zélande', continent: 'oceania' },
  Melanesia: { fr: 'Mélanésie', continent: 'oceania' },
  Micronesia: { fr: 'Micronésie', continent: 'oceania' },
  Polynesia: { fr: 'Polynésie', continent: 'oceania' },
};

/** Pays transcontinentaux : apparaissent dans les deux filtres. */
const EXTRA_CONTINENTS: Record<string, ContinentId[]> = { RUS: ['asia'], TUR: ['europe'] };

/** Clé de comparaison grossière (sans accents, casse, ponctuation) pour dédoublonner. */
export const loose = (s: string) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const tidy = (s: string) => s.replace(/’/g, "'").replace(/\s+/g, ' ').trim();

function articleFor(id: string, name: string, grammar: any): Article {
  if (grammar.none.includes(id)) return '';
  if (grammar.les.includes(id)) return 'les';
  if (grammar.le.includes(id)) return 'le';
  if (grammar.la.includes(id)) return 'la';
  if (/^[aeiouàâäéèêëîïôöûüœ]/i.test(name)) return "l'";
  return name.endsWith('e') ? 'la' : 'le';
}

function rankPercentiles(values: Map<string, number>): Map<string, number> {
  const sorted = [...values.entries()].sort((a, b) => a[1] - b[1]);
  return new Map(sorted.map(([id], i) => [id, i / (sorted.length - 1)]));
}

interface BuildLog {
  sourceDisagreements: string[];
  droppedAliases: string[];
  borders: string[];
}

async function buildCountries(log: BuildLog) {
  const mledoze: any[] = await readJson(join(RAW, 'mledoze-countries.json'));
  const wdStates: any[] = await readJson(join(RAW, 'wikidata-states.json'));
  const wdUn: any[] = await readJson(join(RAW, 'wikidata-un.json'));
  const wdCapitals: any[] = await readJson(join(RAW, 'wikidata-capitals.json'));
  const membership = await readJson(join(CUR, 'membership.json'));
  const names = await readJson(join(CUR, 'names.json'));
  const capitals = await readJson(join(CUR, 'capitals.json'));
  const grammar = await readJson(join(CUR, 'grammar.json'));
  const difficulty = await readJson(join(CUR, 'difficulty.json'));
  const flags = await readJson(join(CUR, 'flags.json'));

  // --- Liste des pays : membres ONU (union des deux sources, corrigée) + observateurs.
  const mlUn = new Set(mledoze.filter((c) => c.unMember).map((c) => c.cca3 as string));
  const wdUnSet = new Set(wdUn.map((r) => wd(r, 'iso3')!));
  for (const id of mlUn) if (!wdUnSet.has(id)) log.sourceDisagreements.push(`ONU : ${id} membre selon mledoze, pas selon Wikidata`);
  for (const id of wdUnSet) if (!mlUn.has(id)) log.sourceDisagreements.push(`ONU : ${id} membre selon Wikidata, pas selon mledoze`);
  const members = new Set([...mlUn, ...wdUnSet, ...membership.forceMember]);
  for (const id of membership.forceNotMember) members.delete(id);
  const ids = [...new Set([...members, ...membership.observers])].sort();

  const dn = new Intl.DisplayNames('fr', { type: 'region' });
  const sitelinks = new Map<string, number>();
  const population = new Map<string, number>();
  const draft: Omit<Country, 'map' | 'tier' | 'neighbors'>[] = [];

  for (const id of ids) {
    const ml = mledoze.find((c) => c.cca3 === id);
    const st = wdStates.find((r) => wd(r, 'iso3') === id);
    if (!ml || !st) throw new Error(`Pays ${id} absent d'une source (mledoze: ${!!ml}, wikidata: ${!!st})`);
    const iso2 = (ml.cca2 as string).toLowerCase();

    const cldr = tidy(dn.of(ml.cca2)!);
    const name = names.display[id] ?? cldr;

    // Noms alternatifs : CLDR, Wikidata, mledoze (nom courant + officiel), curation.
    // Les alias libres de Wikidata ne sont pas repris : trop bruités (« Oncle Sam », « République »…).
    const alt = [cldr, wd(st, 'labelFr'), ml.translations.fra.common, ml.translations.fra.official]
      .filter((s): s is string => !!s && !/[().]/.test(s))
      .map(tidy);
    alt.push(...(names.alt[id] ?? []));

    // Capitale : Wikidata (meilleur rang, sans date de fin), puis curation.
    const wdCaps = wdCapitals.filter((r) => wd(r, 'iso3') === id);
    const ov = capitals.override[id];
    let capital: string;
    const capitalAlt: string[] = [];
    if (ov) {
      capital = ov.capital;
      capitalAlt.push(...ov.alt);
    } else {
      if (wdCaps.length !== 1) throw new Error(`${id} : ${wdCaps.length} capitales Wikidata, ajouter une entrée dans capitals.json`);
      capital = tidy(wd(wdCaps[0], 'capitalFr') ?? wd(wdCaps[0], 'capitalEn')!);
    }
    // Libellés anglais (Wikidata + mledoze) acceptés en saisie : « Kyiv », « Beijing »…
    for (const r of wdCaps) {
      const en = wd(r, 'capitalEn');
      if (en && (!ov || ov.alt.includes(tidy(wd(r, 'capitalFr') ?? '')) || tidy(wd(r, 'capitalFr') ?? '') === capital)) {
        capitalAlt.push(tidy(en));
      }
    }
    if (!ov || ov.alt.length) capitalAlt.push(...(ml.capital ?? []).map(tidy));
    capitalAlt.push(...(capitals.alt[id] ?? []));
    // Cohérence mledoze ↔ Wikidata (comparaison sur les libellés anglais).
    const wdEn = wdCaps.map((r) => loose(wd(r, 'capitalEn') ?? ''));
    if (!(ml.capital ?? []).some((c: string) => wdEn.includes(loose(c)))) {
      log.sourceDisagreements.push(`Capitale ${id} : Wikidata « ${wdCaps.map((r) => wd(r, 'capitalEn')).join(' / ')} » ≠ mledoze « ${(ml.capital ?? []).join(' / ')} » → retenue : ${capital}`);
    }

    const sub = SUBREGIONS[ml.subregion];
    if (!sub) throw new Error(`${id} : sous-région inconnue ${ml.subregion}`);

    sitelinks.set(id, Number(wd(st, 'sitelinks')));
    population.set(id, Number(wd(st, 'population') ?? 0));

    const flagGroup = (flags.groups as string[][]).findIndex((g) => g.includes(id));

    draft.push({
      id,
      iso2,
      status: membership.observers.includes(id) ? 'observer' : 'member',
      name,
      article: articleFor(id, name, grammar),
      altNames: alt,
      capital,
      capitalAlt,
      capitalNote: ov?.note,
      reverseCapital: !capitals.noReverse.includes(id),
      continents: [sub.continent, ...(EXTRA_CONTINENTS[id] ?? [])],
      subregion: sub.fr,
      flagGroup: flagGroup >= 0 ? flagGroup : undefined,
      population: population.get(id)!,
      areaKm2: Math.round(ml.area),
    });
  }

  // --- Dédoublonnage des noms alternatifs : un alias partagé par deux pays est retiré.
  const owners = new Map<string, Set<string>>();
  for (const c of draft) for (const a of [c.name, ...c.altNames]) {
    const k = loose(a);
    if (!owners.has(k)) owners.set(k, new Set());
    owners.get(k)!.add(c.id);
  }
  const canonical = new Map(draft.map((c) => [loose(c.name), c.id]));
  for (const c of draft) {
    const seen = new Set([loose(c.name)]);
    c.altNames = c.altNames.filter((a) => {
      const k = loose(a);
      if (seen.has(k)) return false;
      seen.add(k);
      const owner = canonical.get(k);
      if ((owners.get(k)!.size > 1 && owner !== c.id) || (owner && owner !== c.id)) {
        log.droppedAliases.push(`${c.id} : « ${a} » (partagé avec ${[...owners.get(k)!].filter((x) => x !== c.id).join(', ')})`);
        return false;
      }
      return true;
    });
    const capSeen = new Set([loose(c.capital)]);
    c.capitalAlt = c.capitalAlt.filter((a) => {
      const k = loose(a);
      if (!k || capSeen.has(k)) return false;
      capSeen.add(k);
      return true;
    });
  }

  // --- Niveau de difficulté : notoriété (55 %) + population (45 %), puis ajustements.
  const pSite = rankPercentiles(sitelinks);
  const pPop = rankPercentiles(population);
  const ranked = [...ids].sort((a, b) => 0.55 * pSite.get(b)! + 0.45 * pPop.get(b)! - (0.55 * pSite.get(a)! + 0.45 * pPop.get(a)!));
  const tiers = new Map<string, Tier>();
  ranked.forEach((id, i) => tiers.set(id, (i < 45 ? 1 : i < 95 ? 2 : i < 145 ? 3 : 4) as Tier));
  for (const [id, t] of Object.entries(difficulty.force)) tiers.set(id, t as Tier);

  return draft.map((c) => ({ ...c, tier: tiers.get(c.id)! }));
}

// ---------------------------------------------------------------------------
// Carte
// ---------------------------------------------------------------------------

/** Entités Natural Earth fusionnées dans un pays (codes NE non standard ou parties intégrantes). */
const MERGE: Record<string, string> = {
  SDS: 'SSD', // Soudan du Sud
  PSX: 'PSE', // Palestine
  HKG: 'CHN', // Hong Kong (RAS chinoise)
  MAC: 'CHN', // Macao (RAS chinoise)
  ALD: 'FIN', // Åland
  USG: 'CUB', // Guantánamo (territoire cubain loué)
};
const DROP = ['ATA']; // Antarctique : hors sujet et prend beaucoup de place

function polygonsOf(f: Feature): Polygon[] {
  const g = f.geometry as Polygon | MultiPolygon;
  return g.type === 'Polygon' ? [g] : g.coordinates.map((coordinates) => ({ type: 'Polygon', coordinates }));
}
const km2 = (g: Polygon) => geoArea(g) * EARTH_RADIUS_KM ** 2;

/**
 * mapshaper écrit du GeoJSON RFC 7946 (anneau extérieur anti-horaire) alors que d3-geo,
 * qui travaille sur la sphère, attend l'inverse : sinon un polygone désigne « toute la
 * Terre sauf ce pays ». On retourne chaque polygone dont l'aire dépasse une demi-sphère.
 */
function rewind(p: Polygon): Polygon {
  if (geoArea(p) <= 2 * Math.PI) return p;
  return { type: 'Polygon', coordinates: p.coordinates.map((ring) => [...ring].reverse()) };
}

async function buildMap(playable: Set<string>) {
  const mapshaper: any = (await import('mapshaper')).default;
  const shp = join(RAW, 'natural-earth/ne_10m_admin_0_countries_fra.shp');
  const mergeExpr = JSON.stringify(MERGE);

  // Points d'étiquette Natural Earth (placés au cœur du territoire principal).
  const attrs = await mapshaper.applyCommands(`-i "${shp}" -filter-fields ADM0_A3,LABEL_X,LABEL_Y -o format=json out.json`);
  const rows: { ADM0_A3: string; LABEL_X: number; LABEL_Y: number }[] = JSON.parse(attrs['out.json']);
  const labels = new Map<string, LonLat>();
  for (const r of rows) {
    const id = MERGE[r.ADM0_A3] ?? r.ADM0_A3;
    // Pour une fusion (Hong Kong → Chine), on garde l'étiquette du pays lui-même.
    if (r.ADM0_A3 === id || !rows.some((x) => x.ADM0_A3 === id)) labels.set(id, [r.LABEL_X, r.LABEL_Y]);
  }

  // Géométrie : fusion, simplification topologique (frontières partagées préservées).
  const out = await mapshaper.applyCommands(
    `-i "${shp}" -filter '${JSON.stringify(DROP)}.indexOf(ADM0_A3) === -1' ` +
      `-each 'id = (${mergeExpr})[ADM0_A3] || ADM0_A3' -dissolve2 id ` +
      `-simplify 7% weighted keep-shapes -filter-fields id -o format=geojson precision=0.0001 out.json`,
  );
  const fc: FeatureCollection = JSON.parse(out['out.json']);

  // Suppression des îlots minuscules (sauf pour les petits pays : on garde tout).
  let dropped = 0;
  for (const f of fc.features) {
    const polys = polygonsOf(f).map(rewind).map((p) => ({ p, a: km2(p) })).sort((a, b) => b.a - a.a);
    const largest = polys[0].a;
    const keep = polys.filter(({ a }, i) => i === 0 || a >= Math.min(150, largest * 0.1));
    dropped += polys.length - keep.length;
    f.geometry = keep.length === 1 ? keep[0].p : { type: 'MultiPolygon', coordinates: keep.map(({ p }) => p.coordinates) };
    f.id = f.properties!.id;
    f.properties = {};
  }

  // Métadonnées par pays : point d'ancrage, emprise principale, petit pays ?
  const projection = createProjection();
  const path = geoPath(projection);
  const meta = new Map<string, Country['map']>();
  for (const f of fc.features) {
    const id = f.id as string;
    if (!playable.has(id)) continue;
    const polys = polygonsOf(f).map((p) => ({ p, a: km2(p), c: geoCentroid(p) })).sort((a, b) => b.a - a.a);
    const main = polys[0];
    const L = Math.sqrt(main.a);
    const near = polys.filter(
      (x) =>
        x === main ||
        geoDistance(x.c, main.c) * EARTH_RADIUS_KM <= 1.5 * L ||
        (x.a >= 0.1 * main.a && geoDistance(x.c, main.c) * EARTH_RADIUS_KM <= 3000),
    );
    // Emprise « à plat » (en longitude/latitude), sans les morceaux situés de l'autre côté
    // de l'antiméridien (pointe de la Tchoukotka pour la Russie, îles Lau pour les Fidji…).
    const sameSide = near.filter((x) => Math.abs(x.c[0] - main.c[0]) < 180);
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const { p } of sameSide) for (const [lon, lat] of p.coordinates[0]) {
      x0 = Math.min(x0, lon); x1 = Math.max(x1, lon); y0 = Math.min(y0, lat); y1 = Math.max(y1, lat);
    }
    const [[px0, py0], [px1, py1]] = path.bounds(main.p);
    const pxArea = path.area(f);
    const small = pxArea < 12 || Math.max(px1 - px0, py1 - py0) < 4;
    // Point d'étiquette Natural Earth s'il tombe bien sur les terres, sinon centre du territoire principal.
    const label = labels.get(id);
    const point = label && geoContains(f, label) ? label : (main.c as LonLat);
    const r = (n: number) => Math.round(n * 1000) / 1000;
    meta.set(id, {
      point: [r(point[0]), r(point[1])],
      focus: [[r(x0), r(y0)], [r(x1), r(y1)]],
      small,
    });
  }

  const topo = topology({ countries: fc }, 1e6);
  // Pays qui partagent une frontière sur la carte.
  const geoms = (topo.objects.countries as any).geometries as { id: string }[];
  const nb = topoNeighbors(geoms as any);
  const mapNeighbors = new Map<string, string[]>();
  geoms.forEach((g, i) => mapNeighbors.set(g.id, nb[i].map((j) => geoms[j].id)));
  return { topo, meta, mapNeighbors, featureIds: fc.features.map((f) => f.id as string), droppedIslets: dropped };
}

// ---------------------------------------------------------------------------
// Frontières terrestres (jeu « Chemin »)
// ---------------------------------------------------------------------------

async function buildNeighbors(playable: Set<string>, mapNeighbors: Map<string, string[]>, log: BuildLog) {
  const mledoze: any[] = await readJson(join(RAW, 'mledoze-countries.json'));
  const cur = await readJson(join(CUR, 'borders.json'));
  const pairs = new Map<string, Set<string>>([...playable].map((id) => [id, new Set<string>()]));
  const link = (a: string, b: string) => {
    if (!playable.has(a) || !playable.has(b) || a === b) return;
    pairs.get(a)!.add(b);
    pairs.get(b)!.add(a);
  };
  const key = (a: string, b: string) => [a, b].sort().join('–');
  const fromMledoze = new Set<string>();
  const fromMap = new Set<string>();
  for (const c of mledoze) for (const b of c.borders ?? []) if (playable.has(c.cca3) && playable.has(b)) fromMledoze.add(key(c.cca3, b));
  for (const [a, list] of mapNeighbors) for (const b of list) if (playable.has(a) && playable.has(b)) fromMap.add(key(a, b));
  for (const k of new Set([...fromMledoze, ...fromMap])) {
    const [a, b] = k.split('–');
    link(a, b);
    if (!fromMledoze.has(k)) log.borders.push(`${k} : présente sur la carte seulement`);
    else if (!fromMap.has(k)) log.borders.push(`${k} : selon mledoze seulement (trop petite pour la carte simplifiée)`);
  }
  for (const [a, b, why] of cur.remove as [string, string, string][]) {
    pairs.get(a)?.delete(b);
    pairs.get(b)?.delete(a);
    log.borders.push(`${key(a, b)} : retirée (${why})`);
  }
  for (const [a, b, why] of cur.add as [string, string, string][]) {
    link(a, b);
    log.borders.push(`${key(a, b)} : ajoutée (${why})`);
  }
  return new Map([...pairs].map(([id, set]) => [id, [...set].sort()]));
}

// ---------------------------------------------------------------------------

async function main() {
  const log: BuildLog = { sourceDisagreements: [], droppedAliases: [], borders: [] };
  console.log('Pays…');
  const countries = await buildCountries(log);
  const playable = new Set(countries.map((c) => c.id));

  console.log('Carte…');
  const { topo, meta, mapNeighbors, featureIds, droppedIslets } = await buildMap(playable);

  console.log('Frontières…');
  const neighbors = await buildNeighbors(playable, mapNeighbors, log);

  const full: Country[] = countries.map((c) => {
    const m = meta.get(c.id);
    if (!m) throw new Error(`${c.id} (${c.name}) n'a pas de forme sur la carte`);
    return { ...c, neighbors: neighbors.get(c.id) ?? [], map: m };
  });

  console.log('Drapeaux…');
  await rm(FLAGS_OUT, { recursive: true, force: true });
  await mkdir(FLAGS_OUT, { recursive: true });
  for (const c of full) {
    const src = join(FLAGS_SRC, `${c.iso2}.svg`);
    if (!existsSync(src)) throw new Error(`Drapeau manquant pour ${c.id} (${c.iso2})`);
    await copyFile(src, join(FLAGS_OUT, `${c.iso2}.svg`));
  }

  await mkdir(OUT, { recursive: true });
  const data: CountryData = { generatedAt: new Date().toISOString().slice(0, 10), countries: full };
  await writeFile(join(OUT, 'countries.json'), JSON.stringify(data, null, 1) + '\n');
  await writeFile(join(OUT, 'world.topo.json'), JSON.stringify(topo));
  await writeFile(
    join(ROOT, 'data/build-log.json'),
    JSON.stringify({ ...log, droppedIslets, otherMapFeatures: featureIds.filter((id) => !playable.has(id)).sort() }, null, 1) + '\n',
  );
  console.log(`OK : ${full.length} pays, ${featureIds.length} formes sur la carte, ${droppedIslets} îlots retirés.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
