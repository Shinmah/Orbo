<script lang="ts">
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { settings } from '../settings.svelte';

  interface Props {
    value: number;
    duration?: number;
    format?: (n: number) => string;
  }
  let { value, duration = 600, format = (n) => Math.round(n).toLocaleString('fr-FR') }: Props = $props();

  const tween = new Tween(0, { easing: cubicOut });
  $effect(() => {
    tween.set(value, { duration: settings.reducedMotion ? 0 : duration });
  });
</script>

<span class="num">{format(tween.current)}</span>
