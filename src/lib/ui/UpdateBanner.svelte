<script lang="ts">
  import { fly } from 'svelte/transition';
  import { Download, Sparkles } from '@lucide/svelte';
  import Button from './Button.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import { updates } from '../updates.svelte';
  import { settings } from '../settings.svelte';
</script>

{#if updates.updateAvailable && updates.latest}
  <div class="banner" role="status" in:fly={{ y: -8, duration: settings.reducedMotion ? 0 : 280 }}>
    <span class="icon"><Sparkles /></span>
    <div class="text">
      {#if updates.status === 'downloading'}
        <strong>Téléchargement d'Orbo {updates.latest.version}…</strong>
        <ProgressBar value={updates.progress} height={6} label="Téléchargement de la mise à jour" />
      {:else if updates.status === 'installing'}
        <strong>L'installateur s'ouvre, Orbo va se fermer.</strong>
      {:else}
        <strong>Orbo {updates.latest.version} est disponible</strong>
        <span class="muted">Nouveautés et corrections : mets à jour en un clic.</span>
      {/if}
    </div>
    {#if updates.status === 'available'}
      <Button size="sm" onclick={() => updates.install()}>
        {#snippet icon()}<Download />{/snippet}
        Mettre à jour
      </Button>
    {/if}
  </div>
{/if}

<style>
  .banner {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    margin-bottom: 0.5rem;
    padding: 0.75rem 0.85rem;
    border-radius: var(--radius-lg);
    background: linear-gradient(135deg, var(--violet-soft), var(--green-soft));
    border: 1px solid color-mix(in srgb, var(--violet) 40%, transparent);
  }
  .icon {
    display: grid;
    place-items: center;
    flex: none;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    background: var(--surface);
    color: var(--violet-strong);
  }
  .icon :global(svg) {
    width: 20px;
    height: 20px;
  }
  .text {
    display: grid;
    flex: 1;
    gap: 2px;
    min-width: 0;
    font-size: var(--fs-sm);
  }
</style>
