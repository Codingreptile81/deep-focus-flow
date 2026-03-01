import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, subDays, parseISO } from 'date-fns';
import { Task, HabitLog, Habit } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Flame, Trophy, CheckSquare, CalendarDays } from 'lucide-react';

interface ActivityCalendarProps {
  tasks: Task[];
  habitLogs: HabitLog[];
  habits: Habit[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const INTENSITY_CLASSES = [
  'bg-muted/40',                                        // 0 - empty
  'bg-[hsl(142,40%,70%)] dark:bg-[hsl(142,40%,30%)]',  // 1-2 light
  'bg-[hsl(142,50%,50%)] dark:bg-[hsl(142,50%,40%)]',  // 3-5 medium
  'bg-[hsl(142,60%,38%)] dark:bg-[hsl(142,60%,48%)]',  // 6+ strong
];

const getIntensityLevel = (completedTasks: number, completedHabits: number): number => {
  const total = completedTasks + completedHabits;
  if (total === 0) return 0;
  if (total <= 2) return 1;
  if (total <= 5) return 2;
  return 3;
};

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ tasks, habitLogs, habits, selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Compute streaks
  const { currentStreak, longestStreak } = useMemo(() => {
    let current = 0;
    let longest = 0;
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const tasksDone = tasks.filter(t => t.status === 'done' && t.scheduled_date === dateStr).length;
      const habitsDone = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr)).length;
      const isActive = tasksDone + habitsDone > 0;

      if (isActive) {
        streak++;
        if (i === 0 || current === i) current = streak;
      } else {
        if (i === 0) { /* today not active yet, check from yesterday */ }
        else {
          longest = Math.max(longest, streak);
          streak = 0;
        }
      }
    }
    longest = Math.max(longest, streak);
    return { currentStreak: current, longestStreak: longest };
  }, [tasks, habitLogs, habits]);

  // Weekly stats
  const weekTasksCompleted = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
      count += tasks.filter(t => t.status === 'done' && t.scheduled_date === dateStr).length;
    }
    return count;
  }, [tasks]);

  // Active days this month
  const activeDaysThisMonth = useMemo(() => {
    let count = 0;
    for (const day of daysInMonth) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const tasksDone = tasks.filter(t => t.status === 'done' && t.scheduled_date === dateStr).length;
      const habitsDone = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr)).length;
      if (tasksDone + habitsDone > 0) count++;
    }
    return count;
  }, [daysInMonth, tasks, habitLogs, habits]);

  // Per-day data
  const dayData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completedTasks = tasks.filter(t => t.status === 'done' && t.scheduled_date === dateStr).length;
      const completedHabits = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr)).length;
      const totalTasks = tasks.filter(t => t.scheduled_date === dateStr).length;
      const intensity = getIntensityLevel(completedTasks, completedHabits);
      return { day, dateStr, completedTasks, completedHabits, totalTasks, intensity };
    });
  }, [daysInMonth, tasks, habitLogs, habits]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Streak milestones
  const streakMilestone = [7, 14, 30, 60, 100].find(m => currentStreak === m);

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Flame className="h-4 w-4 text-warning" />
            <span className="text-xs text-muted-foreground font-medium">Current Streak</span>
          </div>
          <div className={`text-xl font-bold font-mono ${streakMilestone ? 'text-warning animate-scale-in' : ''}`}>
            {currentStreak}
          </div>
          <div className="text-[10px] text-muted-foreground">days</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Best Streak</span>
          </div>
          <div className="text-xl font-bold font-mono">{longestStreak}</div>
          <div className="text-[10px] text-muted-foreground">days</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CheckSquare className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground font-medium">This Week</span>
          </div>
          <div className="text-xl font-bold font-mono">{weekTasksCompleted}</div>
          <div className="text-[10px] text-muted-foreground">tasks done</div>
        </Card>
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <CalendarDays className="h-4 w-4 text-accent-foreground" />
            <span className="text-xs text-muted-foreground font-medium">Active Days</span>
          </div>
          <div className="text-xl font-bold font-mono">{activeDaysThisMonth}</div>
          <div className="text-[10px] text-muted-foreground">this month</div>
        </Card>
      </div>

      {/* Streak milestone toast */}
      {streakMilestone && (
        <Card className="p-3 border-warning/40 bg-warning/5 animate-fade-in">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-warning">
            <Flame className="h-4 w-4" />
            🎉 {streakMilestone}-day streak milestone reached!
            <Flame className="h-4 w-4" />
          </div>
        </Card>
      )}

      {/* Calendar */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">Activity</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-0.5">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {dayData.map(({ day, dateStr, completedTasks, completedHabits, totalTasks, intensity }) => {
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const total = completedTasks + completedHabits;

            return (
              <Popover key={dateStr}>
                <PopoverTrigger asChild>
                  <button
                    onClick={() => onSelectDate(day)}
                    className={`
                      relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                      transition-all duration-150 hover:scale-110 hover:shadow-md
                      ${INTENSITY_CLASSES[intensity]}
                      ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                      ${isSelected ? 'ring-2 ring-foreground/50 ring-offset-1 ring-offset-background' : ''}
                    `}
                  >
                    <span className={`${isToday ? 'font-bold text-primary' : intensity > 0 ? 'text-white dark:text-foreground' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" side="top">
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold">{format(day, 'EEEE, MMM d')}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckSquare className="h-3 w-3" />
                      {completedTasks}/{totalTasks} tasks completed
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Flame className="h-3 w-3" />
                      {completedHabits}/{habits.length} habits completed
                    </div>
                    {total > 0 && (
                      <div className="pt-1 border-t border-border mt-1">
                        <div className="text-[10px] text-muted-foreground">
                          Productivity: {total <= 2 ? 'Low' : total <= 5 ? 'Medium' : 'High'}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-4 text-[10px] text-muted-foreground">
          <span>Less</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div key={i} className={`h-3 w-3 rounded-sm ${cls}`} />
          ))}
          <span>More</span>
        </div>
      </Card>
    </div>
  );
};

export default ActivityCalendar;
