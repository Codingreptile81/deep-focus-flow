const ALERT_SOUND_KEY = 'timer_alert_sound';

export interface AlertSound {
  id: string;
  name: string;
  emoji: string;
}

export const ALERT_SOUNDS: AlertSound[] = [
  { id: 'bell', name: 'Classic Bell', emoji: '🔔' },
  { id: 'chime', name: 'Gentle Chime', emoji: '🎵' },
  { id: 'gong', name: 'Deep Gong', emoji: '🎶' },
  { id: 'bright', name: 'Bright Ping', emoji: '✨' },
  { id: 'harp', name: 'Harp Arpeggio', emoji: '🎻' },
  { id: 'marimba', name: 'Marimba Pop', emoji: '🥁' },
  { id: 'triumph', name: 'Triumph Fanfare', emoji: '🏆' },
  { id: 'zen', name: 'Zen Bowl', emoji: '🧘' },
  { id: 'retro', name: 'Retro Beep', emoji: '👾' },
  { id: 'none', name: 'No Sound', emoji: '🔇' },
];

export const getSelectedSound = (): string => {
  return localStorage.getItem(ALERT_SOUND_KEY) || 'bell';
};

export const setSelectedSound = (id: string) => {
  localStorage.setItem(ALERT_SOUND_KEY, id);
};

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3, delay = 0) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  g.gain.setValueAtTime(gain, ctx.currentTime + delay);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

export function playAlertSound(soundId?: string) {
  const id = soundId || getSelectedSound();
  if (id === 'none') return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    switch (id) {
      case 'bell':
        playTone(830, 0.8, 'sine', 0.35);
        playTone(830, 0.5, 'sine', 0.15, 0.3);
        playTone(1046, 0.6, 'sine', 0.2, 0.6);
        break;

      case 'chime':
        playTone(523, 0.6, 'sine', 0.25);
        playTone(659, 0.6, 'sine', 0.25, 0.2);
        playTone(784, 0.8, 'sine', 0.3, 0.4);
        break;

      case 'gong':
        playTone(130, 2.5, 'sine', 0.4);
        playTone(260, 1.5, 'sine', 0.15, 0.05);
        playTone(65, 3, 'sine', 0.2, 0.1);
        break;

      case 'bright':
        playTone(1200, 0.15, 'square', 0.15);
        playTone(1600, 0.15, 'square', 0.15, 0.15);
        playTone(2000, 0.3, 'square', 0.2, 0.3);
        break;

      case 'harp':
        [523, 659, 784, 1046, 1318].forEach((f, i) => {
          playTone(f, 1.2, 'sine', 0.2, i * 0.12);
        });
        break;

      case 'marimba':
        playTone(440, 0.2, 'triangle', 0.35);
        playTone(554, 0.2, 'triangle', 0.35, 0.15);
        playTone(659, 0.3, 'triangle', 0.35, 0.3);
        playTone(880, 0.4, 'triangle', 0.3, 0.45);
        break;

      case 'triumph':
        playTone(392, 0.25, 'sawtooth', 0.12);
        playTone(523, 0.25, 'sawtooth', 0.12, 0.25);
        playTone(659, 0.25, 'sawtooth', 0.12, 0.5);
        playTone(784, 0.5, 'sawtooth', 0.15, 0.75);
        break;

      case 'zen': {
        const ctx2 = getAudioContext();
        const osc = ctx2.createOscillator();
        const g = ctx2.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(285, ctx2.currentTime);
        osc.frequency.exponentialRampToValueAtTime(290, ctx2.currentTime + 3);
        g.gain.setValueAtTime(0, ctx2.currentTime);
        g.gain.linearRampToValueAtTime(0.3, ctx2.currentTime + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, ctx2.currentTime + 3);
        osc.connect(g);
        g.connect(ctx2.destination);
        osc.start();
        osc.stop(ctx2.currentTime + 3);
        break;
      }

      case 'retro':
        playTone(440, 0.1, 'square', 0.2);
        playTone(880, 0.1, 'square', 0.2, 0.12);
        playTone(440, 0.1, 'square', 0.2, 0.24);
        playTone(880, 0.15, 'square', 0.25, 0.36);
        break;

      default:
        playTone(830, 0.8, 'sine', 0.35);
    }
  } catch {
    // Web Audio API not available
  }
}
