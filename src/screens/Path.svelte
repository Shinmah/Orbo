<script lang="ts">
  import PathGame from './path/PathGame.svelte';
  import { currentPath } from '../lib/game/pathSession.svelte';
  import { router } from '../lib/router.svelte';

  $effect(() => {
    if (!currentPath.config) router.go('/jouer/chemin', { replace: true });
  });
</script>

{#if currentPath.config}
  {#key currentPath.run}
    <PathGame config={currentPath.config} />
  {/key}
{/if}
