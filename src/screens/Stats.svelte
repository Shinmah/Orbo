<script lang="ts">
  import { Target } from '@lucide/svelte';
  import TopBar from '../lib/ui/TopBar.svelte';
  import StatTile from '../lib/ui/StatTile.svelte';
  import ProgressBar from '../lib/ui/ProgressBar.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Flag from '../lib/ui/Flag.svelte';
  import Button from '../lib/ui/Button.svelte';
  import WorldMap from '../lib/map/WorldMap.svelte';
  import { CONTINENTS, COUNTRIES } from '../lib/data';
  import { SKILLS, SKILL_LIST, type Skill } from '../lib/game/skills';
  import { MODE_LIST } from '../lib/game/modes';
  import { progress } from '../lib/progress.svelte';
  import { current } from '../lib/game/current.svelte';
  import { router } from '../lib/router.svelte';

  let mapSkill = $state<Skill>('capital');

  const totals = $derived(progress.data.totals);
  const accuracy = $derived(totals.answered ? Math.round((totals.correct / totals.answered) * 100) : 0);
  const missed = $derived(progress.mostMissed(10));

  const MASTERY_FILL = ['', 'var(--pink)', 'var(--violet)', 'var(--green)'];
  const fills = $derived(
    Object.fromEntries(
      COUNTRIES.map((c) => [c.id, MASTERY_FILL[progress.masteryOf(c.id, mapSkill)]]).filter(([, f]) => f),
    ) as Record<string, string>,
  );

  function skillRow(skill: Skill) {
    let learning = 0;
    let known = 0;
    let mastered = 0;
    for (const c of COUNTRIES) {
      const m = progress.masteryOf(c.id, skill);
      if (m === 1) learning++;
      else if (m === 2) known++;
      else if (m === 3) mastered++;
    }
    return { learning, known, mastered };
  }

  function continentShare(id: string): number {
    const list = COUNTRIES.filter((c) => c.continents.includes(id as never));
    let sum = 0;
    for (const c of list) for (const s of SKILL_LIST) sum += progress.masteryOf(c.id, s.id) >= 2 ? 1 : 0;
    return sum / (list.length * SKILL_LIST.length);
  }

  function practiceMissed() {
    current.start({
      skill: 'mixed',
      modes: MODE_LIST.map((m) => m.id),
      continents: [],
      maxTier: 4,
      format: 'auto',
      length: 0,
      only: missed.map((m) => m.country.id),
    });
  }
</script>

<div class="narrow">
  <TopBar title="Statistiques" />
</div>

