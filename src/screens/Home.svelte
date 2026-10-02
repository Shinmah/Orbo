<script lang="ts">
  import { BarChart3, Flag, Flame, Landmark, MapPinned, RotateCcw, Settings as SettingsIcon } from '@lucide/svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import IconButton from '../lib/ui/IconButton.svelte';
  import Card from '../lib/ui/Card.svelte';
  import Ring from '../lib/ui/Ring.svelte';
  import ProgressBar from '../lib/ui/ProgressBar.svelte';
  import { router } from '../lib/router.svelte';
  import { SKILL_LIST } from '../lib/game/skills';
  import { COUNTRIES } from '../lib/data';
  import { progress } from '../lib/progress.svelte';
  import { settings } from '../lib/settings.svelte';

  const ICONS = { capital: Landmark, flag: Flag, map: MapPinned };

  const today = $derived(progress.today);
  const goal = $derived(settings.value.dailyGoal);
  const goalDone = $derived(today.answered >= goal);
  const streak = $derived(progress.dayStreak);
  const due = $derived(progress.dueCount());
  const firstVisit = $derived(progress.data.totals.answered === 0);

  const greeting = $derived.by(() => {
    if (firstVisit) return 'Bienvenue sur Orbo';
    if (goalDone) return 'Objectif du jour atteint !';
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour !' : h < 18 ? 'Bon après-midi !' : 'Bonsoir !';
  });
</script>

<header class="head">
  <Logo />
  <div class="actions">
    <IconButton label="Statistiques" onclick={() => router.go('/stats')}><BarChart3 /></IconButton>
    <IconButton label="Réglages" onclick={() => router.go('/reglages')}><SettingsIcon /></IconButton>
  </div>
</header>

<section class="hero">
  <div class="hero-text">
    <h1>{greeting}</h1>
    <p class="muted">
      {#if firstVisit}
        Capitales, drapeaux et carte du monde : quelques minutes par jour suffisent.
      {:else if goalDone}
        Tu peux continuer pour consolider, ou revenir demain.
      {:else}
        Encore {goal - today.answered} question{goal - today.answered > 1 ? 's' : ''} pour ton objectif du jour.
      {/if}
    </p>
  </div>
  <div class="daily">
    <Ring value={today.answered / goal} size={76} stroke={8} tone={goalDone ? 'green' : 'violet'}>
      <span class="ring-num num">{Math.min(today.answered, 999)}<small>/{goal}</small></span>
    </Ring>
    <span class="streak" class:on={streak > 0} title="Jours consécutifs avec l'objectif atteint">
      <Flame />{streak} jour{streak > 1 ? 's' : ''}
    </span>
  </div>
</section>

<section class="modes">
  {#each SKILL_LIST as s (s.id)}
    {@const Icon = ICONS[s.id]}
    {@const learned = progress.learnedCount(s.id)}
    <Card tone={s.tone} onclick={() => router.go(`/jouer/${s.slug}`)} label={s.label}>
      <div class="mode">
        <span class="icon {s.tone}"><Icon /></span>
        <span class="text">
          <span class="title">{s.label}</span>
          <span class="tagline">{s.tagline}</span>
          <span class="meter">
            <ProgressBar value={learned / COUNTRIES.length} tone={s.tone} height={6} label="Pays connus" />
            <span class="count num">{learned}/{COUNTRIES.length}</span>
          </span>
        </span>
      </div>
    </Card>
  {/each}
</section>

<Card onclick={() => router.go('/revision')} label="Révision">
  <div class="mode">
    <span class="icon plain" class:due={due > 0}><RotateCcw /></span>
    <span class="text">
      <span class="title">Révision</span>
      <span class="tagline">
        {#if due > 0}
          <strong class="num">{due}</strong> pays à revoir, les erreurs d'abord
        {:else}
          Les pays que tu rates reviendront ici en priorité
        {/if}
      </span>
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin: 1.25rem 0 1.75rem;
  }
  h1 {
    font-size: var(--fs-2xl);
    font-weight: 780;
    letter-spacing: -0.035em;
    margin-bottom: 0.4rem;
  }
  .daily {
    display: grid;
    justify-items: center;
    gap: 6px;
  }
  .ring-num {
    font-weight: 780;
    font-size: 1.15rem;
  }
  .ring-num small {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: var(--fs-xs);
    font-weight: 700;
    color: var(--text-faint);
  }
  .streak.on {
    color: var(--pink-strong);
  }
  .streak :global(svg) {
    width: 14px;
    height: 14px;
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
  .plain.due {
    background: var(--pink-soft);
    color: var(--pink-strong);
  }
  .text {
    display: flex;
    flex: 1;
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
  .meter {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-top: 0.55rem;
  }
  .count {
    flex: none;
    font-size: var(--fs-xs);
    font-weight: 650;
    color: var(--text-muted);
  }
  @media (max-width: 400px) {
    h1 {
      font-size: var(--fs-xl);
    }
  }
</style>
