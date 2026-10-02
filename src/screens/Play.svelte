<script lang="ts">
  import Game from './play/Game.svelte';
  import { current } from '../lib/game/current.svelte';
  import { router } from '../lib/router.svelte';

  $effect(() => {
    if (!current.config) router.go('/', { replace: true });
  });
</script>

{#if current.config}
  {#key current.run}
    <Game config={current.config} />
  {/key}
{/if}
