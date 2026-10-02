<script lang="ts" generics="T extends string | number">
  interface Option {
    value: T;
    label: string;
    hint?: string;
  }
  interface Props {
    options: Option[];
    value: T;
    label: string;
    onchange?: (value: T) => void;
  }
  let { options, value = $bindable(), label, onchange }: Props = $props();

  const index = $derived(Math.max(0, options.findIndex((o) => o.value === value)));

  function select(v: T) {
    value = v;
    onchange?.(v);
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = (index + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length;
    select(options[next].value);
    (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role=radio]')[next]?.focus();
  }
</script>

<div class="seg" role="radiogroup" aria-label={label} style:--n={options.length} style:--i={index} tabindex="-1" {onkeydown}>
  <span class="thumb" aria-hidden="true"></span>
  {#each options as o (o.value)}
    <button
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={o.value === value ? 0 : -1}
      class:active={o.value === value}
      onclick={() => select(o.value)}
    >
      <span class="label">{o.label}</span>
      {#if o.hint}<span class="hint num">{o.hint}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .seg {
    position: relative;
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    padding: 4px;
    border-radius: var(--radius);
    background: var(--surface-2);
    isolation: isolate;
  }
  .thumb {
    position: absolute;
    z-index: -1;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc((100% - 8px) / var(--n));
    border-radius: calc(var(--radius) - 4px);
    background: var(--surface);
    box-shadow: var(--shadow-1);
    transform: translateX(calc(100% * var(--i)));
    transition: transform var(--dur) var(--ease-out);
  }
  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    min-width: 0;
    padding: 0.55rem 0.4rem;
    border: 0;
    background: transparent;
    border-radius: calc(var(--radius) - 4px);
    color: var(--text-muted);
    font-size: var(--fs-sm);
    font-weight: 600;
    transition: color var(--dur-fast) ease;
  }
  button:hover,
  .active {
    color: var(--text);
  }
  .label {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    font-size: var(--fs-xs);
    font-weight: 500;
    color: var(--text-faint);
  }
</style>
