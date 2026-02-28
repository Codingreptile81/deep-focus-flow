import React, { useState } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { Habit, HabitLog, HABIT_COLOR_OPTIONS } from '@/types';
import { getHabitStreak, getHabitCompletionRate } from '@/lib/analytics';
import { getHabitIcon, allHabitIconNames } from '@/lib/habit-icons';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Flame, Check, Hash, Clock, Pencil, CalendarDays, MoreVertical, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import HabitCalendar from './HabitCalendar';

const HabitTracker: React.FC = () => {
  const { habits, habitLogs, addHabit, updateHabit, addHabitLog, deleteHabit } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMetric, setNewMetric] = useState<'binary' | 'count' | 'minutes'>('binary');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState<string>(HABIT_COLOR_OPTIONS[0].value);
  const [newIcon, setNewIcon] = useState('book-open');
  const [entryHabitId, setEntryHabitId] = useState<string | null>(null);
  const [entryValue, setEntryValue] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const getColorHex = (colorValue: string) => {
    const found = HABIT_COLOR_OPTIONS.find(c => c.value === colorValue);
    return found?.hex || 'hsl(210, 80%, 55%)';
  };

  const resetForm = () => {
    setNewName('');
    setNewTarget('');
    setNewColor(HABIT_COLOR_OPTIONS[0].value);
    setNewIcon('book-open');
    setNewMetric('binary');
  };

  const handleAddHabit = () => {
    if (!newName.trim()) return;
    addHabit({
      name: newName.trim(),
      metric_type: newMetric,
      target_value: newTarget ? parseFloat(newTarget) : undefined,
      color: newColor,
      icon: newIcon,
    });
    resetForm();
    setShowAdd(false);
  };

  const handleEditHabit = () => {
    if (!editingHabit || !newName.trim()) return;
    updateHabit({
      ...editingHabit,
      name: newName.trim(),
      metric_type: newMetric,
      target_value: newTarget ? parseFloat(newTarget) : undefined,
      color: newColor,
      icon: newIcon,
    });
    resetForm();
    setEditingHabit(null);
  };

  const startEditing = (habit: Habit) => {
    setNewName(habit.name);
    setNewMetric(habit.metric_type);
    setNewTarget(habit.target_value?.toString() || '');
    setNewColor(habit.color);
    setNewIcon(habit.icon || 'book-open');
    setEditingHabit(habit);
  };

  const handleLogEntry = () => {
    if (!entryHabitId) return;
    const habit = habits.find(h => h.id === entryHabitId);
    if (!habit) return;
    const value = habit.metric_type === 'binary' ? 1 : parseFloat(entryValue) || 0;
    addHabitLog({
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

  const habitFormContent = (isEdit: boolean) => (
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
      <div>
        <label className="text-sm font-medium mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLOR_OPTIONS.map(c => (
            <button
              key={c.value}
              type="button"
              onClick={() => setNewColor(c.value)}
              className={`h-8 w-8 rounded-full transition-all ${newColor === c.value ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c.hex, boxShadow: newColor === c.value ? `0 0 0 2px ${c.hex}` : undefined }}
              title={c.name}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
          {allHabitIconNames.map(iconName => {
            const Icon = getHabitIcon(iconName);
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setNewIcon(iconName)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                  newIcon === iconName ? 'bg-accent ring-1 ring-primary' : 'hover:bg-muted'
                }`}
                title={iconName}
              >
                <Icon className="h-4 w-4" style={{ color: newIcon === iconName ? getColorHex(newColor) : 'hsl(var(--muted-foreground))' }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        {(() => {
          const PreviewIcon = getHabitIcon(newIcon);
          return (
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: getColorHex(newColor) + '22' }}>
              <PreviewIcon className="h-5 w-5" style={{ color: getColorHex(newColor) }} />
            </div>
          );
        })()}
        <span className="text-sm font-medium">{newName || 'Habit name'}</span>
      </div>
      <Button onClick={isEdit ? handleEditHabit : handleAddHabit} className="w-full">
        {isEdit ? 'Save Changes' : 'Create Habit'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Habits</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowCalendar(!showCalendar)}>
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Habit</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Create Habit</DialogTitle></DialogHeader>
              {habitFormContent(false)}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={(open) => { if (!open) { setEditingHabit(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Habit</DialogTitle></DialogHeader>
          {habitFormContent(true)}
        </DialogContent>
      </Dialog>

      {/* Calendar View */}
      {showCalendar && <HabitCalendar habits={habits} habitLogs={habitLogs} />}

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
            const HabitIcon = getHabitIcon(habit.icon);

            return (
              <Card key={habit.id} className={`p-4 transition-all ${completed ? 'ring-1 ring-success/30' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: getColorHex(habit.color) + '22' }}>
                      <HabitIcon className="h-4 w-4" style={{ color: getColorHex(habit.color) }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{habit.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {metricIcon(habit.metric_type)}
                        <span>{habit.metric_type}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => startEditing(habit)} className="gap-2">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteHabit(habit.id)} className="gap-2 text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
                          <Input type="number" placeholder={habit.metric_type === 'count' ? 'Count' : 'Minutes'} value={entryValue} onChange={e => setEntryValue(e.target.value)} />
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
              const LogIcon = habit ? getHabitIcon(habit.icon) : Check;
              return (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <LogIcon className="h-3.5 w-3.5" style={{ color: habit ? getColorHex(habit.color) : 'gray' }} />
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
