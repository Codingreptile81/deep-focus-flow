import React, { useMemo, useState } from 'react';
import { format, subDays, startOfDay } from 'date-fns';
import { Habit, HabitLog, HABIT_COLOR_OPTIONS } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getHabitIcon } from '@/lib/habit-icons';
import { Check, Undo2 } from 'lucide-react';

interface HabitGridViewProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  onLog: (habitId: string, date: string, value: number, note?: string) => void;
  onDeleteLog?: (logId: string) => void;
  daysToShow?: number;
}

const getColorHex = (colorValue: string) => {
  const found = HABIT_COLOR_OPTIONS.find(c => c.value === colorValue);
  return found?.hex || 'hsl(210, 80%, 55%)';
};

const HabitGridView: React.FC<HabitGridViewProps> = ({ habits, habitLogs, onLog, onDeleteLog, daysToShow = 14 }) => {
  const [entryModal, setEntryModal] = useState<{ habitId: string; date: string } | null>(null);
  const [entryValue, setEntryValue] = useState('');
  const [entryNote, setEntryNote] = useState('');

  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: daysToShow }, (_, i) => {
      const day = subDays(today, i);
      return { date: day, dateStr: format(day, 'yyyy-MM-dd'), label: format(day, 'EEE, MMM d') };
    });
  }, [daysToShow]);

  const isLogged = (habitId: string, dateStr: string) =>
    habitLogs.some(l => l.habit_id === habitId && l.date === dateStr);

  const getLog = (habitId: string, dateStr: string) =>
    habitLogs.find(l => l.habit_id === habitId && l.date === dateStr);

  const todayStr = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const handleToggle = (habit: Habit, dateStr: string) => {
    if (dateStr !== todayStr) return; // only allow logging for today
    if (isLogged(habit.id, dateStr)) return;
    if (habit.metric_type === 'binary') {
      onLog(habit.id, dateStr, 1);
    } else {
      setEntryModal({ habitId: habit.id, date: dateStr });
      setEntryValue('');
      setEntryNote('');
    }
  };

  const handleSubmitEntry = () => {
    if (!entryModal) return;
    const value = parseFloat(entryValue) || 0;
    if (value <= 0) return;
    onLog(entryModal.habitId, entryModal.date, value, entryNote || undefined);
    setEntryModal(null);
  };

  const entryHabit = entryModal ? habits.find(h => h.id === entryModal.habitId) : null;

  if (habits.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No habits yet. Create habits first to use the grid view.</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <TooltipProvider delayDuration={200}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-muted/30 z-10 min-w-[140px]">
                    Date
                  </th>
                  {habits.map(habit => {
                    const Icon = getHabitIcon(habit.icon);
                    return (
                      <th key={habit.id} className="px-3 py-3 text-center min-w-[80px]">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="h-4 w-4" style={{ color: getColorHex(habit.color) }} />
                          <span className="text-xs font-medium truncate max-w-[70px]" title={habit.name}>
                            {habit.name}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {days.map(({ dateStr, label }) => (
                  <tr key={dateStr} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-xs sticky left-0 bg-background z-10">
                      {label}
                    </td>
                    {habits.map(habit => {
                      const logged = isLogged(habit.id, dateStr);
                      const log = getLog(habit.id, dateStr);
                      return (
                        <td key={habit.id} className="px-3 py-2.5 text-center">
                          {logged ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center gap-1 group">
                                  <div
                                    className="h-6 w-6 rounded flex items-center justify-center"
                                    style={{ backgroundColor: getColorHex(habit.color) + '22' }}
                                  >
                                    <Check className="h-3.5 w-3.5" style={{ color: getColorHex(habit.color) }} />
                                  </div>
                                  {log && log.value > 1 && (
                                    <span className="text-[10px] text-muted-foreground">{log.value}</span>
                                  )}
                                  {dateStr === todayStr && onDeleteLog && log && (
                                    <button onClick={() => onDeleteLog(log.id)} className="hidden group-hover:flex h-5 w-5 items-center justify-center text-muted-foreground hover:text-destructive rounded">
                                      <Undo2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs max-w-[200px]">
                                <p className="font-medium">{habit.name}</p>
                                {log && log.value > 1 && <p>Value: {log.value}</p>}
                                {log?.note && <p className="italic text-muted-foreground">"{log.note}"</p>}
                                {!log?.note && <p className="text-muted-foreground">No note</p>}
                              </TooltipContent>
                            </Tooltip>
                          ) : dateStr === todayStr ? (
                            <button
                              onClick={() => handleToggle(habit, dateStr)}
                              className="h-6 w-6 rounded border border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50 transition-colors mx-auto flex items-center justify-center"
                            >
                            </button>
                          ) : (
                            <div className="h-6 w-6 rounded border border-dashed border-muted-foreground/15 mx-auto flex items-center justify-center opacity-40" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </Card>

      {/* Entry dialog for count/minutes habits */}
      <Dialog open={!!entryModal} onOpenChange={open => { if (!open) setEntryModal(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log: {entryHabit?.name} — {entryModal?.date}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder={entryHabit?.metric_type === 'count' ? 'Count' : 'Minutes'}
              value={entryValue}
              onChange={e => setEntryValue(e.target.value)}
              autoFocus
            />
            <Input placeholder="Note (optional)" value={entryNote} onChange={e => setEntryNote(e.target.value)} />
            <Button onClick={handleSubmitEntry} className="w-full">Save Entry</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HabitGridView;
