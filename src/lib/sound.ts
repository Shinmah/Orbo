/**
 * Sons d'interface, synthétisés à la volée (Web Audio) : aucun fichier audio.
 *
 * Pensés pour être entendus des centaines de fois sans lasser :
 * - très courts (50 à 400 ms), ondes douces (sinus, triangle), aigus filtrés ;
 * - volume bas, compresseur pour éviter les pics quand deux sons se chevauchent ;
 * - légère variation de hauteur à chaque lecture, pour ne jamais rejouer exactement le même son.
 */
import { settings } from './settings.svelte';

interface Note {
  freq: number;
  /** Décalage de départ (s). */
  at?: number;
  /** Durée (s). */
  dur?: number;
  type?: OscillatorType;
  gain?: number;
  /** Glissement de fréquence jusqu'à cette valeur. */
  slide?: number;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let lastTap = 0;

function output(): AudioContext | null {
  if (typeof window === 'undefined' || settings.value.sound === 'off') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp).connect(ctx.destination);
  }
  master!.gain.value = settings.value.sound === 'soft' ? 0.35 : 0.7;
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function play(notes: Note[]) {
  const c = output();
  if (!c || !master) return;
  const start = c.currentTime + 0.005;
  const detune = (Math.random() - 0.5) * 36; // ± 18 cents
  for (const n of notes) {
    const t0 = start + (n.at ?? 0);
    const dur = n.dur ?? 0.12;
    const osc = c.createOscillator();
    osc.type = n.type ?? 'sine';
    osc.frequency.setValueAtTime(n.freq, t0);
    if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, t0 + dur);
    osc.detune.value = detune;

    const lowpass = c.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2400;

    const env = c.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(n.gain ?? 0.2, t0 + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(lowpass).connect(env).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
}

// Notes (Hz)
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const GS5 = 830.61;
const B5 = 987.77;
const C6 = 1046.5;

export const sound = {
  /** Clic sur un bouton : un petit « tic » feutré. */
  tap() {
    const now = performance.now();
    if (now - lastTap < 60) return;
    lastTap = now;
    play([{ freq: 540, slide: 430, dur: 0.05, gain: 0.16, type: 'triangle' }]);
  },
  /** Bonne réponse : deux notes montantes. */
  correct() {
    play([
      { freq: E5, dur: 0.14, gain: 0.2 },
      { freq: B5, at: 0.07, dur: 0.24, gain: 0.18 },
    ]);
  },
  /** Bonne réponse avec une faute de frappe : une seule note. */
  typo() {
    play([{ freq: E5, dur: 0.18, gain: 0.2 }]);
  },
  /** Mauvaise réponse : un « bonk » grave et doux, jamais strident. */
  wrong() {
    play([{ freq: 233, slide: 185, dur: 0.22, gain: 0.26, type: 'triangle' }]);
  },
  /** Saisie refusée (pays inconnu, interdit…). */
  nope() {
    play([
      { freq: 220, dur: 0.08, gain: 0.1, type: 'triangle' },
      { freq: 196, at: 0.08, dur: 0.12, gain: 0.09, type: 'triangle' },
    ]);
  },
  /** Pays ajouté au chemin. */
  pop(pitch = 1) {
    play([{ freq: 392 * pitch, slide: 523 * pitch, dur: 0.09, gain: 0.2 }]);
  },
  /** Série de 5, 10, 15… bonnes réponses. */
  streak() {
    play([
      { freq: E5, dur: 0.1, gain: 0.16 },
      { freq: GS5, at: 0.07, dur: 0.1, gain: 0.16 },
      { freq: B5, at: 0.14, dur: 0.26, gain: 0.16 },
    ]);
  },
  /** Fin de partie / chemin trouvé. */
  complete() {
    play([
      { freq: C5, dur: 0.16, gain: 0.18 },
      { freq: E5, at: 0.11, dur: 0.16, gain: 0.18 },
      { freq: G5, at: 0.22, dur: 0.16, gain: 0.18 },
      { freq: C6, at: 0.33, dur: 0.42, gain: 0.15 },
    ]);
  },
};
