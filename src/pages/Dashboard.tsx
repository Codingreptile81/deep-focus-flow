import React from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLOR_MAP } from '@/types';
import { getTodayStudyMinutes, formatMinutes, getHabitStreak, getWeeklyStudyData } from '@/lib/analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { Timer, CheckSquare, Flame, Clock, ArrowRight, Zap } from 'lucide-react';
import { format } from 'date-fns';

const DashboardPage: React.FC = () => {
  const { subjects, habits, sessionLogs, habitLogs } = useAppState();
  const todayMinutes = getTodayStudyMinutes(sessionLogs);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todaySessions = sessionLogs.filter(l => l.date === todayStr);
  const completedHabitsToday = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === todayStr));
  const weeklyData = getWeeklyStudyData(sessionLogs, subjects);

  const totalStreak = habits.length > 0
    ? Math.max(...habits.map(h => getHabitStreak(habitLogs, h.id)), 0)
    : 0;

  const weekTotal = weeklyData.reduce((s, d) => s + d.minutes, 0);

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
            <span className="text-xs text-muted-foreground font-medium">This Week</span>
            <Zap className="h-4 w-4 text-accent-foreground" />
          </div>
          <div className="stat-value animate-count-up">{formatMinutes(weekTotal)}</div>
          <div className="text-xs text-muted-foreground mt-1">total study</div>
        </Card>
      </div>

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
        <h3 className="font-semibold mb-4">Weekly Overview</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
            />
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
