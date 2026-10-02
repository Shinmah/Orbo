<script lang="ts">
  import { ArrowRight } from '@lucide/svelte';

  export type TextAnswerState = 'idle' | 'correct' | 'typo' | 'wrong';

  interface Props {
    value: string;
    status?: TextAnswerState;
    placeholder?: string;
    disabled?: boolean;
    onsubmit: (value: string) => void;
  }
  let { value = $bindable(), status = 'idle', placeholder = 'Ta réponse…', disabled = false, onsubmit }: Props = $props();

  let input: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (!disabled) input?.focus({ preventScroll: true });
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!disabled && value.trim()) onsubmit(value);
  }
</script>

<form class="answer {status}" onsubmit={submit}>
  <input
    bind:this={input}
    bind:value
    {placeholder}
    {disabled}
    aria-label="Ta réponse"
    autocomplete="off"
    autocapitalize="off"
    spellcheck="false"
    enterkeyhint="done"
  />
  <button type="submit" disabled={disabled || !value.trim()} aria-label="Valider">
    <ArrowRight strokeWidth={2.5} />
  </button>
</form>

<style>
  .answer {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 6px 6px 1.1rem;
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--surface);
    box-shadow: var(--shadow-1);
    transition:
      border-color var(--dur-fast) ease,
      background-color var(--dur) ease,
      box-shadow var(--dur-fast) ease;
  }
  .answer:focus-within {
    border-color: var(--violet);
    box-shadow: var(--ring);
  }
  input {
    flex: 1;
    min-width: 0;
    padding: 0.7rem 0;
    border: 0;
    outline: 0;
    background: transparent;
    font-size: 1.125rem;
    font-weight: 600;
  }
  input::placeholder {
    color: var(--text-faint);
    font-weight: 500;
  }
  input:focus-visible {
    box-shadow: none;
  }
  button {
    display: grid;
    place-items: center;
    flex: none;
    width: 46px;
    height: 46px;
    border: 0;
    border-radius: var(--radius);
    background: var(--violet);
    color: var(--violet-ink);
    transition:
      opacity var(--dur-fast) ease,
      transform var(--dur-fast) var(--ease-out);
  }
  button:disabled {
    opacity: 0.35;
    cursor: default;
  }
  button:active:not(:disabled) {
    transform: scale(0.94);
  }
  button :global(svg) {
    width: 20px;
    height: 20px;
  }

  .correct,
  .typo {
    border-color: var(--green);
    background: var(--green-soft);
    animation: pop var(--dur-slow) var(--ease-spring);
  }
  .wrong {
    border-color: var(--pink);
    background: var(--pink-soft);
    animation: shake 380ms ease;
  }
  .correct button,
  .typo button {
    background: var(--green);
    color: var(--green-ink);
  }
  .wrong button {
    background: var(--pink);
    color: var(--pink-ink);
  }
</style>
