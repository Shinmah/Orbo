<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { ArrowRight, Flag as FlagIcon, Home, Lightbulb, RotateCcw, X } from '@lucide/svelte';
  import IconButton from '../../lib/ui/IconButton.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import Flag from '../../lib/ui/Flag.svelte';
  import TextAnswer, { type TextAnswerState } from '../../lib/ui/TextAnswer.svelte';
  import AnimatedNumber from '../../lib/ui/AnimatedNumber.svelte';
  import WorldMap, { type MapLabel, type MapMark } from '../../lib/map/WorldMap.svelte';
  import { BY_ID, country } from '../../lib/data';
  import { capitalOfPhrase, withArticle } from '../../lib/data/grammar';
  import { createRng } from '../../lib/game/random';
  import {
    findCountry,
    generatePuzzle,
    guessQuality,
    nextHint,
    pathScore,
    shortestPath,
    solvedPath,
    type GuessQuality,
  } from '../../lib/game/path';
  import { currentPath, type PathConfig } from '../../lib/game/pathSession.svelte';
  import { progress } from '../../lib/progress.svelte';
  import { settings } from '../../lib/settings.svelte';
  import { sound } from '../../lib/sound';
  import { router } from '../../lib/router.svelte';

  interface Props {
    config: PathConfig;
  }
  let { config: initial }: Props = $props();
  const config = untrack(() => initial);

  const puzzle = generatePuzzle(config, createRng(config.seed));
  const start = country(puzzle.start);
  const end = country(puzzle.end);
  const forbidden = puzzle.forbidden ? country(puzzle.forbidden) : undefined;

  let guesses = $state<{ id: string; quality: GuessQuality }[]>([]);
  let typed = $state('');
  let inputState = $state<TextAnswerState>('idle');
  let message = $state<{ text: string; tone: 'ok' | 'ko' | 'info' } | null>(null);
  let hintId = $state<string | null>(null);
  let hintLevel = $state(0);
  let hints = $state(0);
  let outcome = $state<'playing' | 'won' | 'lost'>('playing');
  let finalPath = $state<string[]>([]);
  let points = $state(0);
  /** Chemin le plus court (affiché en fin de partie si le joueur a fait un détour). */
  const optimalPath = shortestPath(puzzle.start, puzzle.end, new Set(puzzle.forbidden ? [puzzle.forbidden] : []))!;

  const guessedIds = $derived(new Set(guesses.map((g) => g.id)));
  const remaining = $derived(puzzle.maxGuesses - guesses.length);
  const dur = $derived(settings.reducedMotion ? 0 : 280);

  const QUALITY_FILL: Record<GuessQuality, string> = {
    optimal: 'var(--green)',
    close: 'var(--violet)',
    far: 'var(--pink)',
  };
  const QUALITY_LABEL: Record<GuessQuality, string> = {
    optimal: 'sur un chemin le plus court',
    close: 'petit détour',
    far: 'loin du chemin',
  };

  const fills = $derived(Object.fromEntries(guesses.map((g) => [g.id, QUALITY_FILL[g.quality]])) as Record<string, string>);

  const marks = $derived.by<Record<string, MapMark>>(() => {
    const m: Record<string, MapMark> = { [start.id]: 'endpoint', [end.id]: 'endpoint' };
    if (forbidden) m[forbidden.id] = 'forbidden';
    if (outcome !== 'playing') for (const id of finalPath.slice(1, -1)) m[id] = 'correct';
    else if (hintId) m[hintId] = 'hint';
    return m;
  });

  const labels = $derived<MapLabel[]>([
    { id: start.id, text: start.name, tone: 'strong' },
    { id: end.id, text: end.name, tone: 'strong' },
    ...(forbidden ? [{ id: forbidden.id, text: `${forbidden.name} · interdit`, tone: 'warn' as const }] : []),
    ...guesses.map((g) => ({ id: g.id, text: country(g.id).name, tone: 'soft' as const })),
  ]);

  const frame = $derived(
    outcome === 'playing'
      ? { ids: [start.id, end.id, ...(forbidden ? [forbidden.id] : [])], padding: 1.9, maxZoom: 8 }
      : { ids: finalPath, padding: 1.5, maxZoom: 8 },
  );

  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  function flash(state: TextAnswerState, text: string, tone: 'ok' | 'ko' | 'info') {
    clearTimeout(flashTimer);
    inputState = state;
    message = { text, tone };
    flashTimer = setTimeout(() => (inputState = 'idle'), 650);
  }

  function submit(text: string) {
    if (outcome !== 'playing') return;
    const c = findCountry(text);
    if (!c) {
      sound.nope();
      return flash('wrong', `« ${text.trim()} » : pays inconnu. Vérifie l'orthographe.`, 'ko');
    }
    if (c.id === start.id || c.id === end.id) {
      sound.nope();
      return flash('wrong', `${c.name} est ${c.id === start.id ? 'le point de départ' : "le point d'arrivée"}.`, 'info');
    }
    if (forbidden && c.id === forbidden.id) {
      sound.nope();
      return flash('wrong', `Interdit de passer par ${withArticle(c)} !`, 'ko');
    }
    if (guessedIds.has(c.id)) {
      sound.nope();
      return flash('wrong', `${c.name} est déjà sur ta carte.`, 'info');
    }

    const quality = guessQuality(puzzle, c.id);
    guesses.push({ id: c.id, quality });
    typed = '';
    if (hintId === c.id) {
      hintId = null;
      hintLevel = 0;
    }
    progress.recordPathGuess(quality === 'optimal');
    sound.pop(quality === 'optimal' ? 1.25 : quality === 'close' ? 1 : 0.8);
    flash(
      quality === 'optimal' ? 'correct' : 'idle',
      `${c.name} : ${QUALITY_LABEL[quality]}${c.neighbors.length === 0 ? ' (une île, sans frontière terrestre)' : ''}.`,
      quality === 'optimal' ? 'ok' : 'info',
    );

    const path = solvedPath(puzzle, guessedIds.has(c.id) ? guessedIds : new Set([...guessedIds, c.id]));
    if (path) return finish(true, path);
    if (guesses.length >= puzzle.maxGuesses) finish(false);
  }

  function hint() {
    if (outcome !== 'playing') return;
    const next = nextHint(puzzle, guessedIds);
    if (!next) return;
    if (hintId === next && hintLevel === 1) {
      hintLevel = 2;
      hints++;
      message = { text: `Le pays entouré commence par « ${country(next).name[0]} ».`, tone: 'info' };
    } else if (hintId !== next) {
      hintId = next;
      hintLevel = 1;
      hints++;
      message = { text: 'Le pays entouré en pointillés te rapproche de l’arrivée.', tone: 'info' };
    }
  }

  function finish(won: boolean, path?: string[]) {
    outcome = won ? 'won' : 'lost';
    finalPath = path ?? optimalPath;
    points = won ? pathScore(puzzle, guesses.length, hints) : 0;
    const perfect = won && guesses.length === puzzle.minSteps && hints === 0;
    progress.endPath(won, perfect, points);
    message = null;
    if (won) setTimeout(() => sound.complete(), 150);
    else sound.wrong();
  }

  function giveUp() {
    if (outcome === 'playing') finish(false);
  }

  function again() {
    currentPath.start({ ...config, seed: undefined });
  }

  const perfect = $derived(outcome === 'won' && guesses.length === puzzle.minSteps && hints === 0);
