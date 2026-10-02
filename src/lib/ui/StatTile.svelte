<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    tone?: 'violet' | 'green' | 'pink' | 'plain';
    sub?: string;
    children: Snippet;
  }
  let { label, tone = 'plain', sub, children }: Props = $props();
</script>

<div class="tile {tone}">
  <span class="value num">{@render children()}</span>
  <span class="label">{label}</span>
  {#if sub}<span class="sub">{sub}</span>{/if}
</div>

<style>
  .tile {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 1rem 1.1rem;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
  }
  .violet {
    background: var(--violet-soft);
    border-color: transparent;
  }
  .green {
    background: var(--green-soft);
    border-color: transparent;
  }
  .pink {
    background: var(--pink-soft);
    border-color: transparent;
  }
  .value {
    font-size: var(--fs-xl);
    font-weight: 750;
    letter-spacing: -0.03em;
    line-height: 1.1;
  }
  .label {
    font-size: var(--fs-sm);
    font-weight: 600;
    color: var(--text-muted);
  }
  .sub {
    font-size: var(--fs-xs);
    color: var(--text-faint);
  }
</style>
