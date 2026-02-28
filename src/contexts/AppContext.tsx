import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Subject, Habit, SessionLog, HabitLog } from '@/types';

interface AppState {
  subjects: Subject[];
  habits: Habit[];
  sessionLogs: SessionLog[];
  habitLogs: HabitLog[];
  addSubject: (subject: Subject) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (habit: Habit) => void;
  addSessionLog: (log: SessionLog) => void;
  addHabitLog: (log: HabitLog) => void;
  deleteSubject: (id: string) => void;
  deleteHabit: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subjects, setSubjects] = useState<Subject[]>(() => loadFromStorage('dt_subjects', []));
  const [habits, setHabits] = useState<Habit[]>(() => loadFromStorage('dt_habits', []));
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>(() => loadFromStorage('dt_session_logs', []));
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>(() => loadFromStorage('dt_habit_logs', []));

  useEffect(() => { localStorage.setItem('dt_subjects', JSON.stringify(subjects)); }, [subjects]);
  useEffect(() => { localStorage.setItem('dt_habits', JSON.stringify(habits)); }, [habits]);
  useEffect(() => { localStorage.setItem('dt_session_logs', JSON.stringify(sessionLogs)); }, [sessionLogs]);
  useEffect(() => { localStorage.setItem('dt_habit_logs', JSON.stringify(habitLogs)); }, [habitLogs]);

  const addSubject = useCallback((s: Subject) => setSubjects(prev => [...prev, s]), []);
  const addHabit = useCallback((h: Habit) => setHabits(prev => [...prev, h]), []);
  const updateHabit = useCallback((h: Habit) => setHabits(prev => prev.map(existing => existing.id === h.id ? h : existing)), []);
  const addSessionLog = useCallback((l: SessionLog) => setSessionLogs(prev => [...prev, l]), []);
  const addHabitLog = useCallback((l: HabitLog) => setHabitLogs(prev => [...prev, l]), []);
  const deleteSubject = useCallback((id: string) => setSubjects(prev => prev.filter(s => s.id !== id)), []);
  const deleteHabit = useCallback((id: string) => setHabits(prev => prev.filter(h => h.id !== id)), []);

  return (
    <AppContext.Provider value={{ subjects, habits, sessionLogs, habitLogs, addSubject, addHabit, updateHabit, addSessionLog, addHabitLog, deleteSubject, deleteHabit }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};
