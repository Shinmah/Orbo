<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    value: number;
    size?: number;
    stroke?: number;
    tone?: 'violet' | 'green' | 'pink';
    children?: Snippet;
  }
  let { value, size = 64, stroke = 7, tone = 'green', children }: Props = $props();
  const r = $derived((size - stroke) / 2);
  const c = $derived(2 * Math.PI * r);
  const v = $derived(Math.max(0, Math.min(1, value)));
</script>

<span class="ring" style:width="{size}px" style:height="{size}px">
  <svg width={size} height={size} viewBox="0 0 {size} {size}" aria-hidden="true">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke="var(--surface-3)" stroke-width={stroke} />
    <circle
      class="arc"
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke="var(--{tone})"
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={c}
      stroke-dashoffset={c * (1 - v)}
      transform="rotate(-90 {size / 2} {size / 2})"
    />
  </svg>
  {#if children}<span class="inner">{@render children()}</span>{/if}
</span>

<style>
  .ring {
    position: relative;
    display: inline-grid;
    place-items: center;
    flex: none;
  }
  svg {
    position: absolute;
    inset: 0;
  }
  .arc {
    transition: stroke-dashoffset 900ms var(--ease-out);
  }
  .inner {
    position: relative;
    display: grid;
    place-items: center;
  }
</style>
