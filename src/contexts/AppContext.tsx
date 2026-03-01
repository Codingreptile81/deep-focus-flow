import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Subject, Habit, SessionLog, HabitLog, Task, TaskPriority } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AppState {
  subjects: Subject[];
  habits: Habit[];
  sessionLogs: SessionLog[];
  habitLogs: HabitLog[];
  tasks: Task[];
  loading: boolean;
  addSubject: (subject: Omit<Subject, 'id' | 'created_at'>) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => Promise<void>;
  updateHabit: (habit: Habit) => Promise<void>;
  addSessionLog: (log: Omit<SessionLog, 'id'>) => Promise<void>;
  addHabitLog: (log: Omit<HabitLog, 'id'>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  addTask: (task: { title: string; description?: string; scheduled_date?: string; start_time?: string; end_time?: string; priority: TaskPriority }) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data when user changes
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setHabits([]);
      setSessionLogs([]);
      setHabitLogs([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      setLoading(true);
      const [subRes, habRes, sesRes, hlRes, taskRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('user_id', user.id),
        supabase.from('habits').select('*').eq('user_id', user.id),
        supabase.from('session_logs').select('*').eq('user_id', user.id),
        supabase.from('habit_logs').select('*').eq('user_id', user.id),
        supabase.from('tasks').select('*').eq('user_id', user.id),
      ]);
      setSubjects((subRes.data as any[])?.map(r => ({ id: r.id, name: r.name, category: r.category, goal_hours: r.goal_hours ? Number(r.goal_hours) : undefined, color: r.color, created_at: r.created_at })) || []);
      setHabits((habRes.data as any[])?.map(r => ({ id: r.id, name: r.name, metric_type: r.metric_type, target_value: r.target_value ? Number(r.target_value) : undefined, color: r.color, icon: r.icon, created_at: r.created_at })) || []);
      setSessionLogs((sesRes.data as any[])?.map(r => ({ id: r.id, subject_id: r.subject_id, duration_minutes: r.duration_minutes, started_at: r.started_at, completed_at: r.completed_at, date: r.date })) || []);
      setHabitLogs((hlRes.data as any[])?.map(r => ({ id: r.id, habit_id: r.habit_id, value: Number(r.value), date: r.date, note: r.note })) || []);
      setTasks((taskRes.data as any[])?.map(r => ({ id: r.id, title: r.title, description: r.description, status: r.status, scheduled_date: r.scheduled_date, start_time: r.start_time, end_time: r.end_time, priority: r.priority, position: r.position, created_at: r.created_at })) || []);
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

  const addTask = useCallback(async (t: { title: string; description?: string; scheduled_date?: string; start_time?: string; end_time?: string; priority: TaskPriority }) => {
    if (!user) return;
    const { data, error } = await supabase.from('tasks').insert({ ...t, user_id: user.id, status: 'todo', position: 0 } as any).select().single();
    if (data && !error) {
      const r = data as any;
      setTasks(prev => [...prev, { id: r.id, title: r.title, description: r.description, status: r.status, scheduled_date: r.scheduled_date, start_time: r.start_time, end_time: r.end_time, priority: r.priority, position: r.position, created_at: r.created_at }]);
    }
  }, [user]);

  const updateTask = useCallback(async (t: Task) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').update({ title: t.title, description: t.description, status: t.status, scheduled_date: t.scheduled_date, start_time: t.start_time, end_time: t.end_time, priority: t.priority, position: t.position } as any).eq('id', t.id);
    if (!error) setTasks(prev => prev.map(existing => existing.id === t.id ? t : existing));
  }, [user]);

  const deleteTask = useCallback(async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) setTasks(prev => prev.filter(t => t.id !== id));
  }, [user]);

  return (
    <AppContext.Provider value={{ subjects, habits, sessionLogs, habitLogs, tasks, loading, addSubject, addHabit, updateHabit, addSessionLog, addHabitLog, deleteSubject, deleteHabit, addTask, updateTask, deleteTask }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
};
