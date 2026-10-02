<script lang="ts" module>
  export type MapMark = 'target' | 'correct' | 'wrong' | 'reveal';
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { select } from 'd3-selection';
  import 'd3-transition';
  import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
  import { easeCubicInOut } from 'd3-ease';
  import { Minus, Plus, Maximize } from '@lucide/svelte';
  import { COUNTRIES, BY_ID } from '../data';
  import { settings } from '../settings.svelte';
  import { HEIGHT, SHAPES, TOP, WIDTH, WORLD_BOX, countryBox, countrySize, project, unionBox, type Box } from './geo';

  interface Props {
    /** Pays cliquables ? */
    interactive?: boolean;
    onpick?: (id: string) => void;
    /** États visuels par pays (cible, bonne / mauvaise réponse). */
    marks?: Record<string, MapMark>;
    /** Couleurs de remplissage personnalisées (carte de maîtrise des statistiques). */
    fills?: Record<string, string>;
    /** Zone à cadrer : un pays, une liste de pays, ou rien (monde entier). */
    frame?: { ids: string[]; padding?: number; maxZoom?: number } | null;
    label?: string;
    /** Pays dont on affiche le marqueur (petits pays). Par défaut : tous les pays jouables. */
    markerIds?: string[];
  }
  let { interactive = false, onpick, marks = {}, fills = {}, frame = null, label = 'Carte du monde', markerIds }: Props = $props();

  let svg: SVGSVGElement;
  let behavior: ZoomBehavior<SVGSVGElement, unknown>;
  let transform = $state<ZoomTransform>(zoomIdentity);
  let clientWidth = $state(WIDTH);
  /** Facteur pixels écran / unités de carte. */
  const s = $derived(Math.max(clientWidth, 1) / WIDTH);

  const MAX_ZOOM = 60;
  const markerCountries = $derived((markerIds ? markerIds.map((id) => BY_ID.get(id)!) : COUNTRIES).filter(Boolean));
  const sizes = new Map(COUNTRIES.map((c) => [c.id, countrySize(c)]));

  /** Marqueurs visibles : pays trop petits pour être vus/cliqués au zoom actuel. */
  const markers = $derived(
    markerCountries
      .filter((c) => sizes.get(c.id)! * transform.k * s < 9)
      .map((c) => {
        const [x, y] = transform.apply(project(c.map.point));
        return { id: c.id, x, y };
      }),
  );

  function fitBox([[x0, y0], [x1, y1]]: Box, padding = 1.4, maxZoom = 12): ZoomTransform {
    const dx = Math.max(x1 - x0, 1);
    const dy = Math.max(y1 - y0, 1);
    const k = Math.max(1, Math.min(maxZoom, Math.min(WIDTH / (dx * padding), HEIGHT / (dy * padding))));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    return zoomIdentity.translate(WIDTH / 2, TOP + HEIGHT / 2).scale(k).translate(-cx, -cy);
  }

  function frameTo(f: Props['frame'], animate = true) {
    if (!svg || !behavior) return;
    const box = f && f.ids.length ? unionBox(f.ids.map((id) => countryBox(BY_ID.get(id)!))) : WORLD_BOX;
    const t = f && f.ids.length ? fitBox(box, f.padding, f.maxZoom) : zoomIdentity;
    const sel = select(svg);
    if (animate && !settings.reducedMotion) {
      sel.transition().duration(850).ease(easeCubicInOut).call(behavior.transform, t);
    } else {
      sel.call(behavior.transform, t);
    }
  }

  function zoomBy(factor: number) {
    select(svg).transition().duration(settings.reducedMotion ? 0 : 280).call(behavior.scaleBy, factor);
  }

  onMount(() => {
    behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .extent([
        [0, TOP],
        [WIDTH, TOP + HEIGHT],
      ])
      .translateExtent([
        [0, TOP],
        [WIDTH, TOP + HEIGHT],
      ])
      .clickDistance(6)
      .on('zoom', (e) => (transform = e.transform));
    select(svg).call(behavior);
    frameTo(frame, false);
  });

  // Recadrage animé quand la zone demandée change (nouvelle question, correction…).
  let lastFrame = '';
  $effect(() => {
    const key = JSON.stringify(frame);
    if (key !== lastFrame) {
      const first = lastFrame === '';
      lastFrame = key;
      if (!first) frameTo(frame);
    }
  });

  function pick(id: string) {
    if (interactive && BY_ID.has(id)) onpick?.(id);
  }

