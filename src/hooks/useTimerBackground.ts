import { useEffect, useRef } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const TIMER_STORAGE_KEY = 'pomodoro_timer_state';

interface TimerPersistState {
  focusTarget: { type: string; subjectId: string; taskId?: string } | null;
  durationMinutes: number;
  startedAt: string | null;
  isRunning: boolean;
  pausedSecondsLeft: number | null;
  onBreak: boolean;
  breakDurationMinutes: number;
  breakStartedAt: string | null;
}

/**
 * Background hook that checks if a timer expired while user was on another page.
 * Runs on mount of AppLayout (every page). Only fires completion if timer ended
 * and user is NOT on /timer (PomodoroTimer handles its own restore).
 */
export const useTimerBackground = () => {
  const { addSessionLog } = useAppState();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Skip if we're on the timer page — PomodoroTimer handles it
    if (window.location.pathname === '/timer') return;

    try {
      const raw = localStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return;
      const saved: TimerPersistState = JSON.parse(raw);

      // Check if break expired → study timer should have auto-resumed and may have also expired
      if (saved.onBreak && saved.breakStartedAt) {
        const breakElapsed = (Date.now() - new Date(saved.breakStartedAt).getTime()) / 1000;
        const breakDone = breakElapsed >= saved.breakDurationMinutes * 60;

        if (breakDone && saved.startedAt && saved.pausedSecondsLeft != null) {
          // Break ended, check if study timer also expired since then
          const breakEndTime = new Date(saved.breakStartedAt).getTime() + saved.breakDurationMinutes * 60000;
          const studyElapsedSinceBreak = (Date.now() - breakEndTime) / 1000;
          const studyRemaining = saved.pausedSecondsLeft - studyElapsedSinceBreak;

          if (studyRemaining <= 0 && saved.focusTarget) {
            // Both break and study completed
            localStorage.removeItem(TIMER_STORAGE_KEY);
            toast({ title: '🎉 Session Complete!', description: `Your ${saved.durationMinutes}-minute focus session has ended.` });
            addSessionLog({
              subject_id: saved.focusTarget.subjectId,
              task_id: saved.focusTarget.type === 'task' ? (saved.focusTarget as any).taskId : undefined,
              duration_minutes: saved.durationMinutes,
              started_at: saved.startedAt,
              completed_at: new Date(breakEndTime + saved.pausedSecondsLeft * 1000).toISOString(),
              date: format(new Date(saved.startedAt), 'yyyy-MM-dd'),
            });
          }
          return;
        }
      }

      // Check if running timer expired
      if (saved.isRunning && saved.startedAt) {
        const elapsed = (Date.now() - new Date(saved.startedAt).getTime()) / 1000;
        if (elapsed >= saved.durationMinutes * 60 && saved.focusTarget) {
          localStorage.removeItem(TIMER_STORAGE_KEY);
          toast({ title: '🎉 Session Complete!', description: `Your ${saved.durationMinutes}-minute focus session has ended.` });
          addSessionLog({
            subject_id: saved.focusTarget.subjectId,
            task_id: saved.focusTarget.type === 'task' ? (saved.focusTarget as any).taskId : undefined,
            duration_minutes: saved.durationMinutes,
            started_at: saved.startedAt,
            completed_at: new Date(new Date(saved.startedAt).getTime() + saved.durationMinutes * 60000).toISOString(),
            date: format(new Date(saved.startedAt), 'yyyy-MM-dd'),
          });
        }
      }
    } catch {}
  }, []);
};
