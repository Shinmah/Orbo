<script lang="ts">
  import { Play, PartyPopper } from '@lucide/svelte';
  import TopBar from '../lib/ui/TopBar.svelte';
  import Chip from '../lib/ui/Chip.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { SKILL_LIST, type Skill } from '../lib/game/skills';
  import { modesForSkill } from '../lib/game/modes';
  import { current } from '../lib/game/current.svelte';
  import { progress } from '../lib/progress.svelte';
  import { router } from '../lib/router.svelte';

  let skills = $state<Skill[]>(['capital', 'flag', 'map']);
  let length = $state(20);

  const dueBySkill = $derived(Object.fromEntries(SKILL_LIST.map((s) => [s.id, progress.dueCount([s.id])])) as Record<Skill, number>);
  const due = $derived(progress.dueCount(skills));
  const count = $derived(length === 0 ? due : Math.min(length, due));

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

{#if progress.dueCount() === 0}
  <div class="empty">
    <span class="badge"><PartyPopper /></span>
    <h1>Tout est à jour</h1>
    <p class="muted">
      Rien à réviser pour l'instant. Les pays que tu rates, et ceux dont la date de révision arrive, apparaîtront ici.
    </p>
    <Button size="lg" onclick={() => router.go('/')}>Jouer une partie</Button>
  </div>
{:else}
  <div class="stack">
    <p class="intro muted">
      Les questions ratées reviennent en premier, puis celles que tu n'as pas vues depuis un moment. Chaque bonne réponse
      repousse la prochaine révision : 1, 2, 4, 9 puis 21 jours.
    </p>

    <section>
      <h2>Compétences</h2>
      <div class="chips">
        {#each SKILL_LIST as s (s.id)}
          <Chip selected={skills.includes(s.id)} onclick={() => toggle(s.id)}>
            {s.label} <span class="num muted">{dueBySkill[s.id]}</span>
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
          { value: 0, label: 'Tout', hint: `${due}` },
        ]}
      />
    </section>

    <Button size="lg" block onclick={start} disabled={count === 0}>
      {#snippet icon()}<Play />{/snippet}
      Réviser · {count} question{count > 1 ? 's' : ''}
    </Button>
  </div>
{/if}

<style>
  .stack {
    display: grid;
    gap: 1.6rem;
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
    background: var(--green-soft);
    color: var(--green-strong);
  }
</style>
