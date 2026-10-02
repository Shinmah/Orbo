<script lang="ts">
  import { Flame, Play } from '@lucide/svelte';
  import TopBar from '../lib/ui/TopBar.svelte';
  import Button from '../lib/ui/Button.svelte';
  import Card from '../lib/ui/Card.svelte';
  import Chip from '../lib/ui/Chip.svelte';
  import Segmented from '../lib/ui/Segmented.svelte';
  import ChoiceButton from '../lib/ui/ChoiceButton.svelte';
  import TextAnswer from '../lib/ui/TextAnswer.svelte';
  import ProgressBar from '../lib/ui/ProgressBar.svelte';
  import Ring from '../lib/ui/Ring.svelte';
  import AnimatedNumber from '../lib/ui/AnimatedNumber.svelte';
  import Flag from '../lib/ui/Flag.svelte';
  import StatTile from '../lib/ui/StatTile.svelte';
  import Logo from '../lib/ui/Logo.svelte';
  import { settings, type Theme } from '../lib/settings.svelte';

  let theme = $state<Theme>(settings.value.theme);
  let seg = $state('a');
  let chip = $state(true);
  let text = $state('Ouagadougou');
  let score = $state(120);

  const swatches = [
    ['Violet', 'violet'],
    ['Vert', 'green'],
    ['Rose', 'pink'],
  ];
  const neutrals = ['bg', 'surface', 'surface-2', 'surface-3', 'border', 'text-faint', 'text-muted', 'text'];
</script>

<TopBar title="Design system" />

<div class="stack">
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

  <section>
    <h2>Couleurs</h2>
    <div class="swatches">
      {#each swatches as [name, key] (key)}
        <div class="sw-group">
          <span class="sw" style:background="var(--{key})"></span>
          <span class="sw" style:background="var(--{key}-soft)"></span>
          <span class="sw" style:background="var(--{key}-strong)"></span>
          <span class="sw-name">{name}</span>
        </div>
      {/each}
    </div>
    <div class="neutrals">
      {#each neutrals as n (n)}
        <span class="sw small" style:background="var(--{n})" title={n}></span>
      {/each}
    </div>
  </section>

  <section>
    <h2>Typographie</h2>
    <Logo size={40} />
    <p class="t-2xl">Quelle est la capitale du Japon ?</p>
    <p class="t-lg">Titre de section — Plus Jakarta Sans</p>
    <p>Texte courant : on apprend en jouant, avec des sessions courtes.</p>
    <p class="muted">Texte secondaire, plus discret.</p>
    <p class="num t-xl">1 234 · 98 %</p>
  </section>

  <section>
    <h2>Boutons</h2>
    <div class="row wrap">
      <Button>Principal</Button>
      <Button variant="secondary">Secondaire</Button>
      <Button variant="soft">Doux</Button>
      <Button variant="ghost">Discret</Button>
      <Button variant="danger">Réinitialiser</Button>
      <Button disabled>Désactivé</Button>
    </div>
    <Button size="lg" block>
      {#snippet icon()}<Play />{/snippet}
      Commencer
    </Button>
  </section>

  <section>
    <h2>Sélecteurs</h2>
    <Segmented
      label="Exemple"
      bind:value={seg}
      options={[
        { value: 'a', label: 'Facile', hint: '45 pays' },
        { value: 'b', label: 'Moyen', hint: '105 pays' },
        { value: 'c', label: 'Difficile', hint: '168 pays' },
        { value: 'd', label: 'Expert', hint: '195 pays' },
      ]}
    />
    <div class="row wrap">
      <Chip selected={chip} onclick={() => (chip = !chip)}>Europe</Chip>
      <Chip>Afrique</Chip>
      <Chip>Asie</Chip>
    </div>
  </section>

  <section>
    <h2>Réponses</h2>
    <div class="grid2">
      <ChoiceButton hint={1}>Tokyo</ChoiceButton>
      <ChoiceButton hint={2} status="correct">Ouagadougou</ChoiceButton>
      <ChoiceButton hint={3} status="wrong">Niamey</ChoiceButton>
      <ChoiceButton hint={4} status="reveal">Bamako</ChoiceButton>
    </div>
    <div class="grid4">
      <ChoiceButton variant="flag"><Flag iso2="td" width={96} /></ChoiceButton>
      <ChoiceButton variant="flag" status="correct"><Flag iso2="ro" width={96} /></ChoiceButton>
      <ChoiceButton variant="flag" status="wrong"><Flag iso2="ad" width={96} /></ChoiceButton>
      <ChoiceButton variant="flag" status="dim"><Flag iso2="md" width={96} /></ChoiceButton>
    </div>
    <TextAnswer bind:value={text} onsubmit={() => {}} />
    <TextAnswer value="Ouagadougu" status="typo" onsubmit={() => {}} disabled />
    <TextAnswer value="Niamey" status="wrong" onsubmit={() => {}} disabled />
  </section>

  <section>
    <h2>Progression</h2>
    <ProgressBar value={0.35} />
    <ProgressBar value={0.7} tone="green" />
    <ProgressBar value={0.2} tone="pink" />
    <div class="row">
      <Ring value={0.65}><span class="num ring-text">13</span></Ring>
      <Ring value={0.3} tone="violet" size={48} stroke={6} />
      <span class="streak"><Flame /> 4 jours</span>
      <Button variant="soft" size="sm" onclick={() => (score += 10)}>
        Score : <AnimatedNumber value={score} />
      </Button>
    </div>
    <div class="grid3">
      <StatTile label="Questions" tone="violet">312</StatTile>
      <StatTile label="Réussite" tone="green">84 %</StatTile>
      <StatTile label="Meilleure série" tone="pink">27</StatTile>
    </div>
  </section>

  <section>
    <h2>Cartes</h2>
    <Card tone="violet"><strong>Carte violette</strong><p class="muted">Pour les capitales.</p></Card>
    <Card tone="pink" onclick={() => {}}><strong>Carte cliquable</strong><p class="muted">Survole-moi.</p></Card>
  </section>
</div>

<style>
  .stack {
    display: grid;
    gap: 2rem;
  }
  section {
    display: grid;
    gap: 0.75rem;
  }
  h2 {
    font-size: var(--fs-sm);
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .wrap {
    flex-wrap: wrap;
  }
  .grid2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .grid3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .grid4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .swatches {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .sw-group {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .sw {
    height: 48px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .sw-name {
    grid-column: 1 / -1;
    font-size: var(--fs-sm);
    font-weight: 600;
  }
  .neutrals {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 4px;
  }
  .small {
    height: 28px;
  }
  .t-2xl {
    font-size: var(--fs-2xl);
    font-weight: 780;
    letter-spacing: -0.035em;
    line-height: 1.15;
  }
  .t-xl {
    font-size: var(--fs-xl);
    font-weight: 700;
  }
  .t-lg {
    font-size: var(--fs-lg);
    font-weight: 700;
  }
  .ring-text {
    font-weight: 750;
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: var(--pink-strong);
    font-weight: 700;
  }
  .streak :global(svg) {
    width: 18px;
  }
  @media (max-width: 520px) {
    .grid2,
    .grid3 {
      grid-template-columns: 1fr;
    }
    .grid4 {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
