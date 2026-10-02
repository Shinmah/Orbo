<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Check, X } from '@lucide/svelte';

  export type ChoiceState = 'idle' | 'correct' | 'wrong' | 'reveal' | 'dim';

  interface Props {
    status?: ChoiceState;
    /** Raccourci clavier affiché (1 à 9). */
    hint?: number;
    disabled?: boolean;
    variant?: 'text' | 'flag';
    onclick?: () => void;
    children: Snippet;
  }
  let { status = 'idle', hint, disabled = false, variant = 'text', onclick, children }: Props = $props();
</script>

<button type="button" class="choice {status} {variant}" {disabled} {onclick} aria-keyshortcuts={hint ? String(hint) : undefined}>
  {#if hint && variant === 'text'}<kbd aria-hidden="true">{hint}</kbd>{/if}
  <span class="content">{@render children()}</span>
  {#if status === 'correct' || status === 'reveal'}
    <span class="badge ok" aria-label="Bonne réponse"><Check strokeWidth={3} /></span>
  {:else if status === 'wrong'}
    <span class="badge ko" aria-label="Mauvaise réponse"><X strokeWidth={3} /></span>
  {/if}
</button>

<style>
  .choice {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    min-height: 58px;
    padding: 0.8rem 1rem;
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--text);
    font-size: 1.0625rem;
    font-weight: 600;
    text-align: left;
    box-shadow: var(--shadow-1);
    transition:
      transform var(--dur-fast) var(--ease-out),
      border-color var(--dur-fast) ease,
      background-color var(--dur) ease,
      opacity var(--dur) ease,
      box-shadow var(--dur-fast) ease;
  }
  .choice:hover:not(:disabled) {
    border-color: var(--violet);
    transform: translateY(-1px);
  }
  .choice:active:not(:disabled) {
    transform: scale(0.98);
  }
  .choice:disabled {
    cursor: default;
  }
  .content {
    flex: 1;
    min-width: 0;
  }
  kbd {
    display: grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: var(--surface-2);
    color: var(--text-faint);
    font: 600 var(--fs-xs) / 1 var(--font);
  }

  /* Variante drapeau : grande vignette centrée */
  .flag {
    justify-content: center;
    padding: 10px;
    min-height: 0;
  }
  .flag .content {
    display: flex;
    justify-content: center;
    flex: initial;
    width: 100%;
  }

  .correct {
    background: var(--green);
    border-color: var(--green);
    color: var(--green-ink);
    animation: pop var(--dur-slow) var(--ease-spring);
  }
  .reveal {
    background: var(--green-soft);
    border-color: var(--green);
    color: var(--text);
  }
  .wrong {
    background: var(--pink);
    border-color: var(--pink);
    color: var(--pink-ink);
    animation: shake 380ms ease;
  }
  .correct kbd,
  .wrong kbd {
    background: rgb(255 255 255 / 40%);
    color: inherit;
  }
  .dim {
    opacity: 0.42;
    box-shadow: none;
  }

  .badge {
    display: grid;
    place-items: center;
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
  }
  .flag .badge {
    position: absolute;
    top: -9px;
    right: -9px;
    box-shadow: var(--shadow-1);
  }
  .badge :global(svg) {
    width: 15px;
    height: 15px;
  }
  .ok {
    background: var(--green-strong);
    color: var(--surface);
  }
  .ko {
    background: var(--pink-strong);
    color: var(--surface);
  }
</style>
