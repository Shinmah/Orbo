<script lang="ts">
  import TopBar from '../lib/ui/TopBar.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import Card from '../lib/ui/Card.svelte';
  import Button from '../lib/ui/Button.svelte';
  import { settings, type Motion, type SoundLevel, type Theme } from '../lib/settings.svelte';
  import { sound } from '../lib/sound';
  import { router } from '../lib/router.svelte';
  import { progress } from '../lib/progress.svelte';
  import { updates } from '../lib/updates.svelte';
  import UpdatePanel from '../lib/ui/UpdatePanel.svelte';

  let theme = $state<Theme>(settings.value.theme);
  let motion = $state<Motion>(settings.value.motion);
  let goal = $state(settings.value.dailyGoal);
  let soundLevel = $state<SoundLevel>(settings.value.sound);
  let confirmReset = $state(false);
  let resetDone = $state(false);

  function reset() {
    if (!confirmReset) {
      confirmReset = true;
      return;
    }
    progress.reset();
    confirmReset = false;
    resetDone = true;
  }
</script>

<TopBar title="Réglages" />

<div class="stack">
  <section>
    <h2>Apparence</h2>
    <Card>
      <div class="row">
        <span class="label">Thème</span>
        <Segmented
          label="Thème"
          bind:value={theme}
          onchange={(v) => settings.update({ theme: v })}
          options={[
            { value: 'auto', label: 'Auto' },
            { value: 'light', label: 'Clair' },
            { value: 'dark', label: 'Sombre' },
          ]}
        />
      </div>
      <div class="row">
        <span class="label">Sons</span>
        <Segmented
          label="Sons"
          bind:value={soundLevel}
          onchange={(v) => {
            settings.update({ sound: v });
            sound.correct();
          }}
          options={[
            { value: 'off', label: 'Coupés' },
            { value: 'soft', label: 'Doux' },
            { value: 'normal', label: 'Normaux' },
          ]}
        />
      </div>
      <div class="row">
        <span class="label">Animations</span>
        <Segmented
          label="Animations"
          bind:value={motion}
          onchange={(v) => settings.update({ motion: v })}
          options={[
            { value: 'auto', label: 'Normales' },
            { value: 'reduce', label: 'Réduites' },
          ]}
        />
      </div>
    </Card>
  </section>

  <section>
    <h2>Objectif du jour</h2>
    <Card>
      <p class="muted help">Nombre de questions à jouer chaque jour pour garder ta série de jours.</p>
      <Segmented
        label="Objectif du jour"
        bind:value={goal}
        onchange={(v) => settings.update({ dailyGoal: v })}
        options={[
          { value: 10, label: '10' },
          { value: 20, label: '20' },
          { value: 30, label: '30' },
          { value: 50, label: '50' },
        ]}
      />
    </Card>
  </section>

  <section>
    <h2>Progression</h2>
    <Card>
      <p class="muted help">
        Ta progression est enregistrée uniquement sur cet appareil ({progress.data.totals.answered.toLocaleString('fr-FR')}
        réponses).
      </p>
      <div class="reset">
        <Button variant="danger" onclick={reset}>{confirmReset ? 'Confirmer la remise à zéro' : 'Remettre à zéro'}</Button>
        {#if confirmReset}<Button variant="ghost" onclick={() => (confirmReset = false)}>Annuler</Button>{/if}
        {#if resetDone}<span class="muted small" role="status">Progression effacée.</span>{/if}
      </div>
    </Card>
  </section>

  {#if updates.supported}
    <section>
      <h2>Mises à jour</h2>
      <Card>
        <UpdatePanel />
      </Card>
    </section>
  {/if}

  <section>
    <h2>À propos</h2>
    <Card>
      <p class="about">
        Orbo couvre les 193 États membres de l'ONU et les 2 États observateurs (Vatican, Palestine). Données :
        Wikidata (CC0), mledoze/countries (ODbL), Natural Earth (domaine public), drapeaux flag-icons (MIT).
      </p>
      <div class="about-actions">
        <Button variant="ghost" size="sm" onclick={() => router.go('/design')}>Voir le design system</Button>
        {#if updates.current}<span class="muted small num">Version {updates.current}</span>{/if}
      </div>
    </Card>
  </section>
</div>

<style>
  .stack {
    display: grid;
    gap: 1.5rem;
  }
  h2 {
    margin: 0 0 0.6rem 0.25rem;
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .row {
    display: grid;
    grid-template-columns: 110px 1fr;
    align-items: center;
    gap: 1rem;
  }
  .row + .row {
    margin-top: 0.9rem;
  }
  .label {
    font-weight: 600;
  }
  .help {
    margin-bottom: 0.8rem;
    font-size: var(--fs-sm);
  }
  .reset {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .small {
    font-size: var(--fs-sm);
  }
  .about-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .about {
    margin-bottom: 0.6rem;
    font-size: var(--fs-sm);
    color: var(--text-muted);
  }
  @media (max-width: 420px) {
    .row {
      grid-template-columns: 1fr;
      gap: 0.4rem;
    }
  }
</style>
