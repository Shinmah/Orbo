<script lang="ts">
  import { BarChart3, Flag, Landmark, MapPinned, RotateCcw, Settings as SettingsIcon } from '@lucide/svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import IconButton from '../lib/ui/IconButton.svelte';
  import Card from '../lib/ui/Card.svelte';
  import { router } from '../lib/router.svelte';
  import { SKILL_LIST } from '../lib/game/skills';

  const ICONS = { capital: Landmark, flag: Flag, map: MapPinned };
</script>

<header class="head">
  <Logo />
  <div class="actions">
    <IconButton label="Statistiques" onclick={() => router.go('/stats')}><BarChart3 /></IconButton>
    <IconButton label="Réglages" onclick={() => router.go('/reglages')}><SettingsIcon /></IconButton>
  </div>
</header>

<section class="hero">
  <h1>Prêt pour une petite session&nbsp;?</h1>
  <p class="muted">Quelques minutes par jour suffisent pour faire le tour du monde.</p>
</section>

<section class="modes">
  {#each SKILL_LIST as s (s.id)}
    {@const Icon = ICONS[s.id]}
    <Card tone={s.tone} onclick={() => router.go(`/jouer/${s.slug}`)} label={s.label}>
      <div class="mode">
        <span class="icon {s.tone}"><Icon /></span>
        <span class="text">
          <span class="title">{s.label}</span>
          <span class="tagline">{s.tagline}</span>
        </span>
      </div>
    </Card>
  {/each}
</section>

<Card onclick={() => router.go('/revision')} label="Révision">
  <div class="mode">
    <span class="icon plain"><RotateCcw /></span>
    <span class="text">
      <span class="title">Révision</span>
      <span class="tagline">Les pays que tu rates le plus reviennent en priorité</span>
    </span>
  </div>
</Card>

<style>
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 60px;
  }
  .actions {
    display: flex;
    gap: 2px;
    margin-right: -6px;
  }
  .hero {
    margin: 1.5rem 0 1.75rem;
  }
  h1 {
    font-size: var(--fs-2xl);
    font-weight: 780;
    letter-spacing: -0.035em;
    margin-bottom: 0.4rem;
  }
  .modes {
    display: grid;
    gap: 12px;
    margin-bottom: 12px;
  }
  .mode {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 52px;
    height: 52px;
    border-radius: 16px;
  }
  .icon :global(svg) {
    width: 24px;
    height: 24px;
  }
  .violet {
    background: var(--violet);
    color: var(--violet-ink);
  }
  .pink {
    background: var(--pink);
    color: var(--pink-ink);
  }
  .green {
    background: var(--green);
    color: var(--green-ink);
  }
  .plain {
    background: var(--surface-2);
    color: var(--text-muted);
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .title {
    font-size: var(--fs-lg);
    font-weight: 720;
    letter-spacing: -0.02em;
  }
  .tagline {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
</style>
