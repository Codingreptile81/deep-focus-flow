import React, { useState } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { Habit, HabitLog, SUBJECT_COLORS, SUBJECT_COLOR_MAP } from '@/types';
import { getHabitStreak, getHabitCompletionRate } from '@/lib/analytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Flame, Check, Hash, Clock, Pencil } from 'lucide-react';
import { format } from 'date-fns';

const HabitTracker: React.FC = () => {
  const { habits, habitLogs, addHabit, addHabitLog } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMetric, setNewMetric] = useState<'binary' | 'count' | 'minutes'>('binary');
  const [newTarget, setNewTarget] = useState('');
  const [entryHabitId, setEntryHabitId] = useState<string | null>(null);
  const [entryValue, setEntryValue] = useState('');
  const [entryNote, setEntryNote] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const handleAddHabit = () => {
    if (!newName.trim()) return;
    const color = SUBJECT_COLORS[(habits.length + 3) % SUBJECT_COLORS.length];
    addHabit({
      id: crypto.randomUUID(),
      name: newName.trim(),
      metric_type: newMetric,
      target_value: newTarget ? parseFloat(newTarget) : undefined,
      color,
      created_at: new Date().toISOString(),
    });
    setNewName('');
    setNewTarget('');
    setShowAdd(false);
  };

  const handleLogEntry = () => {
    if (!entryHabitId) return;
    const habit = habits.find(h => h.id === entryHabitId);
    if (!habit) return;
    const value = habit.metric_type === 'binary' ? 1 : parseFloat(entryValue) || 0;
    addHabitLog({
      id: crypto.randomUUID(),
      habit_id: entryHabitId,
      value,
      date: todayStr,
      note: entryNote || undefined,
    });
    setEntryHabitId(null);
    setEntryValue('');
    setEntryNote('');
  };

  const isCompletedToday = (habitId: string) =>
    habitLogs.some(l => l.habit_id === habitId && l.date === todayStr);

  const metricIcon = (type: string) => {
    if (type === 'binary') return <Check className="h-3.5 w-3.5" />;
    if (type === 'count') return <Hash className="h-3.5 w-3.5" />;
    return <Clock className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Habits</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Habit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Habit</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Habit name" value={newName} onChange={e => setNewName(e.target.value)} />
              <Select value={newMetric} onValueChange={(v: 'binary' | 'count' | 'minutes') => setNewMetric(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="binary">Binary (Done/Not done)</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="minutes">Minutes</SelectItem>
                </SelectContent>
              </Select>
              {newMetric !== 'binary' && (
                <Input type="number" placeholder="Daily target (optional)" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
              )}
              <Button onClick={handleAddHabit} className="w-full">Create Habit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Habit List */}
      {habits.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No habits yet. Create your first habit to start tracking!</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {habits.map(habit => {
            const streak = getHabitStreak(habitLogs, habit.id);
            const rate = getHabitCompletionRate(habitLogs, habit.id);
            const completed = isCompletedToday(habit.id);
            const todayLog = habitLogs.find(l => l.habit_id === habit.id && l.date === todayStr);

            return (
              <Card key={habit.id} className={`p-4 transition-all ${completed ? 'ring-1 ring-success/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[habit.color] }} />
                    <h4 className="font-medium text-sm">{habit.name}</h4>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {metricIcon(habit.metric_type)}
                    <span>{habit.metric_type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Flame className="h-4 w-4 text-warning" />
                    <span className="text-sm font-mono font-semibold">{streak}</span>
                    <span className="text-xs text-muted-foreground">streak</span>
                  </div>
                  <div>
                    <span className="text-sm font-mono font-semibold">{rate}%</span>
                    <span className="text-xs text-muted-foreground ml-1">rate</span>
                  </div>
                </div>

                {completed ? (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Check className="h-4 w-4" />
                    <span>Completed today{todayLog && todayLog.value > 1 ? ` (${todayLog.value})` : ''}</span>
                  </div>
                ) : (
                  <Dialog open={entryHabitId === habit.id} onOpenChange={open => { if (!open) setEntryHabitId(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => setEntryHabitId(habit.id)}>
                        <Pencil className="h-3.5 w-3.5" /> Log Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Log: {habit.name}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        {habit.metric_type !== 'binary' && (
                          <Input
                            type="number"
                            placeholder={habit.metric_type === 'count' ? 'Count' : 'Minutes'}
                            value={entryValue}
                            onChange={e => setEntryValue(e.target.value)}
                          />
                        )}
                        <Input placeholder="Note (optional)" value={entryNote} onChange={e => setEntryNote(e.target.value)} />
                        <Button onClick={handleLogEntry} className="w-full">Save Entry</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Recent History */}
      {habitLogs.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...habitLogs].reverse().slice(0, 20).map(log => {
              const habit = habits.find(h => h.id === log.habit_id);
              return (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: habit ? SUBJECT_COLOR_MAP[habit.color] : 'gray' }} />
                    <span className="text-sm">{habit?.name}</span>
                    {log.note && <span className="text-xs text-muted-foreground">· {log.note}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-mono">{log.value > 1 ? log.value : '✓'}</span>
                    <span>{log.date}</span>
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

export default HabitTracker;
