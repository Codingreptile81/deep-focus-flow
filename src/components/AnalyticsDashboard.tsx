import React from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLOR_MAP } from '@/types';
import {
  getSubjectDistribution, getWeeklyStudyData, getDailyStudyData,
  getWeeklyHabitData, getHabitStreak, getMostFocusedSubject,
  getBestDayOfWeek, formatMinutes,
  getTimePerTask, getTodosCompletedPerDay, getTodoCompletionRate,
  getOverdueTodos, getCardsCompletedPerWeek, getWIPCount,
  getTimePerColumn, getPlannedVsActual, getFocusAccuracy, getEstimateAccuracy,
} from '@/lib/analytics';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';
import { TrendingUp, Target, Calendar, Flame, ListTodo, Columns3, Crosshair, AlertTriangle } from 'lucide-react';

const AnalyticsDashboard: React.FC = () => {
  const { subjects, habits, sessionLogs, habitLogs, tasks } = useAppState();

  const weeklyStudy = getWeeklyStudyData(sessionLogs, subjects);
  const dailyStudy = getDailyStudyData(sessionLogs);
  const distribution = getSubjectDistribution(sessionLogs, subjects);
  const weeklyHabits = getWeeklyHabitData(habitLogs, habits);
  const mostFocused = getMostFocusedSubject(sessionLogs, subjects);
  const bestDay = getBestDayOfWeek(sessionLogs);
  const totalMinutes = sessionLogs.reduce((s, l) => s + l.duration_minutes, 0);

  // V2 analytics
  const timePerTask = getTimePerTask(sessionLogs, tasks);
  const todosPerDay = getTodosCompletedPerDay(tasks);
  const completionRate = getTodoCompletionRate(tasks);
  const overdueTodos = getOverdueTodos(tasks);
  const cardsPerWeek = getCardsCompletedPerWeek(tasks);
  const wipCount = getWIPCount(tasks);
  const timePerCol = getTimePerColumn(sessionLogs, tasks);
  const { planned, actual } = getPlannedVsActual(tasks);
  const focusAccuracy = getFocusAccuracy(tasks);
  const estimateAccuracy = getEstimateAccuracy(tasks);

  const chartColors = ['hsl(210,80%,55%)', 'hsl(160,60%,45%)', 'hsl(30,90%,56%)', 'hsl(340,65%,55%)', 'hsl(270,60%,55%)', 'hsl(180,55%,45%)'];

  const noData = sessionLogs.length === 0 && habitLogs.length === 0 && tasks.length === 0;

  if (noData) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <Card className="p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">Complete some sessions, log habits, or create tasks to see your analytics here.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics</h2>

      <Tabs defaultValue="study">
        <TabsList>
          <TabsTrigger value="study" className="gap-1 text-xs"><TrendingUp className="h-3.5 w-3.5" /> Study</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1 text-xs"><ListTodo className="h-3.5 w-3.5" /> Tasks</TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1 text-xs"><Columns3 className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
          <TabsTrigger value="planning" className="gap-1 text-xs"><Crosshair className="h-3.5 w-3.5" /> Planning</TabsTrigger>
        </TabsList>

        {/* ═══ STUDY TAB ═══ */}
        <TabsContent value="study" className="space-y-6 mt-4">
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Weekly Study Time</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyStudy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

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
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => formatMinutes(value)} />
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

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Daily Study (30 days)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyStudy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={4} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Habit Completion (Weekly)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={weeklyHabits}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="completed" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

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
        </TabsContent>

        {/* ═══ TASKS TAB ═══ */}
        <TabsContent value="tasks" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
              <div className="stat-value">{completionRate}%</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total Tasks</div>
              <div className="text-lg font-semibold">{tasks.length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Completed</div>
              <div className="text-lg font-semibold">{tasks.filter(t => t.status === 'done').length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-warning" /> Overdue
              </div>
              <div className="text-lg font-semibold text-warning">{overdueTodos.length}</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Daily Throughput</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={todosPerDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Time per Task</h3>
              {timePerTask.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={timePerTask} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatMinutes(v)} />
                    <Bar dataKey="minutes" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No task sessions logged yet</p>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ═══ KANBAN TAB ═══ */}
        <TabsContent value="kanban" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Work in Progress</div>
              <div className="stat-value">{wipCount}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Done (total)</div>
              <div className="text-lg font-semibold">{tasks.filter(t => t.status === 'done').length}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Active Cards</div>
              <div className="text-lg font-semibold">{tasks.filter(t => t.status !== 'done').length}</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Cards Completed per Week</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cardsPerWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Time per Column</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={timePerCol}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="column" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatMinutes(v)} />
                  <Bar dataKey="minutes" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PLANNING TAB ═══ */}
        <TabsContent value="planning" className="space-y-6 mt-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Planned</div>
              <div className="stat-value">{formatMinutes(planned)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Actual</div>
              <div className="stat-value">{formatMinutes(actual)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Focus Accuracy</div>
              <div className="stat-value">{focusAccuracy}%</div>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Planned vs Actual</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={[{ name: 'Total', planned, actual }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => formatMinutes(v)} />
                  <Bar dataKey="planned" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Planned" />
                  <Bar dataKey="actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Estimate Accuracy per Task</h3>
              {estimateAccuracy.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={estimateAccuracy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 'auto']} />
                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(v: number) => `${v}%`} />
                    <Bar dataKey="accuracy" fill="hsl(var(--warning))" radius={[0, 4, 4, 0]} name="Accuracy %" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">Add estimates and log time to see accuracy</p>
              )}
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
