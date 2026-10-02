<script lang="ts">
  import { Play, Compass } from '@lucide/svelte';
  import TopBar from '../lib/ui/TopBar.svelte';
  import Chip from '../lib/ui/Chip.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Button from '../lib/ui/Button.svelte';
  import StatTile from '../lib/ui/StatTile.svelte';
  import { SKILL_LIST, type Skill } from '../lib/game/skills';
  import { modesForSkill } from '../lib/game/modes';
  import { current } from '../lib/game/current.svelte';
  import { progress } from '../lib/progress.svelte';
  import { router } from '../lib/router.svelte';

  let skills = $state<Skill[]>(['capital', 'flag', 'map']);
  let length = $state(20);

  const bySkill = $derived(Object.fromEntries(SKILL_LIST.map((s) => [s.id, progress.reviewSummary([s.id]).total])) as Record<Skill, number>);
  const summary = $derived(progress.reviewSummary(skills));
  const count = $derived(length === 0 ? summary.total : Math.min(length, summary.total));

  function toggle(s: Skill) {
    skills = skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s];
  }

  function start() {
    current.start({
      skill: 'mixed',
      modes: skills.flatMap((s) => modesForSkill(s).map((m) => m.id)),
      continents: [],
      maxTier: 4,
      format: 'auto',
      length,
      review: true,
    });
  }
</script>

<TopBar title="Révision" />

{#if !progress.hasPlayed()}
  <div class="empty">
    <span class="badge"><Compass /></span>
    <h1>Rien à réviser… pour l'instant</h1>
    <p class="muted">Joue une première partie : les pays que tu croises reviendront ici, les erreurs en premier.</p>
    <Button size="lg" onclick={() => router.go('/')}>Jouer une partie</Button>
  </div>
{:else}
  <div class="stack">
    <div class="tiles">
      <StatTile label="Ratés" tone="pink" sub="la dernière fois">{summary.failed}</StatTile>
      <StatTile label="À réviser" tone="violet" sub="aujourd'hui">{summary.due}</StatTile>
      <StatTile label="À consolider" tone="green" sub="connus, pas encore maîtrisés">{summary.consolidate}</StatTile>
    </div>

    <p class="intro muted">
      Les pays ratés passent en premier, puis ceux dont la date de révision est arrivée, puis ceux à consolider.
      Chaque bonne réponse repousse la prochaine révision (1, 2, 4, 9 puis 21 jours) ; après 3 bonnes réponses
      d'affilée, un pays est maîtrisé.
    </p>

    <section>
      <h2>Compétences</h2>
      <div class="chips">
        {#each SKILL_LIST as s (s.id)}
          <Chip selected={skills.includes(s.id)} onclick={() => toggle(s.id)}>
            {s.label} <span class="num muted">{bySkill[s.id]}</span>
          </Chip>
        {/each}
      </div>
    </section>

    <section>
      <h2>Longueur</h2>
      <Segmented
        label="Nombre de questions"
        bind:value={length}
        options={[
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 0, label: 'Tout', hint: `${summary.total}` },
        ]}
      />
    </section>

    {#if summary.total === 0}
      <p class="done">Tout est maîtrisé dans ces compétences. Bravo ! Joue une partie pour découvrir de nouveaux pays.</p>
    {/if}

    <Button size="lg" block onclick={start} disabled={count === 0}>
      {#snippet icon()}<Play />{/snippet}
      Réviser · {count} question{count > 1 ? 's' : ''}
    </Button>
  </div>
{/if}

<style>
  .stack {
    display: grid;
    gap: 1.5rem;
  }
  .tiles {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
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
  .done {
    padding: 0.75rem 1rem;
    border-radius: var(--radius);
    background: var(--green-soft);
    color: var(--green-strong);
    font-weight: 600;
    font-size: var(--fs-sm);
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 0.9rem;
    padding-top: 12vh;
    text-align: center;
  }
  .empty h1 {
    font-size: var(--fs-xl);
  }
  .empty p {
    max-width: 34ch;
  }
  .badge {
    display: grid;
    place-items: center;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--violet-soft);
    color: var(--violet-strong);
  }
  @media (max-width: 480px) {
    .tiles {
      grid-template-columns: 1fr;
    }
  }
</style>
