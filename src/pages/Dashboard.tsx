import React, { useMemo } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLOR_MAP, HABIT_COLOR_OPTIONS } from '@/types';
import { getTodayStudyMinutes, formatMinutes, getHabitStreak, getWeeklyStudyData, getWeeklyHabitData } from '@/lib/analytics';
import { getHabitIcon } from '@/lib/habit-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Timer, CheckSquare, Flame, Clock, ArrowRight, Zap, Trophy, Award, Star, Shield, TrendingUp, AlertTriangle, CalendarClock } from 'lucide-react';
import { format, subDays, isBefore, startOfDay, parseISO, addDays } from 'date-fns';

// Badge definitions
const STREAK_BADGES = [
  { threshold: 3, label: 'Starter', icon: Star, color: 'hsl(30, 90%, 56%)' },
  { threshold: 7, label: 'On Fire', icon: Flame, color: 'hsl(0, 72%, 51%)' },
  { threshold: 14, label: 'Committed', icon: Shield, color: 'hsl(210, 80%, 55%)' },
  { threshold: 30, label: 'Champion', icon: Trophy, color: 'hsl(270, 60%, 55%)' },
  { threshold: 60, label: 'Legend', icon: Award, color: 'hsl(45, 93%, 47%)' },
];

const getStreakBadge = (streak: number) => {
  for (let i = STREAK_BADGES.length - 1; i >= 0; i--) {
    if (streak >= STREAK_BADGES[i].threshold) return STREAK_BADGES[i];
  }
  return null;
};

