<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { Flame, X } from '@lucide/svelte';
  import IconButton from '../../lib/ui/IconButton.svelte';
  import ProgressBar from '../../lib/ui/ProgressBar.svelte';
  import AnimatedNumber from '../../lib/ui/AnimatedNumber.svelte';
  import ChoiceButton, { type ChoiceState } from '../../lib/ui/ChoiceButton.svelte';
  import TextAnswer, { type TextAnswerState } from '../../lib/ui/TextAnswer.svelte';
  import Flag from '../../lib/ui/Flag.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import WorldMap, { type MapMark } from '../../lib/map/WorldMap.svelte';
  import PromptView from './PromptView.svelte';
  import Feedback from './Feedback.svelte';
  import Results from './Results.svelte';
  import { COUNTRIES } from '../../lib/data';
  import { createRng } from '../../lib/game/random';
  import { buildQuestions, planSession, poolFor } from '../../lib/game/selection';
  import { evaluate, pointsFor } from '../../lib/game/evaluate';
  import type { SessionConfig } from '../../lib/game/config';
  import type { Outcome, Question, Response } from '../../lib/game/types';
  import { current } from '../../lib/game/current.svelte';
  import { progress } from '../../lib/progress.svelte';
  import { settings } from '../../lib/settings.svelte';
  import { router } from '../../lib/router.svelte';

  interface Props {
    config: SessionConfig;
  }
  let { config: initial }: Props = $props();
  const config = untrack(() => initial);

  // --- Préparation de la partie (une fois) ---
  const rng = createRng(config.seed);
  const plan = planSession(config, COUNTRIES, $state.snapshot(progress.data.cards), Date.now(), rng);
  const questions: Question[] = buildQuestions(plan, config, COUNTRIES, rng);
  const pool = poolFor(config, COUNTRIES);
  const regionFrame = config.continents.length && !config.only ? { ids: pool.map((c) => c.id), padding: 1.1, maxZoom: 6 } : null;

  // --- État ---
  let index = $state(0);
  let phase = $state<'answer' | 'feedback' | 'done'>(questions.length ? 'answer' : 'done');
  let response = $state<Response | null>(null);
  let outcome = $state<Outcome | null>(null);
  let score = $state(0);
  let streak = $state(0);
  let bestStreak = $state(0);
  let gain = $state({ n: 0, key: 0 });
  let typed = $state('');
  let results = $state<{ q: Question; o: Outcome }[]>([]);
  let timer: ReturnType<typeof setTimeout> | undefined;

  const q = $derived(questions[index]);
  const total = questions.length;
  const dur = $derived(settings.reducedMotion ? 0 : 280);

  function answer(r: Response) {
    if (phase !== 'answer') return;
    const o = evaluate(q, r);
    response = r;
    outcome = o;
    streak = o.correct ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
    const pts = pointsFor(q, o, streak - 1);
    score += pts;
    if (pts) gain = { n: pts, key: gain.key + 1 };
    progress.record(q, o);
    results.push({ q, o });
    phase = 'feedback';
    if (o.correct && !o.typo && q.answer.kind !== 'map') timer = setTimeout(next, 1100);
  }

  function next() {
    clearTimeout(timer);
    if (phase !== 'feedback') return;
    if (index + 1 >= total) {
      progress.endSession(bestStreak, score);
      phase = 'done';
      return;
    }
    index++;
    phase = 'answer';
    response = null;
    outcome = null;
    typed = '';
  }

  onDestroy(() => clearTimeout(timer));

  // --- États visuels ---
  function choiceState(id: string): ChoiceState {
    if (phase === 'answer' || q.answer.kind !== 'choice') return 'idle';
    const chosen = response?.kind === 'choice' ? response.choiceId : null;
    if (id === q.answer.correctId) return chosen === id ? 'correct' : 'reveal';
    if (id === chosen) return 'wrong';
    return 'dim';
  }

  const inputState = $derived<TextAnswerState>(
    phase === 'answer' || !outcome ? 'idle' : outcome.correct ? (outcome.typo ? 'typo' : 'correct') : 'wrong',
  );

  const mapMarks = $derived.by<Record<string, MapMark>>(() => {
    if (q?.prompt.kind !== 'map') return {};
    const target = q.countryId;
    if (phase === 'answer') return q.prompt.highlight ? { [target]: 'target' } : {};
    if (outcome?.correct) return { [target]: 'correct' };
    const picked = outcome?.pickedId;
    return picked ? { [target]: 'reveal', [picked]: 'wrong' } : { [target]: 'reveal' };
  });

  const mapFrame = $derived.by(() => {
    if (q?.prompt.kind !== 'map') return null;
    if (phase === 'answer') {
      return q.prompt.highlight ? { ids: [q.countryId], padding: 4, maxZoom: 9 } : regionFrame;
    }
    const ids = outcome?.pickedId && outcome.pickedId !== q.countryId ? [q.countryId, outcome.pickedId] : [q.countryId];
    return { ids, padding: 2.6, maxZoom: 8 };
  });

  // --- Clavier : 1-9 pour choisir, Entrée pour continuer ---
  function onkeydown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (phase === 'feedback' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      next();
      return;
    }
    if (phase === 'answer' && q.answer.kind === 'choice' && /^[1-9]$/.test(e.key)) {
      const choice = q.answer.choices[Number(e.key) - 1];
      if (choice) answer({ kind: 'choice', choiceId: choice.id });
    }
  }

  function quit() {
    clearTimeout(timer);
    router.go('/');
  }
