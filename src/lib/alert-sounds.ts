const ALERT_SOUND_KEY = 'timer_alert_sound';

export interface AlertSound {
  id: string;
  name: string;
  play: () => void;
}

const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

function playTones(notes: { freq: number; start: number; dur: number; type?: OscillatorType; gain?: number }[]) {
  const ctx = audioCtx();
  notes.forEach(({ freq, start, dur, type = 'sine', gain: vol = 0.3 }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  });
}

// macOS-inspired synthesized alert sounds
const soundGenerators: Record<string, () => void> = {
  boop: () => playTones([
    { freq: 1200, start: 0, dur: 0.08, gain: 0.35 },
    { freq: 800, start: 0.05, dur: 0.15, gain: 0.25 },
  ]),
  breeze: () => playTones([
    { freq: 600, start: 0, dur: 0.3, type: 'triangle', gain: 0.2 },
    { freq: 900, start: 0.1, dur: 0.3, type: 'triangle', gain: 0.15 },
    { freq: 1200, start: 0.2, dur: 0.4, type: 'triangle', gain: 0.1 },
  ]),
  bubble: () => {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  },
  crystal: () => playTones([
    { freq: 2200, start: 0, dur: 0.4, type: 'sine', gain: 0.15 },
    { freq: 3300, start: 0.02, dur: 0.35, type: 'sine', gain: 0.1 },
    { freq: 4400, start: 0.04, dur: 0.5, type: 'sine', gain: 0.08 },
  ]),
  funky: () => playTones([
    { freq: 500, start: 0, dur: 0.1, type: 'square', gain: 0.15 },
    { freq: 700, start: 0.08, dur: 0.1, type: 'square', gain: 0.15 },
    { freq: 900, start: 0.16, dur: 0.1, type: 'square', gain: 0.15 },
    { freq: 1200, start: 0.24, dur: 0.15, type: 'square', gain: 0.12 },
  ]),
  heroine: () => playTones([
    { freq: 880, start: 0, dur: 0.2, gain: 0.25 },
    { freq: 1100, start: 0.15, dur: 0.2, gain: 0.2 },
    { freq: 1320, start: 0.3, dur: 0.3, gain: 0.25 },
  ]),
  jump: () => {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  },
  mezzo: () => playTones([
    { freq: 660, start: 0, dur: 0.15, type: 'triangle', gain: 0.3 },
    { freq: 880, start: 0.12, dur: 0.15, type: 'triangle', gain: 0.25 },
    { freq: 660, start: 0.24, dur: 0.2, type: 'triangle', gain: 0.2 },
  ]),
  pebble: () => playTones([
    { freq: 1800, start: 0, dur: 0.06, gain: 0.25 },
    { freq: 1400, start: 0.08, dur: 0.1, gain: 0.2 },
  ]),
  pluck: () => {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  },
  pong: () => playTones([
    { freq: 1000, start: 0, dur: 0.08, gain: 0.3 },
    { freq: 1500, start: 0.1, dur: 0.08, gain: 0.25 },
  ]),
  sonar: () => playTones([
    { freq: 1200, start: 0, dur: 0.5, type: 'sine', gain: 0.2 },
    { freq: 1200, start: 0.6, dur: 0.5, type: 'sine', gain: 0.15 },
  ]),
  sonumi: () => playTones([
    { freq: 523, start: 0, dur: 0.15, gain: 0.25 },
    { freq: 659, start: 0.12, dur: 0.15, gain: 0.25 },
    { freq: 784, start: 0.24, dur: 0.25, gain: 0.3 },
  ]),
  submerge: () => {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  },
};

export const ALERT_SOUNDS: AlertSound[] = [
  { id: 'boop', name: 'Boop', play: soundGenerators.boop },
  { id: 'breeze', name: 'Breeze', play: soundGenerators.breeze },
  { id: 'bubble', name: 'Bubble', play: soundGenerators.bubble },
  { id: 'crystal', name: 'Crystal', play: soundGenerators.crystal },
  { id: 'funky', name: 'Funky', play: soundGenerators.funky },
  { id: 'heroine', name: 'Heroine', play: soundGenerators.heroine },
  { id: 'jump', name: 'Jump', play: soundGenerators.jump },
  { id: 'mezzo', name: 'Mezzo', play: soundGenerators.mezzo },
  { id: 'pebble', name: 'Pebble', play: soundGenerators.pebble },
  { id: 'pluck', name: 'Pluck', play: soundGenerators.pluck },
  { id: 'pong', name: 'Pong', play: soundGenerators.pong },
  { id: 'sonar', name: 'Sonar', play: soundGenerators.sonar },
  { id: 'sonumi', name: 'Sonumi', play: soundGenerators.sonumi },
  { id: 'submerge', name: 'Submerge', play: soundGenerators.submerge },
];

export const getSelectedSound = (): string => {
  return localStorage.getItem(ALERT_SOUND_KEY) || 'boop';
};

export const setSelectedSound = (id: string) => {
  localStorage.setItem(ALERT_SOUND_KEY, id);
};

export function playAlertSound(soundId?: string) {
  const id = soundId || getSelectedSound();
  const sound = ALERT_SOUNDS.find(s => s.id === id);
  if (!sound) return;
  try {
    sound.play();
  } catch {
    // Audio not available
  }
}
