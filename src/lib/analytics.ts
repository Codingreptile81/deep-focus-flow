import { SessionLog, HabitLog, Subject, Habit, Task } from '@/types';
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns';

const today = () => format(new Date(), 'yyyy-MM-dd');

export const getTodayStudyMinutes = (logs: SessionLog[]): number =>
  logs.filter(l => l.date === today()).reduce((sum, l) => sum + l.duration_minutes, 0);

export const getSubjectTotalMinutes = (logs: SessionLog[], subjectId: string): number =>
  logs.filter(l => l.subject_id === subjectId).reduce((sum, l) => sum + l.duration_minutes, 0);

export const getSubjectTodayMinutes = (logs: SessionLog[], subjectId: string): number =>
  logs.filter(l => l.subject_id === subjectId && l.date === today()).reduce((sum, l) => sum + l.duration_minutes, 0);

export const getWeeklyStudyData = (logs: SessionLog[], subjects: Subject[]) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayName = format(subDays(new Date(), 6 - i), 'EEE');
    const minutes = logs.filter(l => l.date === date).reduce((s, l) => s + l.duration_minutes, 0);
    return { day: dayName, date, minutes };
  });
};

export const getSubjectDistribution = (logs: SessionLog[], subjects: Subject[]) => {
  return subjects.map(s => ({
    name: s.name,
    value: getSubjectTotalMinutes(logs, s.id),
    color: s.color,
  })).filter(s => s.value > 0);
};

export const getHabitStreak = (logs: HabitLog[], habitId: string): number => {
  const habitLogs = logs.filter(l => l.habit_id === habitId);
  const dates = [...new Set(habitLogs.map(l => l.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  const todayStr = today();
  let checkDate = todayStr;
  for (let i = 0; i < 365; i++) {
    if (dates.includes(checkDate)) {
      streak++;
      checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd');
    } else if (i === 0) {
      checkDate = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      continue;
    } else {
      break;
    }
  }
  return streak;
};

export const getHabitCompletionRate = (logs: HabitLog[], habitId: string): number => {
  const habitLogs = logs.filter(l => l.habit_id === habitId);
  if (habitLogs.length === 0) return 0;
  const dates = [...new Set(habitLogs.map(l => l.date))];
  const firstDate = dates.sort()[0];
  const totalDays = differenceInCalendarDays(new Date(), parseISO(firstDate)) + 1;
  return Math.round((dates.length / totalDays) * 100);
};

export const getWeeklyHabitData = (logs: HabitLog[], habits: Habit[]) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayName = format(subDays(new Date(), 6 - i), 'EEE');
    const completed = habits.filter(h => logs.some(l => l.habit_id === h.id && l.date === date)).length;
    return { day: dayName, date, completed, total: habits.length };
  });
};

export const getMostFocusedSubject = (logs: SessionLog[], subjects: Subject[]): Subject | null => {
  const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
  const recentLogs = logs.filter(l => l.date >= weekAgo);
  if (recentLogs.length === 0 || subjects.length === 0) return null;
  const subjectMinutes = subjects.map(s => ({
    subject: s,
    minutes: recentLogs.filter(l => l.subject_id === s.id).reduce((sum, l) => sum + l.duration_minutes, 0),
  }));
  const max = subjectMinutes.reduce((a, b) => (a.minutes > b.minutes ? a : b));
  return max.minutes > 0 ? max.subject : null;
};

export const getBestDayOfWeek = (logs: SessionLog[]): string => {
  const dayTotals: Record<string, number[]> = {};
  logs.forEach(l => {
    const day = format(parseISO(l.date), 'EEEE');
    if (!dayTotals[day]) dayTotals[day] = [];
    dayTotals[day].push(l.duration_minutes);
  });
  let bestDay = 'N/A';
  let bestAvg = 0;
  Object.entries(dayTotals).forEach(([day, mins]) => {
    const avg = mins.reduce((a, b) => a + b, 0) / mins.length;
    if (avg > bestAvg) { bestAvg = avg; bestDay = day; }
  });
  return bestDay;
};