</script>

<div class="pg">
  <header class="hud">
    <IconButton label="Quitter" onclick={() => router.go('/')}><X /></IconButton>
    <div class="dots" aria-label="{guesses.length} essais sur {puzzle.maxGuesses}">
      {#each Array(puzzle.maxGuesses) as _, i (i)}
        <span class="dot {guesses[i]?.quality ?? ''}" class:spare={i >= puzzle.minSteps}></span>
      {/each}
    </div>
    <span class="count num">{Math.max(remaining, 0)} essai{remaining > 1 ? 's' : ''}</span>
  </header>

  <div class="map-box">
    <div class="brief">
      <p class="route">
        <Flag iso2={start.iso2} width={22} /> <strong>{start.name}</strong>
        <ArrowRight class="arrow" />
        <Flag iso2={end.iso2} width={22} /> <strong>{end.name}</strong>
      </p>
      <p class="meta">
        Au moins {puzzle.minSteps} pays à traverser
        {#if forbidden}<span class="forbid">· sans passer par {withArticle(forbidden)}</span>{/if}
      </p>
    </div>
    <WorldMap {fills} {marks} {labels} {frame} label="Carte du chemin de {start.name} à {end.name}" />

    {#if outcome !== 'playing'}
      <div class="end {outcome}" in:fly={{ y: 16, duration: dur, easing: cubicOut }} role="status">
        <div class="end-head">
          <div>
            <p class="end-title">
              {#if outcome === 'won'}{perfect ? 'Chemin parfait !' : 'Chemin trouvé !'}{:else}Pas cette fois…{/if}
            </p>
            <p class="muted small">
              {#if outcome === 'won'}
                {guesses.length} pays proposé{guesses.length > 1 ? 's' : ''} pour {puzzle.minSteps} au minimum{hints
                  ? ` · ${hints} indice${hints > 1 ? 's' : ''}`
                  : ''}
              {:else}
                Voici un des chemins les plus courts{forbidden ? ` sans ${withArticle(forbidden)}` : ''} :
              {/if}
            </p>
          </div>
          {#if outcome === 'won'}<span class="points num">+<AnimatedNumber value={points} /></span>{/if}
        </div>
        <ol class="chain">
          {#each finalPath as id, i (id)}
            <li>
              {#if i > 0}<ArrowRight class="arrow" />{/if}
              <Flag iso2={country(id).iso2} width={20} />
              <span>{country(id).name}</span>
            </li>
          {/each}
        </ol>
        {#if outcome === 'won' && finalPath.length > optimalPath.length}
          <p class="muted small shortest">
            Le plus court : {optimalPath.map((id) => country(id).name).join(' → ')}
          </p>
        {/if}
        <div class="end-actions">
          <Button onclick={again}>
            {#snippet icon()}<RotateCcw />{/snippet}
            Nouveau chemin
          </Button>
          <Button variant="ghost" onclick={() => router.go('/')}>
            {#snippet icon()}<Home />{/snippet}
            Accueil
          </Button>
        </div>
      </div>
    {/if}
  </div>

  {#if outcome === 'playing'}
    <div class="dock">
      {#if message}
        {#key message}
          <p class="msg {message.tone}" in:fly={{ y: 4, duration: dur }} aria-live="polite">{message.text}</p>
        {/key}
      {/if}
      <div class="entry" data-sound="off">
        <TextAnswer bind:value={typed} status={inputState} placeholder="Un pays à traverser…" onsubmit={submit} />
      </div>
      <div class="tools">
        <div class="legend">
          <span><i class="optimal"></i>Bon chemin</span>
          <span><i class="close"></i>Détour</span>
          <span><i class="far"></i>Hors route</span>
        </div>
        <div class="buttons">
          <Button variant="ghost" size="sm" onclick={hint}>
            {#snippet icon()}<Lightbulb />{/snippet}
            Indice
          </Button>
          <Button variant="ghost" size="sm" onclick={giveUp}>
            {#snippet icon()}<FlagIcon />{/snippet}
            Abandonner
          </Button>
        </div>
      </div>
    </div>
  {/if}
</div>

<p class="visually-hidden">Trouve un chemin terrestre {capitalOfPhrase(start)} à {withArticle(end)}.</p>

<style>
  .pg {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    height: calc(100dvh - 48px);
    min-height: 520px;
  }
  .hud {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.75rem;
    min-height: 56px;
    margin-left: -6px;
  }
  .dots {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--surface-3);
    transition:
      background-color var(--dur) ease,
      transform var(--dur) var(--ease-spring);
  }
  .dot.spare {
    opacity: 0.6;
  }
  .dot.optimal,
  .dot.close,
  .dot.far {
    opacity: 1;
    transform: scale(1.15);
  }
  .dot.optimal {
    background: var(--green);
  }
  .dot.close {
    background: var(--violet);
  }
  .dot.far {
    background: var(--pink);
  }
  .count {
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
  }
  .map-box {
    position: relative;
    flex: 1;
    min-height: 0;
  }
  .brief {
    position: absolute;
    top: 12px;
    left: 50%;
    z-index: 3;
    translate: -50% 0;
    max-width: calc(100% - 24px);
    padding: 0.55rem 1.1rem;
    border-radius: var(--radius-lg);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    box-shadow: var(--shadow-1);
    backdrop-filter: blur(8px);
    text-align: center;
    pointer-events: none;
  }
  .route {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: clamp(1rem, 3.6vw, 1.2rem);
  }
  .route :global(.arrow) {
    width: 18px;
    height: 18px;
    color: var(--text-faint);
  }
  .meta {
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  .forbid {
    color: var(--pink-strong);
    font-weight: 650;
  }
  @media (max-width: 560px) {
    .brief {
      top: 8px;
      padding: 0.4rem 0.8rem;
      width: max-content;
      max-width: calc(100% - 16px);
    }
    .route {
      flex-wrap: nowrap;
      gap: 0.3rem;
      font-size: 0.95rem;
      white-space: nowrap;
    }
    .route :global(.flag) {
      display: none;
    }
    .meta {
      font-size: var(--fs-xs);
    }
  }
  .dock {
    display: grid;
    gap: 0.5rem;
    width: 100%;
    max-width: var(--content);
    margin: 0 auto;
  }
  .msg {
    font-size: var(--fs-sm);
    font-weight: 600;
    text-align: center;
  }
  .msg.ok {
    color: var(--green-strong);
  }
  .msg.ko {
    color: var(--pink-strong);
  }
  .msg.info {
    color: var(--text-muted);
  }
  .tools {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .legend {
    display: flex;
    gap: 0.75rem;
    font-size: var(--fs-xs);
    color: var(--text-muted);
  }
  .legend span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .legend i {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }
  .legend .optimal {
    background: var(--green);
  }
  .legend .close {
    background: var(--violet);
  }
  .legend .far {
    background: var(--pink);
  }
  .buttons {
    display: flex;
    gap: 4px;
  }
  .end {
    position: absolute;
    left: 50%;
    bottom: 12px;
    z-index: 4;
    translate: -50% 0;
    display: grid;
    gap: 0.75rem;
    width: min(var(--content), calc(100% - 24px));
    padding: 1rem 1.1rem;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-2);
  }
  .end.won {
    background: linear-gradient(160deg, var(--green-soft), var(--surface) 70%);
  }
  .end-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }
  .end-title {
    font-size: var(--fs-lg);
    font-weight: 780;
  }
  .small {
    font-size: var(--fs-sm);
  }
  .points {
    padding: 0.3rem 0.75rem;
    border-radius: 999px;
    background: var(--violet-soft);
    color: var(--violet-strong);
    font-weight: 780;
  }
  .chain {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.3rem 0.4rem;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--fs-sm);
    font-weight: 650;
  }
  .chain li {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .chain :global(.arrow) {
    width: 14px;
    height: 14px;
    color: var(--text-faint);
  }
  .shortest {
    margin-top: -0.25rem;
  }
  .end-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
