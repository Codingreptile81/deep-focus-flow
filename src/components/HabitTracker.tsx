import React, { useState, useMemo } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Flame, Check, Hash, Clock, MoreVertical, Trash2, Edit, ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths } from 'date-fns';
import HabitGridView from './HabitGridView';

const HabitTracker: React.FC = () => {
  const { habits, habitLogs, addHabit, updateHabit, addHabitLog, deleteHabitLog, deleteHabit } = useAppState();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMetric, setNewMetric] = useState<'binary' | 'count' | 'minutes'>('binary');
  const [newTarget, setNewTarget] = useState('');
  const [newColor, setNewColor] = useState<string>(HABIT_COLOR_OPTIONS[0].value);
  const [newIcon, setNewIcon] = useState('book-open');
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [entryHabitId, setEntryHabitId] = useState<string | null>(null);
  const [entryValue, setEntryValue] = useState('');
  const [entryNote, setEntryNote] = useState('');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const getColorHex = (colorValue: string) => {
    const found = HABIT_COLOR_OPTIONS.find(c => c.value === colorValue);
    return found?.hex || 'hsl(210, 80%, 55%)';
  };

  const resetForm = () => {
    setNewName(''); setNewTarget(''); setNewColor(HABIT_COLOR_OPTIONS[0].value); setNewIcon('book-open'); setNewMetric('binary');
  };

  const handleAddHabit = () => {
    if (!newName.trim()) return;
    addHabit({ name: newName.trim(), metric_type: newMetric, target_value: newTarget ? parseFloat(newTarget) : undefined, color: newColor, icon: newIcon });
    resetForm(); setShowAdd(false);
  };

  const handleEditHabit = () => {
    if (!editingHabit || !newName.trim()) return;
    updateHabit({ ...editingHabit, name: newName.trim(), metric_type: newMetric, target_value: newTarget ? parseFloat(newTarget) : undefined, color: newColor, icon: newIcon });
    resetForm(); setEditingHabit(null);
  };

  const startEditing = (habit: Habit) => {
    setNewName(habit.name); setNewMetric(habit.metric_type); setNewTarget(habit.target_value?.toString() || '');
    setNewColor(habit.color); setNewIcon(habit.icon || 'book-open'); setEditingHabit(habit);
  };

  const handleLogEntry = () => {
    if (!entryHabitId) return;
    const habit = habits.find(h => h.id === entryHabitId);
    if (!habit) return;
    const value = habit.metric_type === 'binary' ? 1 : parseFloat(entryValue) || 0;
    addHabitLog({ habit_id: entryHabitId, value, date: todayStr, note: entryNote || undefined });
    setEntryHabitId(null); setEntryValue(''); setEntryNote('');
  };

  const handleGridLog = (habitId: string, date: string, value: number, note?: string) => {
    if (date !== todayStr) return; // only allow logging for today
    addHabitLog({ habit_id: habitId, value, date, note });
  };

  const quickLog = (habit: Habit) => {
    if (habit.metric_type === 'binary') {
      addHabitLog({ habit_id: habit.id, value: 1, date: todayStr });
    } else {
      setEntryHabitId(habit.id); setEntryValue(''); setEntryNote('');
    }
  };

  const isCompletedToday = (habitId: string) => habitLogs.some(l => l.habit_id === habitId && l.date === todayStr);

  const metricIcon = (type: string) => {
    if (type === 'binary') return <Check className="h-3.5 w-3.5" />;
    if (type === 'count') return <Hash className="h-3.5 w-3.5" />;
    return <Clock className="h-3.5 w-3.5" />;
  };

  // Mini calendar data
  const calStart = startOfMonth(calMonth);
  const calEnd = endOfMonth(calMonth);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const calStartDay = getDay(calStart);

  const calDayData = useMemo(() => {
    return calDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completed = habits.filter(h => habitLogs.some(l => l.habit_id === h.id && l.date === dateStr)).length;
      return { day, dateStr, completed };
    });
  }, [calDays, habits, habitLogs]);

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
      {newMetric !== 'binary' && <Input type="number" placeholder="Daily target (optional)" value={newTarget} onChange={e => setNewTarget(e.target.value)} />}
      <div>
        <label className="text-sm font-medium mb-2 block">Color</label>
        <div className="flex flex-wrap gap-2">
          {HABIT_COLOR_OPTIONS.map(c => (
            <button key={c.value} type="button" onClick={() => setNewColor(c.value)}
              className={`h-8 w-8 rounded-full transition-all ${newColor === c.value ? 'ring-2 ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'}`}
              style={{ backgroundColor: c.hex, boxShadow: newColor === c.value ? `0 0 0 2px ${c.hex}` : undefined }} title={c.name} />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Icon</label>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
          {allHabitIconNames.map(iconName => {
            const Icon = getHabitIcon(iconName);
            return (
              <button key={iconName} type="button" onClick={() => setNewIcon(iconName)}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${newIcon === iconName ? 'bg-accent ring-1 ring-primary' : 'hover:bg-muted'}`} title={iconName}>
                <Icon className="h-4 w-4" style={{ color: newIcon === iconName ? getColorHex(newColor) : 'hsl(var(--muted-foreground))' }} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        {(() => { const PreviewIcon = getHabitIcon(newIcon); return (
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: getColorHex(newColor) + '22' }}>
            <PreviewIcon className="h-5 w-5" style={{ color: getColorHex(newColor) }} />
          </div>
        ); })()}
        <span className="text-sm font-medium">{newName || 'Habit name'}</span>
      </div>
      <Button onClick={isEdit ? handleEditHabit : handleAddHabit} className="w-full">{isEdit ? 'Save Changes' : 'Create Habit'}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Habits</h2>
      </div>

      {/* Floating Add Button */}
      <Dialog open={showAdd} onOpenChange={open => { setShowAdd(open); if (!open) resetForm(); }}>
        <DialogTrigger asChild>
          <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 transition-transform">
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Habit</DialogTitle></DialogHeader>
          {habitFormContent(false)}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={open => { if (!open) { setEditingHabit(null); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Habit</DialogTitle></DialogHeader>
          {habitFormContent(true)}
        </DialogContent>
      </Dialog>

      {/* Log Entry Dialog for count/minutes */}
      <Dialog open={!!entryHabitId} onOpenChange={open => { if (!open) setEntryHabitId(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log: {habits.find(h => h.id === entryHabitId)?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {habits.find(h => h.id === entryHabitId)?.metric_type !== 'binary' && (
              <Input type="number" placeholder={habits.find(h => h.id === entryHabitId)?.metric_type === 'count' ? 'Count' : 'Minutes'} value={entryValue} onChange={e => setEntryValue(e.target.value)} autoFocus />
            )}
            <Input placeholder="Note (optional)" value={entryNote} onChange={e => setEntryNote(e.target.value)} />
            <Button onClick={handleLogEntry} className="w-full">Save Entry</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="habits" className="w-full">
        <TabsList>
          <TabsTrigger value="habits">Habits</TabsTrigger>
          <TabsTrigger value="grid">Grid Log</TabsTrigger>
        </TabsList>

        {/* === HABITS TAB: cards + mini calendar sidebar === */}
        <TabsContent value="habits">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_260px] gap-6 mt-4">
            {/* Habit cards */}
            <div>
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
                                {metricIcon(habit.metric_type)}<span>{habit.metric_type}</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(habit)} className="gap-2"><Edit className="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteHabit(habit.id)} className="gap-2 text-destructive focus:text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm text-success">
                              <Check className="h-4 w-4" />
                              <span>Done today{todayLog && todayLog.value > 1 ? ` (${todayLog.value})` : ''}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => todayLog && deleteHabitLog(todayLog.id)} title="Undo">
                              <Undo2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => quickLog(habit)}>
                            <Check className="h-3.5 w-3.5" />
                            {habit.metric_type === 'binary' ? 'Mark Done' : 'Log Entry'}
                          </Button>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mini calendar sidebar */}
            {habits.length > 0 && (
              <div className="space-y-3">
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(subMonths(calMonth, 1))}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium">{format(calMonth, 'MMM yyyy')}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCalMonth(addMonths(calMonth, 1))}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} className="text-center text-[9px] text-muted-foreground font-medium h-5 flex items-center justify-center">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: calStartDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {calDayData.map(({ day, dateStr, completed }) => {
                      const isToday = dateStr === todayStr;
                      const isSelected = dateStr === selectedCalDate;
                      const total = habits.length;
                      const ratio = total > 0 ? completed / total : 0;
                      let bg = 'bg-muted/40';
                      if (ratio > 0 && ratio < 0.5) bg = 'bg-[hsl(142,40%,70%)] dark:bg-[hsl(142,40%,30%)]';
                      else if (ratio >= 0.5 && ratio < 1) bg = 'bg-[hsl(142,50%,50%)] dark:bg-[hsl(142,50%,40%)]';
                      else if (ratio >= 1) bg = 'bg-[hsl(142,60%,38%)] dark:bg-[hsl(142,60%,48%)]';

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          onClick={() => setSelectedCalDate(dateStr === selectedCalDate ? null : dateStr)}
                          title={`${format(day, 'MMM d')}: ${completed}/${total} habits`}
                          className={`h-7 w-full rounded flex items-center justify-center text-[10px] transition-colors cursor-pointer ${bg} ${isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-background font-bold' : ''} ${isSelected ? 'ring-2 ring-accent-foreground ring-offset-1 ring-offset-background' : ''}`}
                        >
                          <span className={completed > 0 ? 'text-white dark:text-foreground font-medium' : 'text-muted-foreground'}>
                            {format(day, 'd')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-end gap-1 mt-2 text-[9px] text-muted-foreground">
                    <span>Less</span>
                    {['bg-muted/40', 'bg-[hsl(142,40%,70%)] dark:bg-[hsl(142,40%,30%)]', 'bg-[hsl(142,50%,50%)] dark:bg-[hsl(142,50%,40%)]', 'bg-[hsl(142,60%,38%)] dark:bg-[hsl(142,60%,48%)]'].map((cls, i) => (
                      <div key={i} className={`h-2 w-2 rounded-sm ${cls}`} />
                    ))}
                    <span>More</span>
                  </div>
                </Card>

                {/* Per-habit legend */}
                <Card className="p-3">
                  <h4 className="text-xs font-medium mb-2 text-muted-foreground">Habit Legend</h4>
                  <div className="space-y-1.5">
                    {habits.map(h => {
                      const Icon = getHabitIcon(h.icon);
                      const streak = getHabitStreak(habitLogs, h.id);
                      return (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5" style={{ color: getColorHex(h.color) }} />
                            <span className="truncate max-w-[120px]">{h.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Flame className="h-3 w-3 text-warning" />
                            <span className="font-mono">{streak}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                {/* Selected date detail */}
                {selectedCalDate && (
                  <Card className="p-3">
                    <h4 className="text-xs font-medium mb-2 text-muted-foreground">
                      {format(new Date(selectedCalDate + 'T00:00:00'), 'EEEE, MMM d, yyyy')}
                    </h4>
                    <div className="space-y-1.5">
                      {habits.map(h => {
                        const Icon = getHabitIcon(h.icon);
                        const log = habitLogs.find(l => l.habit_id === h.id && l.date === selectedCalDate);
                        return (
                          <div key={h.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <Icon className="h-3.5 w-3.5" style={{ color: getColorHex(h.color) }} />
                              <span className="truncate max-w-[120px]">{h.name}</span>
                            </div>
                            {log ? (
                              <div className="flex items-center gap-1 text-success">
                                <Check className="h-3 w-3" />
                                <span className="font-mono">{log.value > 1 ? log.value : ''}</span>
                                {log.note && <span className="text-muted-foreground italic truncate max-w-[60px]" title={log.note}>"{log.note}"</span>}
                                {selectedCalDate === todayStr && (
                                  <button onClick={() => deleteHabitLog(log.id)} className="ml-1 text-muted-foreground hover:text-destructive" title="Undo">
                                    <Undo2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* === GRID LOG TAB === */}
        <TabsContent value="grid" className="mt-4">
          <HabitGridView habits={habits} habitLogs={habitLogs} onLog={handleGridLog} onDeleteLog={deleteHabitLog} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HabitTracker;
