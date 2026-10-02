<script lang="ts">
  import Flag from '../../lib/ui/Flag.svelte';
  import type { Prompt } from '../../lib/game/types';

  interface Props {
    prompt: Prompt;
  }
  let { prompt }: Props = $props();
</script>

<div class="prompt {prompt.kind}">
  {#if prompt.kind === 'flag'}
    <div class="flag-wrap"><Flag iso2={prompt.iso2} width={260} alt="Drapeau à identifier" /></div>
  {/if}
  <h2>
    {#each prompt.parts as p, i (i)}{#if p.em}<em>{p.t}</em>{:else}{p.t}{/if}{/each}
  </h2>
</div>

<style>
  .prompt {
    display: grid;
    justify-items: center;
    gap: 1.25rem;
    text-align: center;
  }
  h2 {
    max-width: 22ch;
    font-size: clamp(1.45rem, 5.4vw, 2rem);
    font-weight: 760;
    letter-spacing: -0.03em;
    line-height: 1.2;
    text-wrap: balance;
  }
  .flag h2,
  .map h2 {
    max-width: none;
    font-size: clamp(1.15rem, 4.4vw, 1.4rem);
    font-weight: 700;
  }
  em {
    font-style: normal;
    color: var(--violet-strong);
  }
  .flag-wrap {
    width: min(260px, 70vw);
    filter: drop-shadow(0 10px 24px rgb(34 29 43 / 14%));
  }
  .flag-wrap :global(.flag) {
    width: 100% !important;
  }
</style>
