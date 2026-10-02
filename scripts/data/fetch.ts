/**
 * Télécharge les sources brutes et les fige dans data/raw/.
 * Ces fichiers sont versionnés : le build des données est ensuite
 * reproductible hors ligne (npm run data:build).
 *
 * Sources :
 *  - Wikidata (CC0)               : pays souverains, capitales FR/EN, alias FR, notoriété
 *  - mledoze/countries (ODbL)     : base derrière REST Countries, sert au recoupement
 *  - Natural Earth 1:10m (PD)     : frontières, version « point de vue France »
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const RAW = join(import.meta.dirname, '../../data/raw');
const UA = 'OrboDataBuilder/1.0 (projet éducatif; https://github.com/shinmah/orbo)';

async function get(url: string, init: RequestInit = {}): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...(init.headers ?? {}) } });
    if (res.ok) return res;
    if (attempt >= 4) throw new Error(`${res.status} ${res.statusText} — ${url}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
}

async function sparql(name: string, query: string) {
  const url = 'https://query.wikidata.org/sparql?query=' + encodeURIComponent(query);
  const res = await get(url, { headers: { Accept: 'application/sparql-results+json' } });
  const json = await res.json();
  await writeFile(join(RAW, `wikidata-${name}.json`), JSON.stringify(json.results.bindings, null, 1));
  console.log(`  wikidata-${name}.json : ${json.results.bindings.length} lignes`);
}

// États souverains actuels possédant un code ISO alpha-3 (+ observateurs ONU).
const STATES = `
  VALUES ?type { wd:Q3624078 wd:Q6256 }
  ?state wdt:P31 ?type ; wdt:P298 ?iso3 .
  FILTER NOT EXISTS { ?state wdt:P576 ?dissolved }
`;

const QUERIES: Record<string, string> = {
  // Capitales : déclarations de meilleur rang (wdt), sans date de fin.
  capitals: `SELECT DISTINCT ?iso3 ?state ?capital ?capitalFr ?capitalEn WHERE {
    ${STATES}
    ?state p:P36 ?st . ?st ps:P36 ?capital ; wikibase:rank ?rank .
    FILTER(?rank != wikibase:DeprecatedRank)
    FILTER NOT EXISTS { ?st pq:P582 ?end }
    OPTIONAL { ?capital rdfs:label ?capitalFr FILTER(LANG(?capitalFr) = "fr") }
    OPTIONAL { ?capital rdfs:label ?capitalEn FILTER(LANG(?capitalEn) = "en") }
  }`,
  // Noms, alias français, notoriété (nb d'articles Wikipédia), population.
  states: `SELECT ?iso3 ?state ?labelFr ?sitelinks (MAX(?pop) AS ?population)
    (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases) WHERE {
    ${STATES}
    ?state wikibase:sitelinks ?sitelinks .
    OPTIONAL { ?state rdfs:label ?labelFr FILTER(LANG(?labelFr) = "fr") }
    OPTIONAL { ?state skos:altLabel ?alias FILTER(LANG(?alias) = "fr") }
    OPTIONAL { ?state wdt:P1082 ?pop }
  } GROUP BY ?iso3 ?state ?labelFr ?sitelinks`,
  // Appartenance à l'ONU (Q1065) encore en vigueur.
  un: `SELECT DISTINCT ?iso3 ?state WHERE {
    ${STATES}
    ?state p:P463 ?m . ?m ps:P463 wd:Q1065 .
    FILTER NOT EXISTS { ?m pq:P582 ?end }
  }`,
  // Alias français des capitales (orthographes alternatives).
  capitalAliases: `SELECT ?capital (GROUP_CONCAT(DISTINCT ?alias; separator="|") AS ?aliases) WHERE {
    ${STATES}
    ?state wdt:P36 ?capital .
    ?capital skos:altLabel ?alias FILTER(LANG(?alias) = "fr")
  } GROUP BY ?capital`,
};

const NE_BASE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/10m_cultural/';
const NE_FILES = ['shp', 'shx', 'dbf', 'prj'].map((ext) => `ne_10m_admin_0_countries_fra.${ext}`);

async function main() {
  await mkdir(RAW, { recursive: true });
  console.log('Wikidata…');
  for (const [name, q] of Object.entries(QUERIES)) await sparql(name, q);

  console.log('mledoze/countries…');
  const mledoze = await get('https://raw.githubusercontent.com/mledoze/countries/master/countries.json');
  await writeFile(join(RAW, 'mledoze-countries.json'), await mledoze.text());

  console.log('Natural Earth 1:10m (point de vue France)…');
  await mkdir(join(RAW, 'natural-earth'), { recursive: true });
  for (const f of NE_FILES) {
    const res = await get(NE_BASE + f);
    await writeFile(join(RAW, 'natural-earth', f), Buffer.from(await res.arrayBuffer()));
    console.log(`  ${f}`);
  }
  await writeFile(
    join(RAW, 'SOURCES.md'),
    `# Sources brutes\n\nTéléchargées le ${new Date().toISOString().slice(0, 10)} par \`npm run data:fetch\`.\n\n` +
      `- Wikidata (CC0) — requêtes SPARQL dans scripts/data/fetch.ts\n` +
      `- mledoze/countries (ODbL) — https://github.com/mledoze/countries\n` +
      `- Natural Earth 1:10m admin 0, point de vue France (domaine public) — https://www.naturalearthdata.com\n`,
  );
  console.log('OK');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
