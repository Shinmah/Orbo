<script lang="ts" module>
  export type MapMark = 'target' | 'correct' | 'wrong' | 'reveal' | 'forbidden' | 'hint' | 'endpoint';

  export interface MapLabel {
    id: string;
    text: string;
    /** strong et warn sont toujours affichées ; soft seulement s'il reste de la place. */
    tone?: 'strong' | 'warn' | 'soft';
  }
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
  import { BOTTOM, HEIGHT, SHAPES, TOP, WIDTH, countryBox, countrySize, project, unionBox, type Box } from './geo';

  interface Props {
    /** Pays cliquables ? */
    interactive?: boolean;
    onpick?: (id: string) => void;
    /** États visuels par pays (cible, bonne / mauvaise réponse, interdit…). */
    marks?: Record<string, MapMark>;
    /** Couleurs de remplissage personnalisées (carte de maîtrise, jeu « Chemin »). */
    fills?: Record<string, string>;
    /** Zone à cadrer : un ou plusieurs pays, ou rien (monde entier). */
    frame?: { ids: string[]; padding?: number; maxZoom?: number } | null;
    /** Étiquettes posées sur la carte (noms des pays de départ et d'arrivée…). */
    labels?: MapLabel[];
    label?: string;
    /** Pays pouvant recevoir un marqueur. Par défaut : les micro-États et petites îles. */
    markerIds?: string[];
  }
  let {
    interactive = false,
    onpick,
    marks = {},
    fills = {},
    frame = null,
    labels = [],
    label = 'Carte du monde',
    markerIds,
  }: Props = $props();

  let container: HTMLDivElement;
  let svg: SVGSVGElement;
  let behavior: ZoomBehavior<SVGSVGElement, unknown> | undefined;
  let transform = $state<ZoomTransform>(zoomIdentity);
  /** Taille réelle de la carte à l'écran (px). Le SVG travaille directement en pixels. */
  let cw = $state(0);
  let ch = $state(0);

  /** Zoom maximal, relatif à la vue « monde ». */
  const MAX_ZOOM = 60;

  /** Échelle où le monde entier tient dans le cadre, et échelle où il le remplit. */
  const containK = $derived(Math.min(cw / WIDTH, ch / HEIGHT));
  const coverK = $derived(Math.max(cw / WIDTH, ch / HEIGHT));
  /**
   * Vue « monde » : la carte remplit le cadre (pas de bandes vides en haut et en bas)
   * tant que cela ne coupe pas plus d'un quart de la largeur ; sur un écran étroit
   * (téléphone en portrait), on garde une vue plus large, déplaçable au doigt.
   */
  const worldK = $derived(Math.min(coverK, containK * (ch > cw ? 1.8 : 1.35)));

  const markerCountries = $derived(
    markerIds ? markerIds.map((id) => BY_ID.get(id)!).filter(Boolean) : COUNTRIES.filter((c) => c.map.small),
  );
  const sizes = new Map(COUNTRIES.map((c) => [c.id, countrySize(c)]));

  /** Marqueurs visibles : pays trop petits pour être vus ou cliqués au zoom actuel. */
  const markers = $derived(
    markerCountries
      .filter((c) => sizes.get(c.id)! * transform.k < 9)
      .map((c) => {
        const [x, y] = transform.apply(project(c.map.point));
        return { id: c.id, x, y };
      }),
  );

  /**
   * Étiquettes placées sans chevauchement : les étiquettes « fortes » d'abord (toujours
   * affichées), puis les autres seulement s'il reste de la place (largeur estimée).
   */
  const placedLabels = $derived.by(() => {
    if (!cw) return [];
    const placed: (MapLabel & { x: number; y: number; box: [number, number, number, number] })[] = [];
    const rank = (l: MapLabel) => (l.tone === 'strong' ? 0 : l.tone === 'warn' ? 1 : 2);
    const ordered = [...labels].filter((l) => BY_ID.has(l.id)).sort((a, b) => rank(a) - rank(b));
    for (const l of ordered) {
      const [x, y] = transform.apply(project(BY_ID.get(l.id)!.map.point));
      const w = l.text.length * 6.6 + 18;
      const box: [number, number, number, number] = [x - w / 2, y - 34, x + w / 2, y - 10];
      const overlaps = placed.some((p) => box[0] < p.box[2] && box[2] > p.box[0] && box[1] < p.box[3] && box[3] > p.box[1]);
      if (overlaps && rank(l) === 2) continue;
      placed.push({ ...l, x, y, box });
    }
    return placed;
  });

  function worldTransform(): ZoomTransform {
    const k = worldK;
    return zoomIdentity.translate(cw / 2, ch / 2).scale(k).translate(-WIDTH / 2, -(TOP + HEIGHT / 2));
  }

  function fitBox([[x0, y0], [x1, y1]]: Box, padding = 1.4, maxZoom = 12): ZoomTransform {
    const dx = Math.max(x1 - x0, 1);
    const dy = Math.max(y1 - y0, 1);
    const k = Math.max(containK, Math.min(worldK * maxZoom, Math.min(cw / (dx * padding), ch / (dy * padding))));
    return zoomIdentity
      .translate(cw / 2, ch / 2)
      .scale(k)
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  }

  function frameTo(f: Props['frame'], animate = true) {
    if (!svg || !behavior || !cw || !ch) return;
    const t =
      f && f.ids.length ? fitBox(unionBox(f.ids.map((id) => countryBox(BY_ID.get(id)!))), f.padding, f.maxZoom) : worldTransform();
    const sel = select(svg);
    if (animate && !settings.reducedMotion) {
      sel.transition().duration(850).ease(easeCubicInOut).call(behavior.transform, t);
    } else {
      sel.call(behavior.transform, t);
    }
  }

  function zoomBy(factor: number) {
    if (behavior) select(svg).transition().duration(settings.reducedMotion ? 0 : 280).call(behavior.scaleBy, factor);
  }

  onMount(() => {
    behavior = zoom<SVGSVGElement, unknown>()
      .translateExtent([
        [0, TOP],
        [WIDTH, BOTTOM],
      ])
      .clickDistance(6)
      .on('zoom', (e) => (transform = e.transform));
    select(svg).call(behavior);

    // Adapte la carte à la taille de son cadre (fenêtre redimensionnée, rotation du téléphone…).
    const ro = new ResizeObserver(() => {
      const first = cw === 0;
      cw = container.clientWidth;
      ch = container.clientHeight;
      behavior!.extent([
        [0, 0],
        [cw, ch],
      ]);
      behavior!.scaleExtent([containK, worldK * MAX_ZOOM]);
      frameTo(frame, false);
      if (first) lastFrame = JSON.stringify(frame);
    });
    ro.observe(container);
    return () => ro.disconnect();
  });

  // Recadrage animé quand la zone demandée change (nouvelle question, correction…).
  let lastFrame = '';
  $effect(() => {
    const key = JSON.stringify(frame);
    if (key !== lastFrame && lastFrame !== '') {
      lastFrame = key;
      frameTo(frame);
    }
  });

  function pick(id: string) {
    if (interactive && BY_ID.has(id)) onpick?.(id);
  }