</script>

<div class="map" class:interactive bind:clientWidth>
  <svg
    bind:this={svg}
    viewBox="0 {TOP} {WIDTH} {HEIGHT}"
    role="img"
    aria-label={label}
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform={transform.toString()}>
      {#each SHAPES as shape (shape.id)}
        {@const mark = marks[shape.id]}
        <path
          d={shape.d}
          class="land {mark ?? ''}"
          class:playable={shape.playable}
          class:other={!shape.playable}
          style:fill={!mark && fills[shape.id] ? fills[shape.id] : undefined}
          onclick={() => pick(shape.id)}
          role="presentation"
          data-id={shape.id}
        />
      {/each}
    </g>
    <g class="markers">
      {#each markers as m (m.id)}
        {@const mark = marks[m.id]}
        <g transform="translate({m.x} {m.y})" class="marker {mark ?? ''}">
          {#if mark === 'target' || mark === 'reveal' || mark === 'correct'}
            <circle class="pulse" r={6 / s} style:--r0="{5 / s}px" style:--r1="{22 / s}px" />
          {/if}
          <circle class="dot" r={(mark ? 6.5 : 4.5) / s} style:fill={!mark && fills[m.id] ? fills[m.id] : undefined} />
          {#if interactive}
            <circle class="hit" r={13 / s} onclick={() => pick(m.id)} role="presentation" data-id={m.id} />
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  <div class="controls">
    <button type="button" aria-label="Zoomer" onclick={() => zoomBy(2)}><Plus /></button>
    <button type="button" aria-label="Dézoomer" onclick={() => zoomBy(0.5)}><Minus /></button>
    <button type="button" aria-label="Recentrer" onclick={() => frameTo(frame)}><Maximize /></button>
  </div>
</div>

<style>
  .map {
    position: relative;
    width: 100%;
    overflow: hidden;
    border-radius: var(--radius-xl);
    background: var(--map-ocean);
    border: 1px solid var(--border);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }
  svg:active {
    cursor: grabbing;
  }
  .land {
    fill: var(--map-land);
    stroke: var(--map-border);
    stroke-width: 0.7px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
    transition: fill var(--dur) ease;
  }
  .other {
    fill: var(--map-other);
    pointer-events: none;
  }
  .interactive .playable {
    cursor: pointer;
  }
  @media (hover: hover) {
    .interactive .playable:hover {
      fill: var(--map-land-hover);
    }
  }
  .land.target {
    fill: var(--violet-strong);
  }
  .land.correct,
  .land.reveal {
    fill: var(--green-strong);
  }
  .land.wrong {
    fill: var(--pink-strong);
  }

  .marker .dot {
    fill: var(--map-marker);
    stroke: var(--map-ocean);
    stroke-width: 1.5px;
    vector-effect: non-scaling-stroke;
    transition: fill var(--dur) ease;
  }
  .marker.target .dot {
    fill: var(--violet-strong);
  }
  .marker.correct .dot,
  .marker.reveal .dot {
    fill: var(--green-strong);
  }
  .marker.wrong .dot {
    fill: var(--pink-strong);
  }
  .pulse {
    fill: none;
    stroke: var(--violet-strong);
    stroke-width: 2px;
    vector-effect: non-scaling-stroke;
    animation: map-pulse 1.6s var(--ease-out) infinite;
  }
  .correct .pulse,
  .reveal .pulse {
    stroke: var(--green-strong);
  }
  @keyframes map-pulse {
    0% {
      r: var(--r0);
      stroke-opacity: 0.9;
    }
    100% {
      r: var(--r1);
      stroke-opacity: 0;
    }
  }
  .hit {
    fill: transparent;
    cursor: pointer;
  }
  .interactive .marker:hover .dot {
    fill: var(--violet-strong);
  }

  .controls {
    position: absolute;
    right: 10px;
    bottom: 10px;
    display: grid;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius);
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    box-shadow: var(--shadow-1);
    backdrop-filter: blur(6px);
  }
  .controls button {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text-muted);
  }
  .controls button:hover {
    background: var(--surface-2);
    color: var(--text);
  }
  .controls :global(svg) {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
</style>
