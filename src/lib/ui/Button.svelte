<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  interface Props extends HTMLButtonAttributes {
    variant?: 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    block?: boolean;
    icon?: Snippet;
    /** Icône placée après le texte (flèche « Continuer »…). */
    trailing?: Snippet;
    children: Snippet;
  }

  let { variant = 'primary', size = 'md', block = false, icon, trailing, children, class: cls = '', type = 'button', ...rest }: Props =
    $props();
</script>

<button {type} class="btn {variant} {size} {cls}" class:block {...rest}>
  {#if icon}<span class="icon" aria-hidden="true">{@render icon()}</span>{/if}
  <span>{@render children()}</span>
  {#if trailing}<span class="icon" aria-hidden="true">{@render trailing()}</span>{/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    border: 1px solid transparent;
    border-radius: var(--radius);
    font-weight: 650;
    letter-spacing: -0.005em;
    white-space: nowrap;
    transition:
      background-color var(--dur-fast) ease,
      border-color var(--dur-fast) ease,
      transform var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) ease,
      opacity var(--dur-fast) ease;
  }
  .btn:active:not(:disabled) {
    transform: scale(0.97);
  }
  .btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .block {
    width: 100%;
  }
  .sm {
    padding: 0.4rem 0.8rem;
    font-size: var(--fs-sm);
    border-radius: var(--radius-sm);
  }
  .md {
    padding: 0.7rem 1.15rem;
    font-size: var(--fs-md);
  }
  .lg {
    padding: 0.95rem 1.5rem;
    font-size: 1.0625rem;
    border-radius: var(--radius-lg);
  }
  .icon {
    display: inline-flex;
  }
  .icon :global(svg) {
    width: 1.15em;
    height: 1.15em;
  }

  .primary {
    background: var(--violet);
    color: var(--violet-ink);
    box-shadow: 0 1px 0 rgb(255 255 255 / 35%) inset, 0 6px 18px -8px color-mix(in srgb, var(--violet-strong) 60%, transparent);
  }
  .primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--violet) 88%, var(--violet-strong));
  }
  .secondary {
    background: var(--surface);
    border-color: var(--border);
    color: var(--text);
  }
  .secondary:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--violet) 60%, var(--border));
  }
  .soft {
    background: var(--violet-soft);
    color: var(--violet-strong);
  }
  .soft:hover:not(:disabled) {
    background: color-mix(in srgb, var(--violet-soft) 80%, var(--violet));
  }
  .ghost {
    background: transparent;
    color: var(--text-muted);
  }
  .ghost:hover:not(:disabled) {
    background: var(--surface-2);
    color: var(--text);
  }
  .danger {
    background: var(--pink-soft);
    color: var(--pink-strong);
  }
  .danger:hover:not(:disabled) {
    background: color-mix(in srgb, var(--pink-soft) 75%, var(--pink));
  }
</style>
