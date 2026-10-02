/**
 * Vérifie les données générées et écrit le rapport data/REPORT.md.
 * Code de sortie ≠ 0 si une erreur bloquante est trouvée.
 *
 * Usage : npm run data:validate
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { geoArea, geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import type { Feature, FeatureCollection } from 'geojson';
import type { Country, CountryData } from '../../src/lib/data/types';
import { editDistance, matchAnswer, matchKey } from '../../src/lib/game/matching';
import { capitalOfPhrase } from '../../src/lib/data/grammar';

const ROOT = join(import.meta.dirname, '../..');
const data: CountryData = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/countries.json'), 'utf8'));
const topo = JSON.parse(readFileSync(join(ROOT, 'src/lib/data/world.topo.json'), 'utf8')) as Topology;
const log = JSON.parse(readFileSync(join(ROOT, 'data/build-log.json'), 'utf8'));
const C = data.countries;

const errors: string[] = [];
const warnings: string[] = [];
const check = (ok: boolean, msg: string) => {
  if (!ok) errors.push(msg);
  return ok;
};
const label = (c: Country) => `${c.name} (${c.id})`;

// --- 1. Nombre de pays -------------------------------------------------------
const members = C.filter((c) => c.status === 'member');
const observers = C.filter((c) => c.status === 'observer');
check(members.length === 193, `193 membres de l'ONU attendus, ${members.length} trouvés`);
check(observers.length === 2, `2 observateurs attendus, ${observers.length} trouvés`);
check(
  observers.map((c) => c.id).sort().join() === 'PSE,VAT',
  `Observateurs attendus : Palestine et Vatican (trouvés : ${observers.map(label).join(', ')})`,
);
check(new Set(C.map((c) => c.id)).size === C.length, 'Identifiants ISO alpha-3 en double');
check(new Set(C.map((c) => c.iso2)).size === C.length, 'Codes ISO alpha-2 en double');

// --- 2. Champs obligatoires --------------------------------------------------
const badText = /[?�]|\d|^\s|\s$/;
for (const c of C) {
  check(!!c.name && !badText.test(c.name), `${c.id} : nom manquant ou suspect « ${c.name} »`);
  check(!!c.capital && !badText.test(c.capital), `${label(c)} : capitale manquante ou suspecte « ${c.capital} »`);
  check(['le', 'la', "l'", 'les', ''].includes(c.article), `${label(c)} : article invalide`);
  check(c.continents.length > 0, `${label(c)} : aucun continent`);
  check([1, 2, 3, 4].includes(c.tier), `${label(c)} : niveau invalide`);
  check(c.population > 0, `${label(c)} : population manquante`);
}

// --- 3. Drapeaux -------------------------------------------------------------
let flagsOk = 0;
for (const c of C) {
  const f = join(ROOT, 'public/flags', `${c.iso2}.svg`);
  if (!check(existsSync(f), `${label(c)} : drapeau manquant (public/flags/${c.iso2}.svg)`)) continue;
  const svg = readFileSync(f, 'utf8');
  if (check(svg.includes('<svg') && svg.trim().endsWith('</svg>') && svg.length > 100, `${label(c)} : drapeau SVG invalide`)) flagsOk++;
}

// --- 4. Carte ----------------------------------------------------------------
const fc = feature(topo, topo.objects.countries as any) as unknown as FeatureCollection;
const byId = new Map(fc.features.map((f) => [f.id as string, f as Feature]));
let shapesOk = 0;
for (const c of C) {
  const f = byId.get(c.id);
  if (!check(!!f, `${label(c)} : aucune forme sur la carte`)) continue;
  const km2 = geoArea(f!) * 6371 ** 2;
  if (!check(km2 > 0 && km2 < 2e7, `${label(c)} : forme invalide (aire ${km2.toFixed(1)} km²)`)) continue;
  const [[x0, y0], [x1, y1]] = c.map.focus;
  check(x0 <= x1 && y0 <= y1, `${label(c)} : emprise de zoom invalide`);
  const [px, py] = c.map.point;
  const inFocus = px >= x0 - 1 && px <= x1 + 1 && py >= y0 - 1 && py <= y1 + 1;
  if (!inFocus) warnings.push(`${label(c)} : le point d'ancrage est hors de l'emprise principale`);
  if (!c.map.small && !geoContains(f!, c.map.point)) warnings.push(`${label(c)} : le point d'ancrage tombe hors des terres (simplification)`);
  shapesOk++;
}
const nonPlayable = fc.features.map((f) => f.id as string).filter((id) => !C.some((c) => c.id === id));

// --- 4 bis. Frontières terrestres (jeu « Chemin ») ------------------------------
const byIdC = new Map(C.map((c) => [c.id, c]));
let borderPairs = 0;
for (const c of C) {
  for (const n of c.neighbors) {
    if (!check(byIdC.has(n), `${label(c)} : voisin inconnu ${n}`)) continue;
    check(byIdC.get(n)!.neighbors.includes(c.id), `Frontière non symétrique : ${c.id} → ${n}`);
    if (c.id < n) borderPairs++;
  }
}
const components: string[][] = [];
const seenC = new Set<string>();
for (const c of C) {
  if (seenC.has(c.id) || c.neighbors.length === 0) continue;
  const comp: string[] = [];
  const queue = [c.id];
  seenC.add(c.id);
  while (queue.length) {
    const id = queue.shift()!;
    comp.push(id);
    for (const n of byIdC.get(id)!.neighbors) if (!seenC.has(n)) (seenC.add(n), queue.push(n));
  }
  components.push(comp);
}
components.sort((a, b) => b.length - a.length);
const landlocked = C.filter((c) => c.neighbors.length === 0);
check(components[0]?.length > 100, 'Le grand bloc Europe-Asie-Afrique devrait relier plus de 100 pays');

// --- 5. Ambiguïtés des réponses ----------------------------------------------
const nameKeys = new Map<string, string[]>();
for (const c of C) for (const n of [c.name, ...c.altNames]) {
  const k = matchKey(n);
  nameKeys.set(k, [...(nameKeys.get(k) ?? []), c.id]);
}
for (const [k, ids] of nameKeys) {
  const uniq = [...new Set(ids)];
  check(uniq.length === 1, `Nom « ${k} » partagé par plusieurs pays : ${uniq.join(', ')}`);
}
const capKeys = new Map<string, string[]>();
for (const c of C) {
  const k = matchKey(c.capital);
  capKeys.set(k, [...(capKeys.get(k) ?? []), c.id]);
}
for (const [k, ids] of capKeys) check(ids.length === 1, `Capitale « ${k} » partagée par ${ids.join(', ')}`);

// Le nom exact d'un pays ne doit jamais être accepté comme réponse pour un autre pays.
let crossAccepted = 0;
const allNames = (c: Country) => [c.name, ...c.altNames];
for (const a of C) for (const b of C) {
  if (a === b) continue;
  const confusables = C.filter((x) => x !== b).flatMap(allNames);
  if (matchAnswer(a.name, allNames(b), confusables).correct) {
    crossAccepted++;
    errors.push(`« ${a.name} » serait accepté comme réponse pour ${label(b)}`);
  }
}
// Paires proches (gérées par la règle « plus proche d'une autre réponse = faux »).
const closePairs: string[] = [];
for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) {
  const d = editDistance(matchKey(C[i].name), matchKey(C[j].name));
  if (d <= 2) closePairs.push(`${C[i].name} / ${C[j].name} (${d})`);
}

// --- 6. Tests de saisie de référence ------------------------------------------
const find = (id: string) => C.find((c) => c.id === id)!;
const capitalConf = (id: string) => C.filter((c) => c.id !== id).flatMap((c) => [c.capital, ...c.capitalAlt]);
const nameConf = (id: string) => C.filter((c) => c.id !== id).flatMap(allNames);
const samples: [string, string, 'name' | 'capital', boolean][] = [
  ["cote d'ivoire", 'CIV', 'name', true],
  ['COTE-D IVOIRE', 'CIV', 'name', true],
  ['Myanmar', 'MMR', 'name', true],
  ['Birmanie', 'MMR', 'name', true],
  ['RDC', 'COD', 'name', true],
  ['la france', 'FRA', 'name', true],
  ['les pays bas', 'NLD', 'name', true],
  ['Kazakstan', 'KAZ', 'name', true],
  ['Ouzbekistan', 'UZB', 'name', true],
  ['Niger', 'NGA', 'name', false],
  ['Irak', 'IRN', 'name', false],
  ['Gambie', 'ZMB', 'name', false],
  ['Slovaquie', 'SVN', 'name', false],
  ['Autriche', 'AUS', 'name', false],
  ['ouagadougou', 'BFA', 'capital', true],
  ['Ouagadougu', 'BFA', 'capital', true],
  ['pekin', 'CHN', 'capital', true],
  ['Beijing', 'CHN', 'capital', true],
  ['Kyiv', 'UKR', 'capital', true],
  ['le cap', 'ZAF', 'capital', true],
  ['La Paz', 'BOL', 'capital', true],
  ['nukualofa', 'TON', 'capital', true],
  ['Chisinau', 'MDA', 'capital', true],
  ['ndjamena', 'TCD', 'capital', true],
  ['Sydney', 'AUS', 'capital', false],
  ['Kingstown', 'JAM', 'capital', false],
];
const sampleRows = samples.map(([input, id, kind, expected]) => {
  const c = find(id);
  const res =
    kind === 'name'
      ? matchAnswer(input, allNames(c), nameConf(id))
      : matchAnswer(input, [c.capital, ...c.capitalAlt], capitalConf(id));
  check(res.correct === expected, `Saisie « ${input} » pour ${label(c)} : attendu ${expected ? 'accepté' : 'refusé'}`);
  return `| \`${input}\` | ${kind === 'name' ? c.name : `capitale ${capitalOfPhrase(c)}`} | ${expected ? 'acceptée' : 'refusée'} | ${res.correct === expected ? '✅' : '❌'} |`;
});

// --- Rapport -----------------------------------------------------------------
const byContinent = (id: string) => C.filter((c) => c.continents.includes(id as any)).length;
const tierRow = (t: number) => C.filter((c) => c.tier === t);
const special = C.filter((c) => c.capitalNote);
const ok = errors.length === 0;

const md = `# Rapport de vérification des données

Généré par \`npm run data:validate\` — données du ${data.generatedAt}.

**Résultat : ${ok ? '✅ aucune erreur' : `❌ ${errors.length} erreur(s)`}**${warnings.length ? ` · ${warnings.length} avertissement(s)` : ''}

## Synthèse

| Vérification | Résultat |
|---|---|
| États membres de l'ONU | ${members.length} / 193 ${members.length === 193 ? '✅' : '❌'} |
| États observateurs (Vatican, Palestine) | ${observers.length} / 2 ${observers.length === 2 ? '✅' : '❌'} |
| **Total des pays jouables** | **${C.length}** |
| Pays sans capitale | ${C.filter((c) => !c.capital).length} ${C.every((c) => c.capital) ? '✅' : '❌'} |
| Drapeaux SVG présents et valides | ${flagsOk} / ${C.length} ${flagsOk === C.length ? '✅' : '❌'} |
| Pays avec une forme sur la carte | ${shapesOk} / ${C.length} ${shapesOk === C.length ? '✅' : '❌'} |
| Noms ambigus entre deux pays | ${[...nameKeys.values()].filter((v) => new Set(v).size > 1).length} ✅ |
| Nom d'un pays accepté pour un autre | ${crossAccepted} ${crossAccepted === 0 ? '✅' : '❌'} |
| Frontières terrestres (symétriques) | ${borderPairs} paires ✅ |
| Tests de saisie tolérante | ${sampleRows.filter((r) => r.endsWith('✅ |')).length} / ${samples.length} ${sampleRows.every((r) => r.endsWith('✅ |')) ? '✅' : '❌'} |

${errors.length ? `## ❌ Erreurs\n\n${errors.map((e) => `- ${e}`).join('\n')}\n` : ''}
${warnings.length ? `## ⚠️ Avertissements\n\n${warnings.map((e) => `- ${e}`).join('\n')}\n` : ''}
## Répartition

| Continent | Pays |
|---|---|
| Afrique | ${byContinent('africa')} |
| Amérique du Nord (avec Amérique centrale et Caraïbes) | ${byContinent('north-america')} |
| Amérique du Sud | ${byContinent('south-america')} |
| Asie | ${byContinent('asia')} |
| Europe | ${byContinent('europe')} |
| Océanie | ${byContinent('oceania')} |

Russie et Turquie comptent à la fois en Europe et en Asie.

| Niveau | Pays | Liste |
|---|---|---|
${[1, 2, 3, 4].map((t) => `| ${t} | ${tierRow(t).length} | ${tierRow(t).map((c) => c.name).join(', ')} |`).join('\n')}

## Cas particuliers des capitales

| Pays | Capitale retenue | Aussi acceptées en saisie | Note |
|---|---|---|---|
${special.map((c) => `| ${c.name} | ${c.capital} | ${c.capitalAlt.join(', ') || '—'} | ${c.capitalNote} |`).join('\n')}

Exclus des questions « capitale → pays » (réponse ambiguë) : ${C.filter((c) => !c.reverseCapital).map((c) => c.name).join(', ')}.

## Saisie libre : tests de référence

| Saisie | Question | Attendu | OK |
|---|---|---|---|
${sampleRows.join('\n')}

Noms de pays proches (distance ≤ 2) — une saisie plus proche d'un autre pays est refusée :
${closePairs.join(' · ')}

## Désaccords entre sources (résolus)

${log.sourceDisagreements.map((s: string) => `- ${s}`).join('\n')}

## Frontières terrestres (jeu « Chemin »)

- ${borderPairs} frontières, toutes symétriques.
- Blocs de pays reliés par la terre : ${components.map((c) => `${c.length} pays (${c.length > 4 ? 'dont ' + c.slice(0, 3).map((id) => byIdC.get(id)!.name).join(', ') + '…' : c.map((id) => byIdC.get(id)!.name).join(', ')})`).join(' ; ')}.
- ${landlocked.length} pays sans frontière terrestre (îles), jamais choisis comme départ ou arrivée : ${landlocked.map((c) => c.name).join(', ')}.

Corrections et cas particuliers :
${log.borders.map((b: string) => `- ${b}`).join('\n')}

## Carte

- Source : Natural Earth 1:10m, version « point de vue France » (domaine public), projection de Miller.
- ${fc.features.length} formes, dont ${C.length} pays jouables et ${nonPlayable.length} territoires affichés en gris (non cliquables) : ${nonPlayable.join(', ')}.
- ${log.droppedIslets} îlots minuscules retirés pour alléger la carte (jamais la dernière forme d'un pays).
- ${C.filter((c) => c.map.small).length} pays trop petits pour être cliqués à l'échelle du monde, affichés avec un marqueur : ${C.filter((c) => c.map.small).map((c) => c.name).join(', ')}.

<details><summary>Formulations générées pour les ${C.length} pays (relecture grammaticale)</summary>

${C.map((c) => `- Quelle est la capitale ${capitalOfPhrase(c)} ? → ${c.capital}`).join('\n')}

</details>
`;

writeFileSync(join(ROOT, 'data/REPORT.md'), md);
console.log(md.split('## Répartition')[0]);
if (!ok) process.exit(1);
