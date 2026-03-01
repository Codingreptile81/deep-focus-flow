import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
import { Task, HabitLog, Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, CheckSquare, Flame } from 'lucide-react';

interface ActivityCalendarProps {
  tasks: Task[];
  habitLogs: HabitLog[];
  habits: Habit[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

const getIntensityClass = (count: number): string => {
  if (count === 0) return 'bg-muted/40';
  if (count <= 2) return 'bg-[hsl(142,40%,70%)] dark:bg-[hsl(142,40%,30%)]';
  if (count <= 5) return 'bg-[hsl(142,50%,50%)] dark:bg-[hsl(142,50%,40%)]';
  return 'bg-[hsl(142,60%,38%)] dark:bg-[hsl(142,60%,48%)]';
};

const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ tasks, habitLogs, habits, selectedDate, onSelectDate, currentMonth, onMonthChange }) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  const dayData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completedTasks = tasks.filter(t => t.status === 'done' && t.scheduled_date === dateStr).length;
      const completedHabits = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr)).length;
      const totalTasks = tasks.filter(t => t.scheduled_date === dateStr).length;
      const total = completedTasks + completedHabits;
      return { day, dateStr, completedTasks, completedHabits, totalTasks, total };
    });
  }, [daysInMonth, tasks, habitLogs, habits]);

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-muted-foreground font-medium h-6 flex items-center justify-center">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {dayData.map(({ day, dateStr, completedTasks, completedHabits, totalTasks, total }) => {
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDateStr;

          return (
            <Popover key={dateStr}>
              <PopoverTrigger asChild>
                <button
                  onClick={() => onSelectDate(day)}
                  className={`
                    h-8 w-full rounded-md flex items-center justify-center text-xs
                    transition-all duration-150 hover:scale-105
                    ${getIntensityClass(total)}
                    ${isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background font-bold' : ''}
                    ${isSelected && !isToday ? 'ring-2 ring-foreground/40 ring-offset-1 ring-offset-background' : ''}
                  `}
                >
                  <span className={total > 0 ? 'text-white dark:text-foreground font-medium' : 'text-muted-foreground'}>
                    {format(day, 'd')}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-2.5" side="top">
                <div className="space-y-1">
                  <div className="text-xs font-semibold">{format(day, 'EEE, MMM d')}</div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CheckSquare className="h-3 w-3" /> {completedTasks}/{totalTasks} tasks
                  </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Flame className="h-3 w-3" /> {completedHabits}/{habits.length} habits
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-muted-foreground">
        <span>Less</span>
        {['bg-muted/40', 'bg-[hsl(142,40%,70%)] dark:bg-[hsl(142,40%,30%)]', 'bg-[hsl(142,50%,50%)] dark:bg-[hsl(142,50%,40%)]', 'bg-[hsl(142,60%,38%)] dark:bg-[hsl(142,60%,48%)]'].map((cls, i) => (
          <div key={i} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityCalendar;
