<script lang="ts">
  import { Download, ExternalLink, RefreshCw } from '@lucide/svelte';
  import Button from './Button.svelte';
  import ProgressBar from './ProgressBar.svelte';
  import { updates } from '../updates.svelte';

  const latest = $derived(updates.latest);
</script>

<div class="panel">
  <div class="row">
    <span class="label">Version installée</span>
    <span class="num value">{updates.current || '—'}{updates.portable ? ' (portable)' : ''}</span>
  </div>

  <div class="status" role="status" aria-live="polite">
    {#if updates.status === 'idle'}
      <p class="muted">Vérifie s'il existe une version plus récente sur GitHub.</p>
    {:else if updates.status === 'checking'}
      <p class="muted">Recherche d'une mise à jour…</p>
    {:else if updates.status === 'none'}
      <p class="ok">Orbo est à jour.</p>
    {:else if updates.status === 'available' && latest}
      <p class="new">Orbo {latest.version} est disponible.</p>
      {#if latest.notes}<p class="notes">{latest.notes}</p>{/if}
      {#if !latest.canInstall}
        <p class="muted small">Le téléchargement s'ouvre dans ton navigateur{updates.portable ? ' : remplace ensuite ton ancien fichier portable' : ''}.</p>
      {/if}
    {:else if updates.status === 'downloading'}
      <p class="muted">Téléchargement… <span class="num">{Math.round(updates.progress * 100)} %</span></p>
      <ProgressBar value={updates.progress} label="Téléchargement de la mise à jour" />
    {:else if updates.status === 'installing'}
      <p class="ok">L'installateur s'ouvre, Orbo va se fermer. Suis les étapes puis relance Orbo.</p>
    {:else if updates.status === 'private'}
      <p class="muted">
        Le dépôt GitHub d'Orbo est privé : l'appli ne peut pas voir seule les nouvelles versions. Le bouton ci-dessous
        télécharge la dernière version dans ton navigateur (connecte-toi à GitHub si besoin).
      </p>
    {:else if updates.status === 'offline'}
      <p class="muted">Pas de connexion à internet pour l'instant.</p>
    {:else if updates.status === 'error'}
      <p class="ko">{updates.message || 'La vérification a échoué.'}</p>
    {/if}
  </div>

  <div class="actions">
    {#if updates.status === 'available' || updates.status === 'private' || updates.status === 'error'}
      <Button onclick={() => updates.install()}>
        {#snippet icon()}{#if updates.status === 'available' && latest?.canInstall}<Download />{:else}<ExternalLink />{/if}{/snippet}
        {#if updates.status === 'available' && latest?.canInstall}Installer la mise à jour{:else}Télécharger la dernière version{/if}
      </Button>
    {/if}
    {#if updates.status !== 'downloading' && updates.status !== 'installing'}
      <Button variant={updates.status === 'available' ? 'ghost' : 'secondary'} onclick={() => updates.check()} disabled={updates.status === 'checking'}>
        {#snippet icon()}<RefreshCw />{/snippet}
        Rechercher une mise à jour
      </Button>
    {/if}
  </div>
</div>

<style>
  .panel {
    display: grid;
    gap: 0.75rem;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }
  .label {
    font-weight: 600;
  }
  .value {
    font-weight: 700;
    color: var(--text-muted);
  }
  .status {
    display: grid;
    gap: 0.4rem;
    font-size: var(--fs-sm);
  }
  .ok {
    color: var(--green-strong);
    font-weight: 650;
  }
  .ko {
    color: var(--pink-strong);
    font-weight: 650;
  }
  .new {
    color: var(--violet-strong);
    font-weight: 700;
  }
  .notes {
    max-height: 7.5em;
    overflow: auto;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    color: var(--text-muted);
    white-space: pre-line;
  }
  .small {
    font-size: var(--fs-xs);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
</style>
