const ALERT_SOUND_KEY = 'timer_alert_sound';

export interface AlertSound {
  id: string;
  name: string;
  emoji: string;
  file: string;
}

export const ALERT_SOUNDS: AlertSound[] = [
  { id: 'simple-notification', name: 'Simple Notification', emoji: '🔔', file: '/sounds/simple-notification.mp3' },
  { id: 'gentle-chime', name: 'Gentle Chime', emoji: '🎵', file: '/sounds/gentle-chime.mp3' },
  { id: 'bell-notification', name: 'Bell', emoji: '🛎️', file: '/sounds/bell-notification.mp3' },
  { id: 'achievement', name: 'Achievement', emoji: '🏆', file: '/sounds/achievement.mp3' },
  { id: 'correct-answer', name: 'Success Tone', emoji: '✅', file: '/sounds/correct-answer.mp3' },
  { id: 'alarm-clock', name: 'Alarm Clock', emoji: '⏰', file: '/sounds/alarm-clock.mp3' },
  { id: 'software-interface', name: 'Digital Alert', emoji: '💻', file: '/sounds/software-interface.mp3' },
  { id: 'message-pop', name: 'Message Pop', emoji: '💬', file: '/sounds/message-pop.mp3' },
  { id: 'none', name: 'No Sound', emoji: '🔇', file: '' },
];

export const getSelectedSound = (): string => {
  return localStorage.getItem(ALERT_SOUND_KEY) || 'simple-notification';
};

export const setSelectedSound = (id: string) => {
  localStorage.setItem(ALERT_SOUND_KEY, id);
};

export function playAlertSound(soundId?: string) {
  const id = soundId || getSelectedSound();
  if (id === 'none') return;

  const sound = ALERT_SOUNDS.find(s => s.id === id);
  if (!sound || !sound.file) return;

  try {
    const audio = new Audio(sound.file);
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch {
    // Audio playback not available
  }
}
