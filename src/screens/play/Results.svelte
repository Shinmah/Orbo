<script lang="ts">
  import { Home, RotateCcw, Target } from '@lucide/svelte';
  import Ring from '../../lib/ui/Ring.svelte';
  import StatTile from '../../lib/ui/StatTile.svelte';
  import AnimatedNumber from '../../lib/ui/AnimatedNumber.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import Flag from '../../lib/ui/Flag.svelte';
  import { country } from '../../lib/data';
  import type { Outcome, Question } from '../../lib/game/types';

  interface Props {
    results: { q: Question; o: Outcome }[];
    score: number;
    bestStreak: number;
    onreplay: () => void;
    onretry: (ids: string[]) => void;
    onhome: () => void;
  }
  let { results, score, bestStreak, onreplay, onretry, onhome }: Props = $props();

  const correct = $derived(results.filter((r) => r.o.correct).length);
  const ratio = $derived(results.length ? correct / results.length : 0);
  const missed = $derived(results.filter((r) => !r.o.correct));
  const title = $derived(
    ratio >= 0.9 ? 'Impressionnant !' : ratio >= 0.7 ? 'Très bien !' : ratio >= 0.5 ? 'Pas mal du tout' : 'Ça va venir !',
  );
</script>

<div class="results">
  <div class="hero">
    <Ring value={ratio} size={132} stroke={11} tone={ratio >= 0.5 ? 'green' : 'pink'}>
      <span class="pct num"><AnimatedNumber value={Math.round(ratio * 100)} duration={900} /> %</span>
    </Ring>
    <h1>{title}</h1>
    <p class="muted num">{correct} bonne{correct > 1 ? 's' : ''} réponse{correct > 1 ? 's' : ''} sur {results.length}</p>
  </div>

  <div class="tiles">
    <StatTile label="Points" tone="violet"><AnimatedNumber value={score} duration={1000} /></StatTile>
    <StatTile label="Meilleure série" tone="pink">{bestStreak}</StatTile>
  </div>

  {#if missed.length}
    <section>
      <h2>À revoir</h2>
      <ul>
        {#each missed as { q } (q.key)}
          {@const c = country(q.countryId)}
          <li>
            <Flag iso2={c.iso2} width={32} />
            <span class="name">{c.name}</span>
            {#if q.skill === 'capital'}<span class="answer">{c.capital}</span>{/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="actions">
    {#if missed.length}
      <Button size="lg" block onclick={() => onretry(missed.map((m) => m.q.countryId))}>
        {#snippet icon()}<Target />{/snippet}
        Revoir mes erreurs
      </Button>
    {/if}
    <Button size="lg" block variant={missed.length ? 'secondary' : 'primary'} onclick={onreplay}>
      {#snippet icon()}<RotateCcw />{/snippet}
      Rejouer
    </Button>
    <Button variant="ghost" block onclick={onhome}>
      {#snippet icon()}<Home />{/snippet}
      Accueil
    </Button>
  </div>
</div>

<style>
  .results {
    display: grid;
    gap: 1.5rem;
    padding-top: 1rem;
  }
  .hero {
    display: grid;
    justify-items: center;
    gap: 0.4rem;
    text-align: center;
  }
  .pct {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.03em;
  }
  h1 {
    margin-top: 0.75rem;
    font-size: var(--fs-2xl);
    font-weight: 800;
  }
  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  h2 {
    margin: 0 0 0.6rem 0.2rem;
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  ul {
    display: grid;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.8rem;
    border-radius: var(--radius);
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .name {
    flex: 1;
    font-weight: 650;
  }
  .answer {
    color: var(--text-muted);
    font-weight: 600;
  }
  .actions {
    display: grid;
    gap: 8px;
  }
</style>
