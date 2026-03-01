import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Subject, Habit, SessionLog, HabitLog, Task, TaskPriority, TaskRecurrence } from '@/types';
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
  addTask: (task: { title: string; description?: string; scheduled_date?: string; deadline?: string; start_time?: string; end_time?: string; priority: TaskPriority; recurrence?: TaskRecurrence; subject_id?: string; estimate_minutes?: number }) => Promise<void>;
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
      setSessionLogs((sesRes.data as any[])?.map(r => ({ id: r.id, subject_id: r.subject_id, task_id: r.task_id || undefined, duration_minutes: r.duration_minutes, started_at: r.started_at, completed_at: r.completed_at, date: r.date })) || []);
      setHabitLogs((hlRes.data as any[])?.map(r => ({ id: r.id, habit_id: r.habit_id, value: Number(r.value), date: r.date, note: r.note })) || []);
      setTasks((taskRes.data as any[])?.map(r => ({ id: r.id, title: r.title, description: r.description, status: r.status, scheduled_date: r.scheduled_date, deadline: r.deadline || undefined, start_time: r.start_time, end_time: r.end_time, priority: r.priority, position: r.position, recurrence: r.recurrence, subject_id: r.subject_id || undefined, estimate_minutes: r.estimate_minutes ? Number(r.estimate_minutes) : undefined, actual_minutes: Number(r.actual_minutes) || 0, created_at: r.created_at })) || []);
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
    const insertData: any = { subject_id: l.subject_id, duration_minutes: l.duration_minutes, started_at: l.started_at, completed_at: l.completed_at, date: l.date, user_id: user.id };
    if (l.task_id) insertData.task_id = l.task_id;
    const { data, error } = await supabase.from('session_logs').insert(insertData).select().single();
    if (data && !error) {
      const r = data as any;
      setSessionLogs(prev => [...prev, { id: r.id, subject_id: r.subject_id, task_id: r.task_id || undefined, duration_minutes: r.duration_minutes, started_at: r.started_at, completed_at: r.completed_at, date: r.date }]);

      // Update task actual_minutes if linked
      if (l.task_id) {
        const task = tasks.find(t => t.id === l.task_id);
        if (task) {
          const newActual = task.actual_minutes + l.duration_minutes;
          await supabase.from('tasks').update({ actual_minutes: newActual } as any).eq('id', l.task_id);
          setTasks(prev => prev.map(t => t.id === l.task_id ? { ...t, actual_minutes: newActual } : t));
        }
      }
    }
  }, [user, tasks]);

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

  const addTask = useCallback(async (t: { title: string; description?: string; scheduled_date?: string; deadline?: string; start_time?: string; end_time?: string; priority: TaskPriority; recurrence?: TaskRecurrence; subject_id?: string; estimate_minutes?: number }) => {
    if (!user) return;
    const insertData: any = { title: t.title, user_id: user.id, status: 'todo', position: 0, priority: t.priority };
    if (t.description) insertData.description = t.description;
    if (t.scheduled_date) insertData.scheduled_date = t.scheduled_date;
    if (t.deadline) insertData.deadline = t.deadline;
    if (t.start_time) insertData.start_time = t.start_time;
    if (t.end_time) insertData.end_time = t.end_time;
    if (t.recurrence) insertData.recurrence = t.recurrence;
    if (t.subject_id) insertData.subject_id = t.subject_id;
    if (t.estimate_minutes) insertData.estimate_minutes = t.estimate_minutes;
    const { data, error } = await supabase.from('tasks').insert(insertData).select().single();
    if (data && !error) {
      const r = data as any;
      setTasks(prev => [...prev, { id: r.id, title: r.title, description: r.description, status: r.status, scheduled_date: r.scheduled_date, deadline: r.deadline || undefined, start_time: r.start_time, end_time: r.end_time, priority: r.priority, position: r.position, recurrence: r.recurrence, subject_id: r.subject_id || undefined, estimate_minutes: r.estimate_minutes ? Number(r.estimate_minutes) : undefined, actual_minutes: Number(r.actual_minutes) || 0, created_at: r.created_at }]);
    }
  }, [user]);

  const updateTask = useCallback(async (t: Task) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').update({ title: t.title, description: t.description, status: t.status, scheduled_date: t.scheduled_date, deadline: t.deadline || null, start_time: t.start_time, end_time: t.end_time, priority: t.priority, position: t.position, recurrence: t.recurrence, subject_id: t.subject_id || null, estimate_minutes: t.estimate_minutes || null, actual_minutes: t.actual_minutes } as any).eq('id', t.id);
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
