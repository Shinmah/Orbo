<script lang="ts">
  interface Props {
    size?: number;
    wordmark?: boolean;
  }
  let { size = 32, wordmark = true }: Props = $props();
</script>

<span class="logo">
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <linearGradient id="orbo-planet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#d3c5fc" />
        <stop offset="1" stop-color="#a28af0" />
      </linearGradient>
      <clipPath id="orbo-front"><rect x="0" y="33" width="64" height="31" /></clipPath>
    </defs>
    <g transform="rotate(-20 32 33)">
      <ellipse cx="32" cy="33" rx="29" ry="9.5" fill="none" stroke="#f7a8c4" stroke-width="4.5" />
    </g>
    <circle cx="32" cy="32" r="18" fill="url(#orbo-planet)" />
    <g transform="rotate(-20 32 33)">
      <ellipse cx="32" cy="33" rx="29" ry="9.5" fill="none" stroke="#f7a8c4" stroke-width="4.5" clip-path="url(#orbo-front)" />
    </g>
    <circle cx="52" cy="13" r="5.5" fill="#9fdfb8" />
  </svg>
  {#if wordmark}<span class="word">Orbo</span>{/if}
</span>

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .word {
    font-size: 1.375rem;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
</style>
