import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Subject, Habit, SessionLog, HabitLog } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  subjects: Subject[];
  habits: Habit[];
  sessionLogs: SessionLog[];
  habitLogs: HabitLog[];
  loading: boolean;
  addSubject: (subject: Omit<Subject, 'id' | 'created_at'>) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  addSessionLog: (log: Omit<SessionLog, 'id'>) => Promise<void>;
  addHabitLog: (log: Omit<HabitLog, 'id'>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data when user changes
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setHabits([]);
      setSessionLogs([]);
      setHabitLogs([]);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      const [subRes, habRes, sesRes, hlRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('session_logs').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('*').eq('user_id', user.id),
      ]);
      setSubjects((subRes.data as any[])?.map(r => ({ id: r.id, name: r.name, category: r.category, goal_hours: r.goal_hours ? Number(r.goal_hours) : undefined, color: r.color, created_at: r.created_at })) || []);
      setHabits((habRes.data as any[])?.map(r => ({ id: r.id, name: r.name, metric_type: r.metric_type, target_value: r.target_value ? Number(r.target_value) : undefined, color: r.color, icon: r.icon, created_at: r.created_at })) || []);
      setSessionLogs((sesRes.data as any[])?.map(r => ({ id: r.id, subject_id: r.subject_id, duration_minutes: r.duration_minutes, started_at: r.started_at, completed_at: r.completed_at, date: r.date })) || []);
      setHabitLogs((hlRes.data as any[])?.map(r => ({ id: r.id, habit_id: r.habit_id, value: Number(r.value), date: r.date, note: r.note })) || []);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const addSubject = useCallback(async (s: Omit<Subject, 'id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('subjects').insert({ ...s, user_id: user.id } as any).select().single();
    if (data && !error) {
      const r = data as any;
      setSubjects(prev => [...prev, { id: r.id, name: r.name, category: r.category, goal_hours: r.goal_hours ? Number(r.goal_hours) : undefined, color: r.color, created_at: r.created_at }]);
    }
  }, [user]);

  const addHabit = useCallback(async (h: Omit<Habit, 'id' | 'created_at'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('habits').insert({ ...h, user_id: user.id } as any).select().single();
    if (data && !error) {
      const r = data as any;
      setHabits(prev => [...prev, { id: r.id, name: r.name, metric_type: r.metric_type, target_value: r.target_value ? Number(r.target_value) : undefined, color: r.color, icon: r.icon, created_at: r.created_at }]);
    }
  }, [user]);

  const updateHabit = useCallback(async (h: Habit) => {
    if (!user) return;
    const { error } = await supabase.from('habits').update({ name: h.name, metric_type: h.metric_type, target_value: h.target_value, color: h.color, icon: h.icon } as any).eq('id', h.id);
    if (!error) setHabits(prev => prev.map(existing => existing.id === h.id ? h : existing));
  }, [user]);

  const addSessionLog = useCallback(async (l: Omit<SessionLog, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('session_logs').insert({ ...l, user_id: user.id } as any).select().single();
    if (data && !error) {
      const r = data as any;
      setSessionLogs(prev => [...prev, { id: r.id, subject_id: r.subject_id, duration_minutes: r.duration_minutes, started_at: r.started_at, completed_at: r.completed_at, date: r.date }]);
    }
  }, [user]);

  const addHabitLog = useCallback(async (l: Omit<HabitLog, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('habit_logs').insert({ ...l, user_id: user.id } as any).select().single();
    if (data && !error) {
      const r = data as any;
      setHabitLogs(prev => [...prev, { id: r.id, habit_id: r.habit_id, value: Number(r.value), date: r.date, note: r.note }]);
    }
  }, [user]);

  const deleteSubject = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (!error) setSubjects(prev => prev.filter(s => s.id !== id));
  }, [user]);

  const deleteHabit = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('habits').delete().eq('id', id);
    if (!error) setHabits(prev => prev.filter(h => h.id !== id));
  }, [user]);

  return (
    <AppContext.Provider value={{ subjects, habits, sessionLogs, habitLogs, loading, addSubject, addHabit, updateHabit, addSessionLog, addHabitLog, deleteSubject, deleteHabit }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};
