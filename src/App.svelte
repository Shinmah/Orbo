<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { router } from './lib/router.svelte';
  import { settings } from './lib/settings.svelte';
  import Home from './screens/Home.svelte';
  import Settings from './screens/Settings.svelte';
  import DesignSystem from './screens/DesignSystem.svelte';
  import Setup from './screens/Setup.svelte';
  import Play from './screens/Play.svelte';
  import Review from './screens/Review.svelte';
  import Stats from './screens/Stats.svelte';
  import { skillFromSlug } from './lib/game/skills';

  const route = $derived(router.current);
  const duration = $derived(settings.reducedMotion ? 0 : 260);
  const setupSkill = $derived(route.name === 'setup' ? skillFromSlug(route.params.skill) : undefined);
  const wide = $derived(route.name === 'play' || route.name === 'stats');
</script>

<div class="stage">
  {#key route.path}
    <main class="screen" class:wide in:fly={{ y: 10, duration, easing: cubicOut, delay: duration * 0.35 }} out:fly={{ y: -6, duration: duration * 0.5 }}>
      {#if route.name === 'setup' && setupSkill}
        <Setup skill={setupSkill} />
      {:else if route.name === 'play'}
        <Play />
      {:else if route.name === 'review'}
        <Review />
      {:else if route.name === 'stats'}
        <Stats />
      {:else if route.name === 'settings'}
        <Settings />
      {:else if route.name === 'design'}
        <DesignSystem />
      {:else}
        <Home />
      {/if}
    </main>
  {/key}
</div>

<style>
  /* Les écrans entrant et sortant se superposent dans la même cellule : pas de saut de mise en page. */
  .stage {
    display: grid;
    min-height: 100dvh;
  }
  .screen {
    grid-area: 1 / 1;
    width: 100%;
    max-width: var(--content);
    margin: 0 auto;
    padding: max(8px, env(safe-area-inset-top)) var(--gutter) calc(32px + env(safe-area-inset-bottom));
  }
  .wide {
    max-width: 1080px;
  }
</style>
