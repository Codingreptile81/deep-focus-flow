import React from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLOR_MAP } from '@/types';
import {
  getSubjectDistribution, getWeeklyStudyData, getDailyStudyData,
  getWeeklyHabitData, getHabitStreak, getMostFocusedSubject,
  getBestDayOfWeek, formatMinutes,
} from '@/lib/analytics';
import { Card } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
} from 'recharts';
import { TrendingUp, Target, Calendar, Flame } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const { subjects, habits, sessionLogs, habitLogs } = useAppState();

  const weeklyStudy = getWeeklyStudyData(sessionLogs, subjects);
  const dailyStudy = getDailyStudyData(sessionLogs);
  const distribution = getSubjectDistribution(sessionLogs, subjects);
  const weeklyHabits = getWeeklyHabitData(habitLogs, habits);
  const mostFocused = getMostFocusedSubject(sessionLogs, subjects);
  const bestDay = getBestDayOfWeek(sessionLogs);
  const totalMinutes = sessionLogs.reduce((s, l) => s + l.duration_minutes, 0);

  const chartColors = ['hsl(210,80%,55%)', 'hsl(160,60%,45%)', 'hsl(30,90%,56%)', 'hsl(340,65%,55%)', 'hsl(270,60%,55%)', 'hsl(180,55%,45%)'];

  const noData = sessionLogs.length === 0 && habitLogs.length === 0;

  if (noData) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Complete some sessions and log habits to see your analytics here.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics</h2>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Study Time</div>
          <div className="stat-value">{formatMinutes(totalMinutes)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Most Focused</div>
          <div className="text-lg font-semibold">{mostFocused?.name || 'N/A'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Best Day</div>
          <div className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> {bestDay}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground mb-1">Active Habits</div>
          <div className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-4 w-4 text-success" /> {habits.length}
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Study Bar */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Weekly Study Time</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyStudy}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Subject Distribution Pie */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Subject Distribution</h3>
          {distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
                  {distribution.map((entry, i) => (
                    <Cell key={entry.name} fill={SUBJECT_COLOR_MAP[entry.color] || chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => formatMinutes(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">No subject data yet</p>
          )}
          {distribution.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {distribution.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[d.color] }} />
                  {d.name}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Study Line */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Daily Study (30 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dailyStudy}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Habit Completion */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Habit Completion (Weekly)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyHabits}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Streak Overview */}
      {habits.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-warning" /> Streak Overview
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {habits.map(h => {
              const streak = getHabitStreak(habitLogs, h.id);
              return (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center font-mono font-bold text-sm" style={{ backgroundColor: SUBJECT_COLOR_MAP[h.color] + '22', color: SUBJECT_COLOR_MAP[h.color] }}>
                    {streak}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-muted-foreground">{streak} day streak</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