export const getSubjectLevel = (totalMinutes: number): { level: number; title: string } => {
  if (totalMinutes >= 6000) return { level: 10, title: 'Master' };
  if (totalMinutes >= 3000) return { level: 8, title: 'Expert' };
  if (totalMinutes >= 1500) return { level: 6, title: 'Advanced' };
  if (totalMinutes >= 600) return { level: 4, title: 'Intermediate' };
  if (totalMinutes >= 120) return { level: 2, title: 'Beginner' };
  return { level: 1, title: 'Novice' };
};

export const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
};

export const getMonthlyStudyData = (logs: SessionLog[]) => {
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    const month = format(date, 'yyyy-MM');
    const label = format(date, 'MMM');
    const minutes = logs.filter(l => l.date.startsWith(month)).reduce((s, l) => s + l.duration_minutes, 0);
    return { date: label, minutes };
  });
};

// ═══════════════════════════════════════════
// V2 Analytics: Task, Kanban, Planning
// ═══════════════════════════════════════════

export const getTimePerTask = (logs: SessionLog[], tasks: Task[]) => {
  return tasks.map(t => ({
    id: t.id,
    title: t.title,
    minutes: logs.filter(l => l.task_id === t.id).reduce((s, l) => s + l.duration_minutes, 0),
  })).filter(t => t.minutes > 0);
};

export const getTodosCompletedPerDay = (tasks: Task[]) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const dayName = format(subDays(new Date(), 6 - i), 'EEE');
    // We don't have completed_at on tasks so we approximate with scheduled_date for done tasks
    const completed = tasks.filter(t => t.status === 'done' && t.scheduled_date === date).length;
    return { day: dayName, completed };
  });
};

export const getTodoCompletionRate = (tasks: Task[]): number => {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(t => t.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
};

export const getOverdueTodos = (tasks: Task[]): Task[] => {
  const todayStr = today();
  return tasks.filter(t => t.status !== 'done' && t.scheduled_date && t.scheduled_date < todayStr);
};

export const getCardsCompletedPerWeek = (tasks: Task[]) => {
  return Array.from({ length: 4 }, (_, i) => {
    const weekEnd = subDays(new Date(), i * 7);
    const weekStart = subDays(weekEnd, 6);
    const startStr = format(weekStart, 'yyyy-MM-dd');
    const endStr = format(weekEnd, 'yyyy-MM-dd');
    const label = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
    const completed = tasks.filter(t => t.status === 'done' && t.scheduled_date && t.scheduled_date >= startStr && t.scheduled_date <= endStr).length;
    return { week: label, completed };
  }).reverse();
};

export const getWIPCount = (tasks: Task[]): number =>
  tasks.filter(t => t.status === 'in_progress').length;

export const getTimePerColumn = (logs: SessionLog[], tasks: Task[]) => {
  const columns = ['todo', 'in_progress', 'done'] as const;
  return columns.map(status => {
    const colTaskIds = tasks.filter(t => t.status === status).map(t => t.id);
    const minutes = logs.filter(l => l.task_id && colTaskIds.includes(l.task_id)).reduce((s, l) => s + l.duration_minutes, 0);
    return { column: status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done', minutes };
  });
};

export const getPlannedVsActual = (tasks: Task[]) => {
  const planned = tasks.reduce((s, t) => s + (t.estimate_minutes || 0), 0);
  const actual = tasks.reduce((s, t) => s + t.actual_minutes, 0);
  return { planned, actual };
};

export const getFocusAccuracy = (tasks: Task[]): number => {
  const { planned, actual } = getPlannedVsActual(tasks);
  if (planned === 0) return 0;
  return Math.round((actual / planned) * 100);
};

export const getEstimateAccuracy = (tasks: Task[]) => {
  return tasks
    .filter(t => t.estimate_minutes && t.estimate_minutes > 0 && t.actual_minutes > 0)
    .map(t => ({
      title: t.title,
      estimate: t.estimate_minutes!,
      actual: t.actual_minutes,
      accuracy: Math.round((t.actual_minutes / t.estimate_minutes!) * 100),
    }));
};
