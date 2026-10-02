<script lang="ts">
  import { ArrowRight, Check, CircleHelp, X } from '@lucide/svelte';
  import Flag from '../../lib/ui/Flag.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import type { Outcome, Question } from '../../lib/game/types';
  import { BY_ID } from '../../lib/data';
  import { withArticle } from '../../lib/data/grammar';

  interface Props {
    question: Question;
    outcome: Outcome;
    skipped: boolean;
    onnext: () => void;
    last: boolean;
  }
  let { question, outcome, skipped, onnext, last }: Props = $props();

  const tone = $derived(outcome.correct ? 'ok' : skipped ? 'neutral' : 'ko');
  const title = $derived(
    outcome.correct ? (outcome.typo ? 'Presque parfait !' : 'Bravo !') : skipped ? 'La réponse était…' : 'Raté !',
  );
  const picked = $derived(outcome.pickedId ? BY_ID.get(outcome.pickedId) : undefined);
  const showSolution = $derived(!outcome.correct || outcome.typo || question.answer.kind === 'map');
</script>

<div class="feedback {tone}" role="status" aria-live="polite">
  <span class="badge" aria-hidden="true">
    {#if tone === 'ok'}<Check strokeWidth={3} />{:else if tone === 'ko'}<X strokeWidth={3} />{:else}<CircleHelp strokeWidth={2.5} />{/if}
  </span>
  <div class="body">
    <p class="title">{title}</p>
    {#if showSolution}
      <p class="solution">
        {#if outcome.typo}On écrit :{:else if !outcome.correct && !skipped}Bonne réponse :{/if}
        {#if question.solution.iso2 && question.skill !== 'flag'}<Flag iso2={question.solution.iso2} width={22} />{/if}
        <strong>{question.solution.label}</strong>
      </p>
    {/if}
    {#if !outcome.correct && picked && question.answer.kind === 'map'}
      <p class="detail">Tu as touché {withArticle(picked)}{outcome.distanceKm ? `, à ${outcome.distanceKm.toLocaleString('fr-FR')} km` : ''}.</p>
    {/if}
    {#if question.solution.note}<p class="detail">{question.solution.note}</p>{/if}
  </div>
  <Button onclick={onnext} variant={outcome.correct ? 'primary' : 'secondary'}>
    {last ? 'Résultats' : 'Continuer'}
    {#snippet trailing()}<ArrowRight />{/snippet}
  </Button>
</div>

<style>
  .feedback {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.9rem;
    padding: 0.9rem 0.9rem 0.9rem 1rem;
    border-radius: var(--radius-lg);
    border: 1px solid transparent;
  }
  .ok {
    background: var(--green-soft);
    border-color: color-mix(in srgb, var(--green) 60%, transparent);
  }
  .ko {
    background: var(--pink-soft);
    border-color: color-mix(in srgb, var(--pink) 60%, transparent);
  }
  .neutral {
    background: var(--surface-2);
    border-color: var(--border);
  }
  .badge {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    color: var(--surface);
  }
  .ok .badge {
    background: var(--green-strong);
    animation: pop var(--dur-slow) var(--ease-spring);
  }
  .ko .badge {
    background: var(--pink-strong);
  }
  .neutral .badge {
    background: var(--text-faint);
  }
  .badge :global(svg) {
    width: 20px;
    height: 20px;
  }
  .body {
    min-width: 0;
  }
  .title {
    font-weight: 750;
  }
  .solution {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.35rem;
  }
  .detail {
    margin-top: 2px;
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  @media (max-width: 520px) {
    .feedback {
      grid-template-columns: auto 1fr;
    }
    .feedback > :global(.btn) {
      grid-column: 1 / -1;
    }
  }
</style>
