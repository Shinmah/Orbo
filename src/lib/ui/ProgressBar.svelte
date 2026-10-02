<script lang="ts">
  interface Props {
    value: number;
    tone?: 'violet' | 'green' | 'pink';
    height?: number;
    label?: string;
  }
  let { value, tone = 'violet', height = 8, label }: Props = $props();
  const pct = $derived(Math.max(0, Math.min(1, value)) * 100);
</script>

<div
  class="bar {tone}"
  style:height="{height}px"
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(pct)}
>
  <span style:width="{pct}%"></span>
</div>

<style>
  .bar {
    width: 100%;
    overflow: hidden;
    border-radius: 999px;
    background: var(--surface-3);
  }
  span {
    display: block;
    height: 100%;
    border-radius: inherit;
    transition: width var(--dur-slow) var(--ease-out);
  }
  .violet span {
    background: var(--violet);
  }
  .green span {
    background: var(--green);
  }
  .pink span {
    background: var(--pink);
  }
</style>
