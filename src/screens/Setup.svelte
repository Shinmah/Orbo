<script lang="ts">
  import { Play } from '@lucide/svelte';
  import TopBar from '../lib/ui/TopBar.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Chip from '../lib/ui/Chip.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { CONTINENTS, COUNTRIES, TIERS, filterCountries } from '../lib/data';
  import type { ContinentId, Tier } from '../lib/data/types';
  import { SKILLS, type Skill } from '../lib/game/skills';
  import { modesForSkill } from '../lib/game/modes';
  import { current } from '../lib/game/current.svelte';
  import type { SessionConfig } from '../lib/game/config';
  import type { ModeId } from '../lib/game/types';
  import { loadJson, saveJson } from '../lib/storage';
  import { progress } from '../lib/progress.svelte';

  interface Props {
    skill: Skill;
  }
  let { skill }: Props = $props();

  const info = $derived(SKILLS[skill]);
  const modes = $derived(modesForSkill(skill));

  type Saved = { direction: string; continents: ContinentId[]; maxTier: Tier; format: SessionConfig['format']; length: number };
  // svelte-ignore state_referenced_locally
  const saved = loadJson<Partial<Saved>>(`orbo:setup:${skill}`, {});

  let direction = $state(saved.direction ?? 'both');
  let continents = $state<ContinentId[]>(saved.continents ?? []);
  let maxTier = $state<Tier>(saved.maxTier ?? 1);
  let format = $state<SessionConfig['format']>(saved.format ?? 'auto');
  let length = $state(saved.length ?? 10);

  const selectedModes = $derived<ModeId[]>(direction === 'both' ? modes.map((m) => m.id) : [direction as ModeId]);
  const supportsInput = $derived(selectedModes.some((id) => modes.find((m) => m.id === id)!.formats.includes('input')));
  const countFor = (t: Tier) => filterCountries({ continents, maxTier: t }).length;
  const poolSize = $derived(countFor(maxTier));
  const questionCount = $derived(length === 0 ? poolSize : Math.min(length, poolSize));
  const learned = $derived(progress.learnedCount(skill, filterCountries({ continents, maxTier })));

  function toggle(id: ContinentId) {
    continents = continents.includes(id) ? continents.filter((c) => c !== id) : [...continents, id];
  }

  function start() {
    saveJson(`orbo:setup:${skill}`, { direction, continents, maxTier, format, length } satisfies Saved);
    current.start({ skill, modes: selectedModes, continents, maxTier, format: supportsInput ? format : 'auto', length });
  }

  const formatHelp = {
    auto: 'QCM pour découvrir, puis saisie libre pour un pays dès que tu l’as trouvé deux fois de suite.',
    choice: 'Toujours 4 propositions.',
    input: 'Tape la réponse. Accents, majuscules et petites fautes sont tolérés.',
  };
</script>

<TopBar title={info.label} />

<div class="stack">
  <section>
    <h2>Question</h2>
    <Segmented
      label="Type de question"
      bind:value={direction}
      options={[...modes.map((m) => ({ value: m.id as string, label: m.label })), { value: 'both', label: 'Les deux' }]}
    />
  </section>

  <section>
    <h2>Région</h2>
    <div class="chips">
      <Chip selected={continents.length === 0} onclick={() => (continents = [])}>Monde</Chip>
      {#each CONTINENTS as c (c.id)}
        <Chip selected={continents.includes(c.id)} onclick={() => toggle(c.id)}>{c.label}</Chip>
      {/each}
    </div>
  </section>

  <section>
    <h2>Niveau</h2>
    <Segmented
      label="Niveau"
      bind:value={maxTier}
      options={TIERS.map((t) => ({ value: t.tier, label: t.label, hint: `${countFor(t.tier)} pays` }))}
    />
    <p class="help">{TIERS[maxTier - 1].description}{maxTier > 1 ? ', en plus des niveaux précédents' : ''}.</p>
  </section>

  {#if supportsInput}
    <section>
      <h2>Réponses</h2>
      <Segmented
        label="Format des réponses"
        bind:value={format}
        options={[
          { value: 'auto', label: 'Auto' },
          { value: 'choice', label: 'QCM' },
          { value: 'input', label: 'Saisie' },
        ]}
      />
      <p class="help">{formatHelp[format]}</p>
    </section>
  {/if}

  <section>
    <h2>Longueur</h2>
    <Segmented
      label="Nombre de questions"
      bind:value={length}
      options={[
        { value: 10, label: '10' },
        { value: 20, label: '20' },
        { value: 0, label: 'Tous', hint: `${poolSize}` },
      ]}
    />
  </section>

  <div class="footer">
    <p class="muted small num">{learned} / {poolSize} pays déjà connus dans cette sélection</p>
    <Button size="lg" block onclick={start} disabled={poolSize === 0}>
      {#snippet icon()}<Play />{/snippet}
      Commencer · {questionCount} question{questionCount > 1 ? 's' : ''}
    </Button>
  </div>
</div>

<p class="visually-hidden">{COUNTRIES.length} pays au total.</p>

<style>
  .stack {
    display: grid;
    gap: 1.6rem;
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
  .footer {
    display: grid;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }
  .small {
    font-size: var(--fs-sm);
    text-align: center;
  }
</style>