</script>

<div class="map" class:interactive bind:this={container} data-sound="off">
  <svg bind:this={svg} viewBox="0 0 {cw || 1} {ch || 1}" role="img" aria-label={label}>
    <defs>
      <pattern id="orbo-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="6" height="6" class="hatch-bg" />
        <line x1="0" y1="0" x2="0" y2="6" class="hatch-line" />
      </pattern>
    </defs>
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
          {#if mark === 'target' || mark === 'reveal' || mark === 'correct' || mark === 'hint'}
            <circle class="pulse" r="6" />
          {/if}
          <circle class="dot" r={mark ? 6.5 : 4.5} style:fill={!mark && fills[m.id] ? fills[m.id] : undefined} />
          {#if interactive}
            <circle class="hit" r="13" onclick={() => pick(m.id)} role="presentation" data-id={m.id} />
          {/if}
        </g>
      {/each}
    </g>
  </svg>

  {#each placedLabels as l (l.id)}
    <span class="map-label {l.tone ?? 'soft'}" style:left="{l.x}px" style:top="{l.y}px">{l.text}</span>
  {/each}

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
    height: 100%;
    min-height: 220px;
    overflow: hidden;
    border-radius: var(--radius-xl);
    background: var(--map-ocean);
    border: 1px solid var(--border);
  }
  svg {
    position: absolute;
    inset: 0;
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
  .land.forbidden {
    fill: url(#orbo-hatch);
  }
  .land.endpoint {
    fill: var(--text);
  }
  .land.hint {
    stroke: var(--violet-strong);
    stroke-width: 2.5px;
    stroke-dasharray: 5 4;
    animation: hint-dash 1.2s linear infinite;
  }
  @keyframes hint-dash {
    to {
      stroke-dashoffset: -18;
    }
  }
  .hatch-bg {
    fill: var(--pink-soft);
  }
  .hatch-line {
    stroke: var(--pink-strong);
    stroke-width: 2.5;
  }

  .marker .dot {
    fill: var(--map-marker);
    stroke: var(--map-ocean);
    stroke-width: 1.5px;
    transition: fill var(--dur) ease;
  }
  .marker.target .dot,
  .marker.hint .dot {
    fill: var(--violet-strong);
  }
  .marker.correct .dot,
  .marker.reveal .dot {
    fill: var(--green-strong);
  }
  .marker.wrong .dot,
  .marker.forbidden .dot {
    fill: var(--pink-strong);
  }
  .marker.endpoint .dot {
    fill: var(--text);
  }
  .pulse {
    fill: none;
    stroke: var(--violet-strong);
    stroke-width: 2px;
    animation: map-pulse 1.6s var(--ease-out) infinite;
  }
  .correct .pulse,
  .reveal .pulse {
    stroke: var(--green-strong);
  }
  @keyframes map-pulse {
    0% {
      r: 5px;
      stroke-opacity: 0.9;
    }
    100% {
      r: 22px;
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

  .map-label {
    position: absolute;
    z-index: 1;
    translate: -50% calc(-100% - 10px);
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: var(--fs-xs);
    font-weight: 750;
    white-space: nowrap;
    pointer-events: none;
    box-shadow: var(--shadow-1);
  }
  .map-label.strong {
    background: var(--text);
    color: var(--bg);
  }
  .map-label.warn {
    background: var(--pink-strong);
    color: var(--bg);
  }
  .map-label.soft {
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    color: var(--text);
  }

  .controls {
    position: absolute;
    right: 10px;
    bottom: 10px;
    z-index: 2;
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
