<script lang="ts">
  interface Props {
    iso2: string;
    /** Largeur en px (hauteur = 3/4). */
    width?: number;
    alt?: string;
  }
  let { iso2, width = 48, alt = '' }: Props = $props();
</script>

<span class="flag" style:width="{width}px" style:--r="{Math.max(3, Math.round(width / 12))}px">
  <img src="./flags/{iso2}.svg" {alt} width={width} height={Math.round((width * 3) / 4)} draggable="false" decoding="async" />
</span>

<style>
  .flag {
    position: relative;
    display: inline-block;
    flex: none;
    aspect-ratio: 4 / 3;
    border-radius: var(--r);
    overflow: hidden;
    background: var(--surface-2);
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* Liseré discret pour les drapeaux clairs (Japon, Pologne…) */
  .flag::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
    pointer-events: none;
  }
</style>