const DashboardPage: React.FC = () => {
  const { subjects, habits, sessionLogs, habitLogs, tasks } = useAppState();
  const todayMinutes = getTodayStudyMinutes(sessionLogs);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessionLogs.filter(l => l.date === todayStr);
  const completedHabitsToday = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === todayStr));
  const weeklyData = getWeeklyStudyData(sessionLogs, subjects);

  const totalStreak = habits.length > 0
    ? Math.max(...habits.map(h => getHabitStreak(habitLogs, h.id)), 0)
    : 0;

  const weekTotal = weeklyData.reduce((s, d) => s + d.minutes, 0);

  const getColorHex = (colorValue: string) => {
    const found = HABIT_COLOR_OPTIONS.find(c => c.value === colorValue);
    return found?.hex || 'hsl(210, 80%, 55%)';
  };

  // Weekly consistency: how many days in last 7 had ALL habits completed
  const weeklyConsistency = useMemo(() => {
    if (habits.length === 0) return { score: 0, daysComplete: 0, totalDays: 7 };
    let daysComplete = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const allDone = habits.every(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr));
      if (allDone) daysComplete++;
    }
    return { score: Math.round((daysComplete / 7) * 100), daysComplete, totalDays: 7 };
  }, [habits, habitLogs]);

  // Habit streaks with badges
  const habitStreaks = useMemo(() => {
    return habits.map(h => ({
      habit: h,
      streak: getHabitStreak(habitLogs, h.id),
      badge: getStreakBadge(getHabitStreak(habitLogs, h.id)),
    })).sort((a, b) => b.streak - a.streak);
  }, [habits, habitLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(new Date(), 'EEEE, MMMM d')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Today's Study</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="stat-value animate-count-up">{formatMinutes(todayMinutes)}</div>
          <div className="text-xs text-muted-foreground mt-1">{todaySessions.length} sessions</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Habits Today</span>
            <CheckSquare className="h-4 w-4 text-success" />
          </div>
          <div className="stat-value animate-count-up">{completedHabitsToday.length}/{habits.length}</div>
          <div className="text-xs text-muted-foreground mt-1">completed</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Best Streak</span>
            <Flame className="h-4 w-4 text-warning" />
          </div>
          <div className="stat-value animate-count-up">{totalStreak}</div>
          <div className="text-xs text-muted-foreground mt-1">days</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-medium">Weekly Consistency</span>
            <TrendingUp className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="stat-value animate-count-up">{weeklyConsistency.score}%</div>
          <div className="text-xs text-muted-foreground mt-1">{weeklyConsistency.daysComplete}/7 perfect days</div>
        </Card>
      </div>

      {/* Overdue & Upcoming Deadlines */}
      {tasks.length > 0 && (() => {
        const today = startOfDay(new Date());
        const overdueTasks = tasks.filter(t => t.status !== 'done' && t.scheduled_date && isBefore(parseISO(t.scheduled_date), today));
        const next7 = addDays(today, 7);
        const upcomingTasks = tasks.filter(t => {
          if (t.status === 'done' || !t.scheduled_date) return false;
          const d = parseISO(t.scheduled_date);
          return !isBefore(d, today) && isBefore(d, next7);
        }).sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!));

        if (overdueTasks.length === 0 && upcomingTasks.length === 0) return null;

        return (
          <div className="grid gap-4 sm:grid-cols-2">
            {overdueTasks.length > 0 && (
              <Card className="p-5 border-destructive/30">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <h3 className="font-semibold text-sm">Overdue ({overdueTasks.length})</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {overdueTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-destructive/5">
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      <span className="text-xs text-destructive font-mono ml-2">{t.scheduled_date}</span>
                    </div>
                  ))}
                  {overdueTasks.length > 5 && (
                    <Link to="/planner" className="text-xs text-destructive hover:underline">+{overdueTasks.length - 5} more</Link>
                  )}
                </div>
              </Card>
            )}
            {upcomingTasks.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Upcoming (7 days)</h3>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {upcomingTasks.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-muted/50">
                      <span className="text-sm truncate flex-1">{t.title}</span>
                      <span className="text-xs text-muted-foreground font-mono ml-2">{format(parseISO(t.scheduled_date!), 'EEE, MMM d')}</span>
                    </div>
                  ))}
                  {upcomingTasks.length > 5 && (
                    <Link to="/planner" className="text-xs text-primary hover:underline">+{upcomingTasks.length - 5} more</Link>
                  )}
                </div>
              </Card>
            )}
          </div>
        );
      })()}

      {habitStreaks.length > 0 && habitStreaks.some(s => s.badge) && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" /> Streak Badges
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habitStreaks.filter(s => s.badge).map(({ habit, streak, badge }) => {
              const BadgeIcon = badge!.icon;
              const HabitIcon = getHabitIcon(habit.icon);
              return (
                <div key={habit.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <div className="relative">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: badge!.color + '18' }}>
                      <BadgeIcon className="h-5 w-5" style={{ color: badge!.color }} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center bg-card border border-border">
                      <HabitIcon className="h-3 w-3" style={{ color: getColorHex(habit.color) }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold" style={{ color: badge!.color }}>{badge!.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{habit.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{streak} day streak</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* All badge levels */}
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">Badge levels</div>
            <div className="flex flex-wrap gap-3">
              {STREAK_BADGES.map(b => {
                const Icon = b.icon;
                const earned = habitStreaks.some(s => s.streak >= b.threshold);
                return (
                  <div key={b.label} className={`flex items-center gap-1.5 text-xs ${earned ? '' : 'opacity-40'}`}>
                    <Icon className="h-3.5 w-3.5" style={{ color: b.color }} />
                    <span>{b.label} ({b.threshold}d)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/timer">
          <Card className="p-5 hover:bg-accent/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Timer className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-sm">Start Session</div>
                  <div className="text-xs text-muted-foreground">{subjects.length} subjects available</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Card>
        </Link>
        <Link to="/habits">
          <Card className="p-5 hover:bg-accent/50 transition-colors cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="font-medium text-sm">Log Habit</div>
                  <div className="text-xs text-muted-foreground">{habits.length - completedHabitsToday.length} remaining today</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Weekly Chart */}
      <Card className="p-6">
        <h3 className="font-semibold mb-1">Weekly Overview</h3>
        <p className="text-xs text-muted-foreground mb-4">{formatMinutes(weekTotal)} total this week</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
            <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Today's Activity */}
      {todaySessions.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Today's Sessions</h3>
          <div className="space-y-2">
            {todaySessions.map(log => {
              const subj = subjects.find(s => s.id === log.subject_id);
              return (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subj ? SUBJECT_COLOR_MAP[subj.color] : 'gray' }} />
                    <span className="text-sm font-medium">{subj?.name}</span>
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{formatMinutes(log.duration_minutes)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
