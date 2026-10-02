<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    selected?: boolean;
    onclick?: () => void;
    children: Snippet;
  }
  let { selected = false, onclick, children }: Props = $props();
</script>

<button type="button" class="chip" class:selected aria-pressed={selected} {onclick}>
  {@render children()}
</button>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-weight: 600;
    transition:
      background-color var(--dur-fast) ease,
      border-color var(--dur-fast) ease,
      color var(--dur-fast) ease,
      transform var(--dur-fast) var(--ease-out);
  }
  .chip:hover {
    color: var(--text);
    border-color: color-mix(in srgb, var(--violet) 50%, var(--border));
  }
  .chip:active {
    transform: scale(0.96);
  }
  .selected {
    background: var(--violet-soft);
    border-color: color-mix(in srgb, var(--violet) 70%, transparent);
    color: var(--violet-strong);
  }
</style>
