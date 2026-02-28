import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, isSameMonth } from 'date-fns';
import { HabitLog, Habit, HABIT_COLOR_OPTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getHabitIcon } from '@/lib/habit-icons';

interface HabitCalendarProps {
  habits: Habit[];
  habitLogs: HabitLog[];
}

const HabitCalendar: React.FC<HabitCalendarProps> = ({ habits, habitLogs }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const getColorHex = (colorValue: string) => {
    const found = HABIT_COLOR_OPTIONS.find(c => c.value === colorValue);
    return found?.hex || 'hsl(210, 80%, 55%)';
  };

  const dayData = useMemo(() => {
    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const habitStatuses = habits.map(habit => {
        const logged = habitLogs.some(l => l.habit_id === habit.id && l.date === dateStr);
        return { habit, logged };
      });
      return { day, dateStr, habitStatuses };
    });
  }, [daysInMonth, habits, habitLogs]);

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold">Habit Calendar</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      {habits.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {habits.map(h => {
            const Icon = getHabitIcon(h.icon);
            return (
              <div key={h.id} className="flex items-center gap-1.5 text-xs">
                <Icon className="h-3.5 w-3.5" style={{ color: getColorHex(h.color) }} />
                <span>{h.name}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {dayData.map(({ day, dateStr, habitStatuses }) => {
          const isToday = dateStr === today;
          const completedCount = habitStatuses.filter(s => s.logged).length;
          const totalHabits = habits.length;
          const allDone = totalHabits > 0 && completedCount === totalHabits;
          const someDone = completedCount > 0;

          return (
            <div
              key={dateStr}
              className={`relative p-1 rounded-lg min-h-[56px] border transition-colors ${
                isToday ? 'border-primary/50 bg-accent/50' : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <div className={`text-xs text-center mb-1 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'd')}
              </div>
              <div className="flex flex-wrap gap-0.5 justify-center">
                {habitStatuses.map(({ habit, logged }) => {
                  const Icon = getHabitIcon(habit.icon);
                  return (
                    <div key={habit.id} title={`${habit.name}: ${logged ? 'Done' : 'Missed'}`}>
                      <Icon
                        className="h-3 w-3"
                        style={{ color: logged ? getColorHex(habit.color) : 'hsl(var(--muted-foreground))' }}
                        strokeWidth={logged ? 2.5 : 1.5}
                      />
                    </div>
                  );
                })}
              </div>
              {allDone && (
                <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-2 w-2 text-success-foreground" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default HabitCalendar;
