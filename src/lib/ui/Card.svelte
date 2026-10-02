<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children: Snippet;
    onclick?: () => void;
    tone?: 'plain' | 'violet' | 'green' | 'pink';
    padding?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    label?: string;
    class?: string;
  }
  let { children, onclick, tone = 'plain', padding = 'md', disabled = false, label, class: cls = '' }: Props = $props();
</script>

{#if onclick}
  <button type="button" class="card {tone} pad-{padding} interactive {cls}" {onclick} {disabled} aria-label={label}>
    {@render children()}
  </button>
{:else}
  <div class="card {tone} pad-{padding} {cls}">
    {@render children()}
  </div>
{/if}

<style>
  .card {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-1);
    color: var(--text);
  }
  .pad-sm {
    padding: 0.85rem 1rem;
  }
  .pad-md {
    padding: 1.15rem 1.25rem;
  }
  .pad-lg {
    padding: 1.5rem 1.6rem;
  }
  .violet {
    background: linear-gradient(160deg, var(--violet-soft), var(--surface) 75%);
  }
  .green {
    background: linear-gradient(160deg, var(--green-soft), var(--surface) 75%);
  }
  .pink {
    background: linear-gradient(160deg, var(--pink-soft), var(--surface) 75%);
  }
  .interactive {
    transition:
      transform var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out),
      border-color var(--dur-fast) ease;
  }
  .interactive:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2);
    border-color: color-mix(in srgb, var(--violet) 45%, var(--border));
  }
  .interactive:active:not(:disabled) {
    transform: translateY(0) scale(0.99);
  }
  .interactive:disabled {
    cursor: default;
    opacity: 0.6;
  }
</style>
