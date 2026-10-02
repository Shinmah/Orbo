<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    label: string;
    children: Snippet;
  }
  let { label, children, class: cls = '', ...rest }: Props = $props();
</script>

<button type="button" class="icon-btn {cls}" aria-label={label} title={label} {...rest}>
  {@render children()}
</button>

<style>
  .icon-btn {
    display: inline-grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--text-muted);
    transition:
      background-color var(--dur-fast) ease,
      color var(--dur-fast) ease,
      transform var(--dur-fast) var(--ease-out);
  }
  .icon-btn:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .icon-btn:active {
    transform: scale(0.92);
  }
  .icon-btn :global(svg) {
    width: 21px;
    height: 21px;
  }
</style>
