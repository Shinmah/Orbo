<script lang="ts">
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { router } from './lib/router.svelte';
  import { settings } from './lib/settings.svelte';
  import Home from './screens/Home.svelte';
  import Settings from './screens/Settings.svelte';
  import DesignSystem from './screens/DesignSystem.svelte';

  const route = $derived(router.current);
  const duration = $derived(settings.reducedMotion ? 0 : 260);
</script>

<div class="stage">
  {#key route.path}
    <main class="screen" in:fly={{ y: 10, duration, easing: cubicOut, delay: duration * 0.35 }} out:fly={{ y: -6, duration: duration * 0.5 }}>
      {#if route.name === 'settings'}
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
</style>