{#if totals.answered === 0}
  <div class="narrow empty">
    <h1>Pas encore de statistiques</h1>
    <p class="muted">Joue une première partie : ta progression s'affichera ici, pays par pays.</p>
    <Button size="lg" onclick={() => router.go('/')}>Commencer</Button>
  </div>
{:else}
  <div class="narrow stack">
    <div class="tiles">
      <StatTile label="Questions" tone="violet">{totals.answered.toLocaleString('fr-FR')}</StatTile>
      <StatTile label="Réussite" tone="green">{accuracy} %</StatTile>
      <StatTile label="Meilleure série" tone="pink">{totals.bestStreak}</StatTile>
      <StatTile label="Jours joués" sub={progress.dayStreak ? `Série : ${progress.dayStreak} j` : undefined}>
        {progress.daysPlayed}
      </StatTile>
    </div>

    <section>
      <h2>Maîtrise</h2>
      <div class="skills">
        {#each SKILL_LIST as s (s.id)}
          {@const r = skillRow(s.id)}
          <div class="skill">
            <div class="skill-head">
              <span class="skill-name">{s.label}</span>
              <span class="muted num small">{r.known + r.mastered} / {COUNTRIES.length} pays connus</span>
            </div>
            <ProgressBar value={(r.known + r.mastered) / COUNTRIES.length} tone={s.tone} />
            <span class="muted small num">
              {r.mastered} maîtrisés · {r.known} connus · {r.learning} en apprentissage
            </span>
          </div>
        {/each}
      </div>
    </section>
  </div>

  <section class="map-section">
    <div class="narrow map-head">
      <h2>Carte de maîtrise</h2>
      <Segmented
        label="Compétence affichée"
        bind:value={mapSkill}
        options={SKILL_LIST.map((s) => ({ value: s.id, label: s.label }))}
      />
    </div>
    <div class="map-box">
      <WorldMap
        {fills}
        markerIds={COUNTRIES.filter((c) => c.map.small && fills[c.id]).map((c) => c.id)}
        label="Carte de maîtrise : {SKILLS[mapSkill].label}"
      />
    </div>
    <div class="legend narrow">
      <span><i style:background="var(--map-land)"></i>Jamais vu</span>
      <span><i style:background="var(--pink)"></i>En apprentissage</span>
      <span><i style:background="var(--violet)"></i>Connu</span>
      <span><i style:background="var(--green)"></i>Maîtrisé</span>
    </div>
  </section>

  <div class="narrow stack">
    <section>
      <h2>Par continent</h2>
      <div class="continents">
        {#each CONTINENTS as c (c.id)}
          {@const v = continentShare(c.id)}
          <div class="continent">
            <span class="c-name">{c.label}</span>
            <ProgressBar value={v} tone="green" height={6} />
            <span class="num small muted">{Math.round(v * 100)} %</span>
          </div>
        {/each}
      </div>
    </section>

    {#if missed.length}
      <section>
        <h2>Les pays que tu rates le plus</h2>
        <ul class="missed">
          {#each missed as m (m.country.id)}
            <li>
              <Flag iso2={m.country.iso2} width={32} />
              <span class="m-name">{m.country.name}</span>
              <span class="m-stat num">
                <strong>{m.wrong}</strong> erreur{m.wrong > 1 ? 's' : ''} · {Math.round((m.correct / m.seen) * 100)} %
              </span>
            </li>
          {/each}
        </ul>
        <Button block variant="soft" onclick={practiceMissed}>
          {#snippet icon()}<Target />{/snippet}
          S'entraîner sur ces pays
        </Button>
      </section>
    {/if}
  </div>
{/if}

<style>
  .narrow {
    max-width: var(--content);
    margin: 0 auto;
  }
  .stack {
    display: grid;
    gap: 1.75rem;
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding-top: 15vh;
    text-align: center;
  }
  .empty h1 {
    font-size: var(--fs-xl);
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  section {
    display: grid;
    gap: 0.75rem;
  }
  h2 {
    margin-left: 0.2rem;
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .small {
    font-size: var(--fs-xs);
  }
  .skills {
    display: grid;
    gap: 1rem;
  }
  .skill {
    display: grid;
    gap: 0.4rem;
  }
  .skill-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }
  .skill-name {
    font-weight: 700;
  }
  .map-section {
    margin: 1.75rem 0;
  }
  .map-head {
    display: grid;
    gap: 0.75rem;
    width: 100%;
  }
  .map-box {
    aspect-ratio: 2.05;
    max-height: 560px;
  }
  .map-box :global(.map) {
    height: 100%;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem 1rem;
    font-size: var(--fs-xs);
    color: var(--text-muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .legend i {
    width: 12px;
    height: 12px;
    border-radius: 4px;
  }
  .continents {
    display: grid;
    gap: 0.6rem;
  }
  .continent {
    display: grid;
    grid-template-columns: 9.5rem 1fr 2.6rem;
    align-items: center;
    gap: 0.75rem;
  }
  .c-name {
    font-size: var(--fs-sm);
    font-weight: 600;
  }
  .missed {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .missed li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .m-name {
    flex: 1;
    font-weight: 650;
  }
  .m-stat {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .m-stat strong {
    color: var(--pink-strong);
  }
  @media (max-width: 560px) {
    .tiles {
      grid-template-columns: 1fr 1fr;
    }
    .continent {
      grid-template-columns: 7.5rem 1fr 2.6rem;
    }
  }
</style>
