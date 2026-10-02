<script lang="ts">
  import { Play, Shuffle } from '@lucide/svelte';
  import TopBar from '../../lib/ui/TopBar.svelte';
  import Segmented from '../../lib/ui/Segmented.svelte';
  import Chip from '../../lib/ui/Chip.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import type { ContinentId } from '../../lib/data/types';
  import { LENGTHS, generatePuzzle, pathCountries, type ForbiddenMode, type PathLength } from '../../lib/game/path';
  import { createRng } from '../../lib/game/random';
  import { currentPath } from '../../lib/game/pathSession.svelte';
  import { loadJson, saveJson } from '../../lib/storage';

  type RegionId = 'world' | 'europe' | 'africa' | 'asia' | 'americas';
  const REGIONS: { id: RegionId; label: string; continents: ContinentId[] }[] = [
    { id: 'world', label: 'Monde', continents: [] },
    { id: 'europe', label: 'Europe', continents: ['europe'] },
    { id: 'africa', label: 'Afrique', continents: ['africa'] },
    { id: 'asia', label: 'Asie', continents: ['asia'] },
    { id: 'americas', label: 'Amériques', continents: ['north-america', 'south-america'] },
  ];

  interface Saved {
    region: RegionId;
    length: PathLength;
    forbidden: ForbiddenMode;
  }
  const saved = loadJson<Partial<Saved>>('orbo:setup:path', {});

  let region = $state<RegionId>(saved.region ?? 'europe');
  let length = $state<PathLength>(saved.length ?? 'short');
  let forbidden = $state<ForbiddenMode>(saved.forbidden ?? 'sometimes');
  let start = $state('');
  let end = $state('');
  let error = $state('');

  const continents = $derived(REGIONS.find((r) => r.id === region)!.continents);
  /** Tous les pays qui ont au moins une frontière terrestre, par ordre alphabétique. */
  const options = pathCountries().sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  function begin() {
    error = '';
    const config = { continents, length, forbidden, start: start || undefined, end: end || undefined };
    try {
      // Vérifie tout de suite qu'un chemin existe, pour afficher l'erreur ici plutôt qu'en jeu.
      generatePuzzle(config, createRng(1));
    } catch (e) {
      error = (e as Error).message;
      return;
    }
    saveJson('orbo:setup:path', { region, length, forbidden } satisfies Saved);
    currentPath.start(config);
  }

  function swap() {
    [start, end] = [end, start];
  }
</script>

<TopBar title="Chemin" />

<div class="stack">
  <p class="intro muted">
    Relie le pays de départ au pays d'arrivée en tapant le nom des pays à traverser, de frontière en frontière. Les
    pays reliés seulement par la mer ne comptent pas.
  </p>

  <section>
    <h2>Région</h2>
    <div class="chips">
      {#each REGIONS as r (r.id)}
        <Chip selected={region === r.id} onclick={() => (region = r.id)}>{r.label}</Chip>
      {/each}
    </div>
  </section>

  <section>
    <h2>Longueur</h2>
    <Segmented
      label="Longueur du chemin"
      bind:value={length}
      options={(Object.keys(LENGTHS) as PathLength[]).map((k) => ({
        value: k,
        label: LENGTHS[k].label,
        hint: `${LENGTHS[k].min}–${LENGTHS[k].max} pays`,
      }))}
    />
  </section>

  <section>
    <h2>Pays interdit</h2>
    <Segmented
      label="Pays interdit"
      bind:value={forbidden}
      options={[
        { value: 'never', label: 'Jamais' },
        { value: 'sometimes', label: 'Parfois' },
        { value: 'always', label: 'Toujours' },
      ]}
    />
    <p class="help">Un pays du chemin le plus court devient infranchissable : il faut le contourner.</p>
  </section>

  <section>
    <h2>Départ et arrivée</h2>
    <div class="pair">
      <label class="select">
        <span>Départ</span>
        <select bind:value={start}>
          <option value="">Au hasard</option>
          {#each options as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
        </select>
      </label>
      <button type="button" class="swap" aria-label="Inverser départ et arrivée" onclick={swap}><Shuffle /></button>
      <label class="select">
        <span>Arrivée</span>
        <select bind:value={end}>
          <option value="">Au hasard</option>
          {#each options as c (c.id)}<option value={c.id}>{c.name}</option>{/each}
        </select>
      </label>
    </div>
    <p class="help">Au hasard, les pays sont pris dans la région choisie. Par exemple : de la France à la Turquie.</p>
  </section>

  {#if error}<p class="error" role="alert">{error}</p>{/if}

  <Button size="lg" block onclick={begin}>
    {#snippet icon()}<Play />{/snippet}
    Commencer
  </Button>
</div>

<style>
  .stack {
    display: grid;
    gap: 1.5rem;
  }
  .intro {
    font-size: var(--fs-sm);
  }
  section {
    display: grid;
    gap: 0.6rem;
  }
  h2 {
    margin-left: 0.2rem;
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .help {
    margin-left: 0.2rem;
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: end;
    gap: 8px;
  }
  .select {
    display: grid;
    gap: 4px;
    min-width: 0;
  }
  .select span {
    margin-left: 0.2rem;
    font-size: var(--fs-xs);
    font-weight: 650;
    color: var(--text-muted);
  }
  select {
    width: 100%;
    min-width: 0;
    padding: 0.75rem 2.2rem 0.75rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238b83a0' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")
        no-repeat right 0.8rem center,
      var(--surface);
    color: var(--text);
    font: 600 var(--fs-md) / 1.2 var(--font);
    appearance: none;
    cursor: pointer;
  }
  select:focus-visible {
    border-color: var(--violet);
  }
  .swap {
    display: grid;
    place-items: center;
    width: 44px;
    height: 46px;
    border: 0;
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--text-muted);
  }
  .swap:hover {
    color: var(--text);
  }
  .swap :global(svg) {
    width: 18px;
    height: 18px;
  }
  .error {
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    background: var(--pink-soft);
    color: var(--pink-strong);
    font-weight: 600;
    font-size: var(--fs-sm);
  }
</style>
