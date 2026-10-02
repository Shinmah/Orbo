<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ArrowLeft } from '@lucide/svelte';
  import IconButton from './IconButton.svelte';
  import { router } from '../router.svelte';

  interface Props {
    title?: string;
    back?: boolean | (() => void);
    right?: Snippet;
  }
  let { title, back = true, right }: Props = $props();
</script>

<header class="topbar">
  <div class="side">
    {#if back}
      <IconButton label="Retour" onclick={() => (typeof back === 'function' ? back() : router.back())}>
        <ArrowLeft />
      </IconButton>
    {/if}
  </div>
  {#if title}<h1>{title}</h1>{/if}
  <div class="side right">{@render right?.()}</div>
</header>

<style>
  .topbar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 8px;
    min-height: 56px;
    margin: 0 -6px 0.5rem;
  }
  h1 {
    font-size: var(--fs-md);
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .side {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .right {
    justify-content: flex-end;
  }
</style>
