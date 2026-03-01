export type SubjectCategory = 'study' | 'skill';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskRecurrence = 'daily' | 'weekly' | null;

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  priority: TaskPriority;
  position: number;
  recurrence?: TaskRecurrence;
  created_at: string;
}
export type MetricType = 'binary' | 'count' | 'minutes';

export interface Subject {
  id: string;
  name: string;
  category: SubjectCategory;
  goal_hours?: number;
  color: string;
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  metric_type: MetricType;
  target_value?: number;
  color: string;
  icon: string;
  created_at: string;
}

export const HABIT_ICONS = [
  'book-open', 'dumbbell', 'heart', 'brain', 'coffee', 'droplets',
  'sun', 'moon', 'apple', 'pencil', 'music', 'code',
  'target', 'zap', 'flame', 'leaf', 'eye', 'smile',
  'run', 'bed', 'glass-water', 'salad', 'pill', 'bike',
] as const;

export const HABIT_COLOR_OPTIONS = [
  { name: 'Blue', value: 'habit-blue', hex: 'hsl(210, 80%, 55%)' },
  { name: 'Green', value: 'habit-green', hex: 'hsl(160, 60%, 45%)' },
  { name: 'Orange', value: 'habit-orange', hex: 'hsl(30, 90%, 56%)' },
  { name: 'Pink', value: 'habit-pink', hex: 'hsl(340, 65%, 55%)' },
  { name: 'Purple', value: 'habit-purple', hex: 'hsl(270, 60%, 55%)' },
  { name: 'Teal', value: 'habit-teal', hex: 'hsl(180, 55%, 45%)' },
  { name: 'Red', value: 'habit-red', hex: 'hsl(0, 72%, 51%)' },
  { name: 'Amber', value: 'habit-amber', hex: 'hsl(45, 93%, 47%)' },
  { name: 'Indigo', value: 'habit-indigo', hex: 'hsl(245, 58%, 51%)' },
  { name: 'Emerald', value: 'habit-emerald', hex: 'hsl(152, 69%, 31%)' },
] as const;

export interface SessionLog {
  id: string;
  subject_id: string;
  duration_minutes: number;
  started_at: string;
  completed_at: string;
  date: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  value: number;
  date: string;
  note?: string;
}

export const SUBJECT_COLORS = [
  'subject-blue',
  'subject-green',
  'subject-orange',
  'subject-pink',
  'subject-purple',
  'subject-teal',
] as const;

export const SUBJECT_COLOR_MAP: Record<string, string> = {
  'subject-blue': 'hsl(210, 80%, 55%)',
  'subject-green': 'hsl(160, 60%, 45%)',
  'subject-orange': 'hsl(30, 90%, 56%)',
  'subject-pink': 'hsl(340, 65%, 55%)',
  'subject-purple': 'hsl(270, 60%, 55%)',
  'subject-teal': 'hsl(180, 55%, 45%)',
};