</script>

<svelte:window {onkeydown} />

{#if phase === 'done'}
  {#if total === 0}
    <div class="empty">
      <h1>Rien à revoir pour l'instant</h1>
      <p class="muted">Aucun pays à réviser dans cette sélection. Joue une partie pour en ajouter.</p>
      <Button size="lg" onclick={() => router.go('/')}>Retour à l'accueil</Button>
    </div>
  {:else}
    <div class="narrow">
      <Results
        {results}
        {score}
        {bestStreak}
        onreplay={() => current.start({ ...config, seed: undefined })}
        onretry={(ids) => current.start({ ...config, only: ids, length: 0, review: false, continents: [], seed: undefined })}
        onhome={() => router.go('/')}
      />
    </div>
  {/if}
{:else}
  <div class="game" class:map={q.prompt.kind === 'map'}>
    <header class="hud">
      <IconButton label="Quitter la partie" onclick={quit}><X /></IconButton>
      <div class="progress">
        <ProgressBar value={(index + (phase === 'feedback' ? 1 : 0)) / total} label="Progression de la partie" />
      </div>
      <div class="counters">
        {#if streak >= 2}
          {#key streak}
            <span class="streak" in:fly={{ y: 6, duration: dur }} title="Série de bonnes réponses"><Flame />{streak}</span>
          {/key}
        {/if}
        <span class="score" title="Points">
          <AnimatedNumber value={score} />
          {#key gain.key}
            {#if gain.key > 0}<span class="gain num" aria-hidden="true">+{gain.n}</span>{/if}
          {/key}
        </span>
      </div>
    </header>

    {#key index}
      <section class="question" in:fly={{ x: 28, duration: dur * 1.2, easing: cubicOut }}>
        {#if q.prompt.kind === 'map'}
          <div class="map-prompt">
            <PromptView prompt={q.prompt} />
          </div>
          <div class="map-box">
            <WorldMap
              interactive={phase === 'answer' && q.answer.kind === 'map'}
              onpick={(id) => answer({ kind: 'map', countryId: id })}
              marks={mapMarks}
              frame={mapFrame}
              label={q.answer.kind === 'map' ? 'Carte : touche le pays demandé' : 'Carte : pays mis en évidence'}
            />
          </div>
        {:else}
          <div class="prompt-box">
            <PromptView prompt={q.prompt} />
          </div>
        {/if}

        <div class="answers">
          {#if q.answer.kind === 'choice'}
            <div class="choices {q.answer.display}" class:six={q.answer.choices.length > 4}>
              {#each q.answer.choices as c, i (c.id)}
                <ChoiceButton
                  status={choiceState(c.id)}
                  hint={i + 1}
                  variant={q.answer.display}
                  disabled={phase !== 'answer'}
                  onclick={() => answer({ kind: 'choice', choiceId: c.id })}
                >
                  {#if q.answer.display === 'flag'}
                    <Flag iso2={c.iso2!} width={120} alt={phase === 'answer' ? `Drapeau ${i + 1}` : c.label} />
                  {:else}
                    {c.label}
                  {/if}
                </ChoiceButton>
              {/each}
            </div>
          {:else if q.answer.kind === 'input'}
            <TextAnswer
              bind:value={typed}
              status={inputState}
              placeholder={q.answer.placeholder}
              disabled={phase !== 'answer'}
              onsubmit={(text) => answer({ kind: 'input', text })}
            />
          {:else if phase === 'answer'}
            <p class="hint muted">Touche le pays sur la carte. Molette, pincement ou double-clic pour zoomer.</p>
          {/if}

          {#if phase === 'answer' && q.answer.kind !== 'choice'}
            <div class="skip">
              <Button variant="ghost" size="sm" onclick={() => answer({ kind: 'skip' })}>Je ne sais pas</Button>
            </div>
          {/if}
        </div>
      </section>
    {/key}

    {#if phase === 'feedback' && outcome}
      <div class="feedback-slot" in:fly={{ y: 16, duration: dur, easing: cubicOut }}>
        <Feedback question={q} {outcome} skipped={response?.kind === 'skip'} onnext={next} last={index + 1 >= total} />
      </div>
    {/if}
  </div>
{/if}

<style>
  .narrow,
  .game:not(.map) {
    max-width: var(--content);
    margin: 0 auto;
  }
  .game {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-height: calc(100dvh - 48px);
  }
  .hud {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    margin-left: -6px;
  }
  .counters {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 0.3rem 0.6rem 0.3rem 0.45rem;
    border-radius: 999px;
    background: var(--pink-soft);
    color: var(--pink-strong);
    font-weight: 750;
    font-size: var(--fs-sm);
    font-variant-numeric: tabular-nums;
  }
  .streak :global(svg) {
    width: 16px;
    height: 16px;
  }
  .score {
    position: relative;
    min-width: 3.2rem;
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--violet-soft);
    color: var(--violet-strong);
    font-weight: 750;
    font-size: var(--fs-sm);
    text-align: center;
  }
  .gain {
    position: absolute;
    left: 50%;
    top: -4px;
    translate: -50% 0;
    color: var(--green-strong);
    font-weight: 800;
    pointer-events: none;
    animation: rise 1s var(--ease-out) forwards;
  }
  .question {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .prompt-box {
    display: grid;
    place-items: center;
    min-height: 26vh;
    padding: 1rem 0;
  }
  .map-prompt {
    margin-top: -0.25rem;
  }
  .map-box {
    height: min(56vh, 560px);
  }
  .map-box :global(.map) {
    height: 100%;
  }
  .answers {
    display: grid;
    gap: 0.75rem;
  }
  .map .answers {
    width: 100%;
    max-width: var(--content);
    margin: 0 auto;
  }
  .choices {
    display: grid;
    gap: 10px;
  }
  .choices.flag,
  .map .choices.text {
    grid-template-columns: 1fr 1fr;
  }
  @media (min-width: 560px) {
    .choices.text {
      grid-template-columns: 1fr 1fr;
    }
    .choices.flag.six {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .hint {
    text-align: center;
    font-size: var(--fs-sm);
  }
  .skip {
    display: flex;
    justify-content: center;
  }
  .feedback-slot {
    position: sticky;
    bottom: max(12px, env(safe-area-inset-bottom));
    z-index: 2;
    width: 100%;
    max-width: var(--content);
    margin: auto auto 0;
    box-shadow: var(--shadow-2);
    border-radius: var(--radius-lg);
    background: var(--bg);
  }
  .empty {
    display: grid;
    justify-items: center;
    gap: 1rem;
    padding-top: 20vh;
    text-align: center;
  }
  .empty h1 {
    font-size: var(--fs-xl);
  }
</style>
