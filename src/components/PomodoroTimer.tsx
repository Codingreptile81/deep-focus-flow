import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLORS, SUBJECT_COLOR_MAP } from '@/types';
import { getSubjectTotalMinutes, getSubjectTodayMinutes, formatMinutes, getSubjectLevel } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, RotateCcw, Plus, Clock, Zap, BookOpen, ListTodo, Columns3, Bell, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

type FocusTarget = { type: 'subject'; subjectId: string } | { type: 'task'; taskId: string; subjectId: string };

const TIMER_STORAGE_KEY = 'pomodoro_timer_state';

interface TimerPersistState {
  focusTarget: FocusTarget | null;
  durationMinutes: number;
  startedAt: string | null;
  isRunning: boolean;
  pausedSecondsLeft: number | null;
  // Break state
  onBreak: boolean;
  breakDurationMinutes: number;
  breakStartedAt: string | null;
}

const saveTimerState = (state: TimerPersistState) => {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
};

const clearTimerState = () => {
  localStorage.removeItem(TIMER_STORAGE_KEY);
};

const loadTimerState = (): TimerPersistState | null => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const calcSecondsLeft = (startedAt: string, durationMinutes: number): number => {
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.ceil(durationMinutes * 60 - elapsed));
};

const PomodoroTimer: React.FC = () => {
  const { subjects, tasks, sessionLogs, addSubject, addSessionLog } = useAppState();
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<'study' | 'skill'>('study');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRestoredRef = useRef(false);

  // Break state
  const [onBreak, setOnBreak] = useState(false);
  const [breakDurationMinutes, setBreakDurationMinutes] = useState(5);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0);
  const [breakStartedAt, setBreakStartedAt] = useState<string | null>(null);
  const [showBreakDialog, setShowBreakDialog] = useState(false);
  const breakIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore persisted timer state on mount
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    const saved = loadTimerState();
    if (!saved) return;

    setFocusTarget(saved.focusTarget);
    setDurationMinutes(saved.durationMinutes);

    // Restore break state
    if (saved.onBreak && saved.breakStartedAt) {
      const breakRemaining = calcSecondsLeft(saved.breakStartedAt, saved.breakDurationMinutes);
      if (breakRemaining > 0) {
        setOnBreak(true);
        setBreakDurationMinutes(saved.breakDurationMinutes);
        setBreakStartedAt(saved.breakStartedAt);
        setBreakSecondsLeft(breakRemaining);
        // Preserve study timer paused state
        if (saved.startedAt && saved.pausedSecondsLeft != null) {
          setStartedAt(saved.startedAt);
          setSecondsLeft(saved.pausedSecondsLeft);
        }
        return;
      } else {
        // Break expired while away — auto-resume study
        toast({ title: '☕ Break over!', description: 'Your study session has resumed automatically.' });
        if (saved.startedAt && saved.pausedSecondsLeft != null) {
          const now = new Date();
          const adjustedStart = new Date(now.getTime() - (saved.durationMinutes * 60 - saved.pausedSecondsLeft) * 1000);
          setStartedAt(adjustedStart.toISOString());
          setSecondsLeft(saved.pausedSecondsLeft);
          setIsRunning(true);
          return;
        }
      }
    }

    if (saved.isRunning && saved.startedAt) {
      const remaining = calcSecondsLeft(saved.startedAt, saved.durationMinutes);
      if (remaining > 0) {
        setStartedAt(saved.startedAt);
        setSecondsLeft(remaining);
        setIsRunning(true);
      } else {
        // Timer expired while away
        setStartedAt(saved.startedAt);
        setSecondsLeft(0);
        clearTimerState();
        toast({ title: '🎉 Session Complete!', description: `Your ${saved.durationMinutes}-minute focus session has ended.` });
        if (saved.focusTarget && saved.startedAt) {
          addSessionLog({
            subject_id: saved.focusTarget.subjectId,
            task_id: saved.focusTarget.type === 'task' ? saved.focusTarget.taskId : undefined,
            duration_minutes: saved.durationMinutes,
            started_at: saved.startedAt,
            completed_at: new Date(new Date(saved.startedAt).getTime() + saved.durationMinutes * 60000).toISOString(),
            date: format(new Date(saved.startedAt), 'yyyy-MM-dd'),
          });
        }
      }
    } else if (!saved.isRunning && saved.startedAt && saved.pausedSecondsLeft != null) {
      setStartedAt(saved.startedAt);
      setSecondsLeft(saved.pausedSecondsLeft);
    } else {
      setSecondsLeft(saved.durationMinutes * 60);
    }
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (!hasRestoredRef.current) return;
    saveTimerState({
      focusTarget,
      durationMinutes,
      startedAt,
      isRunning,
      pausedSecondsLeft: !isRunning && startedAt ? secondsLeft : null,
      onBreak,
      breakDurationMinutes,
      breakStartedAt,
    });
  }, [focusTarget, durationMinutes, startedAt, isRunning, secondsLeft, onBreak, breakDurationMinutes, breakStartedAt]);

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const todoTasks = activeTasks.filter(t => t.status === 'todo');
  const kanbanTasks = activeTasks.filter(t => t.status === 'in_progress');

  const selectedSubjectId = focusTarget?.subjectId || '';
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      if (!startedAt) return;
      const remaining = calcSecondsLeft(startedAt, durationMinutes);
      if (remaining <= 0) {
        clearInterval(intervalRef.current!);
        setIsRunning(false);
        setSecondsLeft(0);
        completeSession();
        return;
      }
      setSecondsLeft(remaining);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, startedAt, durationMinutes]);

  const sendNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const completeSession = useCallback(() => {
    if (!focusTarget || !startedAt) return;
    clearTimerState();
    toast({ title: '🎉 Session Complete!', description: `Your ${durationMinutes}-minute focus session has ended.` });
    sendNotification('Session Complete!', `Your ${durationMinutes}-minute focus session has ended.`);
    addSessionLog({
      subject_id: focusTarget.subjectId,
      task_id: focusTarget.type === 'task' ? focusTarget.taskId : undefined,
      duration_minutes: durationMinutes,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setStartedAt(null);
  }, [focusTarget, startedAt, durationMinutes, addSessionLog]);

  // Break timer tick
  useEffect(() => {
    if (!onBreak || !breakStartedAt) return;
    breakIntervalRef.current = setInterval(() => {
      const remaining = calcSecondsLeft(breakStartedAt, breakDurationMinutes);
      if (remaining <= 0) {
        clearInterval(breakIntervalRef.current!);
        // Break ended — auto-resume study
        setOnBreak(false);
        setBreakStartedAt(null);
        setBreakSecondsLeft(0);
        toast({ title: '☕ Break over!', description: 'Your study session has resumed automatically.' });
        sendNotification('Break over!', 'Your study session has resumed.');
        // Auto-resume
        if (startedAt) {
          const now = new Date();
          const adjustedStart = new Date(now.getTime() - (durationMinutes * 60 - secondsLeft) * 1000);
          setStartedAt(adjustedStart.toISOString());
          setIsRunning(true);
        }
        return;
      }
      setBreakSecondsLeft(remaining);
    }, 1000);
    return () => { if (breakIntervalRef.current) clearInterval(breakIntervalRef.current); };
  }, [onBreak, breakStartedAt, breakDurationMinutes, startedAt, secondsLeft, durationMinutes]);

  const handleStart = () => {
    if (!focusTarget) return;
    if (!startedAt) {
      // Fresh start — record start time based on current seconds left
      const now = new Date();
      const adjustedStart = new Date(now.getTime() - (durationMinutes * 60 - secondsLeft) * 1000);
      setStartedAt(adjustedStart.toISOString());
    }
    setIsRunning(true);
  };

  const handlePause = () => setIsRunning(false);

  const handleStartBreak = (minutes: number) => {
    setIsRunning(false);
    setOnBreak(true);
    setBreakDurationMinutes(minutes);
    setBreakStartedAt(new Date().toISOString());
    setBreakSecondsLeft(minutes * 60);
    setShowBreakDialog(false);
  };

  const handleEndBreakEarly = () => {
    setOnBreak(false);
    setBreakStartedAt(null);
    setBreakSecondsLeft(0);
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    // Auto-resume study
    if (startedAt) {
      const now = new Date();
      const adjustedStart = new Date(now.getTime() - (durationMinutes * 60 - secondsLeft) * 1000);
      setStartedAt(adjustedStart.toISOString());
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setOnBreak(false);
    setBreakStartedAt(null);
    setBreakSecondsLeft(0);
    setSecondsLeft(durationMinutes * 60);
    setStartedAt(null);
    clearTimerState();
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
  };

  const [durationInput, setDurationInput] = useState(String(durationMinutes));

  // Keep input in sync when durationMinutes changes externally
  useEffect(() => {
    if (!isRunning && !startedAt) setDurationInput(String(durationMinutes));
  }, [durationMinutes]);

  const handleDurationInputChange = (val: string) => {
    // Allow empty string while typing
    setDurationInput(val);
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 120) {
      setDurationMinutes(num);
      if (!isRunning && !startedAt) setSecondsLeft(num * 60);
    }
  };

  const handleDurationBlur = () => {
    const num = parseInt(durationInput);
    if (isNaN(num) || num < 1) {
      setDurationMinutes(1);
      setDurationInput('1');
      if (!isRunning && !startedAt) setSecondsLeft(60);
    } else if (num > 120) {
      setDurationMinutes(120);
      setDurationInput('120');
      if (!isRunning && !startedAt) setSecondsLeft(120 * 60);
    }
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    addSubject({ name: newSubjectName.trim(), category: newSubjectCategory, color });
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const selectSubject = (id: string) => setFocusTarget({ type: 'subject', subjectId: id });
  const selectTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task?.subject_id) return;
    setFocusTarget({ type: 'task', taskId, subjectId: task.subject_id });
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = startedAt ? ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100 : 0;
  const todayLogs = sessionLogs.filter(l => l.date === format(new Date(), 'yyyy-MM-dd'));

  const focusLabel = focusTarget
    ? focusTarget.type === 'subject'
      ? selectedSubject?.name
      : tasks.find(t => t.id === (focusTarget as any).taskId)?.title
    : null;

  return (
    <div className="space-y-6">
      <Card className="p-8 text-center space-y-6">
        {/* Focus Target Selection */}
        <Tabs defaultValue="subject" className="w-full max-w-md mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="subject" className="gap-1 text-xs"><BookOpen className="h-3.5 w-3.5" /> Subject</TabsTrigger>
            <TabsTrigger value="todo" className="gap-1 text-xs"><ListTodo className="h-3.5 w-3.5" /> Todo</TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1 text-xs"><Columns3 className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
          </TabsList>
          <TabsContent value="subject" className="mt-3">
            <div className="flex items-center gap-2">
              <Select value={focusTarget?.type === 'subject' ? focusTarget.subjectId : ''} onValueChange={selectSubject}>
                <SelectTrigger><SelectValue placeholder="Select a subject..." /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[s.color] }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Subject</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <Input placeholder="Subject name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} />
                    <Select value={newSubjectCategory} onValueChange={(v: 'study' | 'skill') => setNewSubjectCategory(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="study">Study</SelectItem>
                        <SelectItem value="skill">Skill</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddSubject} className="w-full">Add Subject</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>
          <TabsContent value="todo" className="mt-3">
            <Select value={focusTarget?.type === 'task' ? (focusTarget as any).taskId : ''} onValueChange={selectTask}>
              <SelectTrigger><SelectValue placeholder="Select a todo..." /></SelectTrigger>
              <SelectContent>
                {todoTasks.filter(t => t.subject_id).map(t => {
                  const subj = subjects.find(s => s.id === t.subject_id);
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {subj && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[subj.color] }} />}
                        <span className="truncate">{t.title}</span>
                        {subj && <span className="text-xs text-muted-foreground">({subj.name})</span>}
                      </div>
                    </SelectItem>
                  );
                })}
                {todoTasks.filter(t => t.subject_id).length === 0 && (
                  <div className="px-2 py-4 text-xs text-muted-foreground text-center">No todos linked to a subject</div>
                )}
              </SelectContent>
            </Select>
          </TabsContent>
          <TabsContent value="kanban" className="mt-3">
            <Select value={focusTarget?.type === 'task' ? (focusTarget as any).taskId : ''} onValueChange={selectTask}>
              <SelectTrigger><SelectValue placeholder="Select a kanban card..." /></SelectTrigger>
              <SelectContent>
                {kanbanTasks.filter(t => t.subject_id).map(t => {
                  const subj = subjects.find(s => s.id === t.subject_id);
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {subj && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[subj.color] }} />}
                        <span className="truncate">{t.title}</span>
                        {subj && <span className="text-xs text-muted-foreground">({subj.name})</span>}
                      </div>
                    </SelectItem>
                  );
                })}
                {kanbanTasks.filter(t => t.subject_id).length === 0 && (
                  <div className="px-2 py-4 text-xs text-muted-foreground text-center">No in-progress cards linked to a subject</div>
                )}
              </SelectContent>
            </Select>
          </TabsContent>
        </Tabs>

        {/* Timer Display */}
        {onBreak ? (
          /* Break countdown display */
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-56 h-56 -rotate-90">
              <circle cx="112" cy="112" r="100" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="112" cy="112" r="100" fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - (breakDurationMinutes * 60 - breakSecondsLeft) / (breakDurationMinutes * 60))}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Coffee className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="timer-display">{String(Math.floor(breakSecondsLeft / 60)).padStart(2, '0')}:{String(breakSecondsLeft % 60).padStart(2, '0')}</span>
              <span className="text-sm text-muted-foreground mt-1">Break</span>
            </div>
          </div>
        ) : (
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-56 h-56 -rotate-90">
              <circle cx="112" cy="112" r="100" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
              <circle
                cx="112" cy="112" r="100" fill="none"
                stroke={selectedSubject ? SUBJECT_COLOR_MAP[selectedSubject.color] : 'hsl(var(--primary))'}
                strokeWidth="6" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="timer-display">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
              {focusLabel && (
                <span className="text-sm text-muted-foreground mt-1 max-w-[160px] truncate">{focusLabel}</span>
              )}
            </div>
          </div>
        )}

        {/* Duration Presets & Input */}
        {!onBreak && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-1.5">
              {[15, 25, 45, 60].map(preset => (
                <Button
                  key={preset}
                  variant={durationMinutes === preset && !isRunning && !startedAt ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 px-3 text-xs font-mono"
                  disabled={isRunning || !!startedAt}
                  onClick={() => {
                    setDurationMinutes(preset);
                    setDurationInput(String(preset));
                    setSecondsLeft(preset * 60);
                  }}
                >
                  {preset}m
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min={1}
                  max={120}
                  value={durationInput}
                  onChange={e => handleDurationInputChange(e.target.value)}
                  onBlur={handleDurationBlur}
                  className="w-14 text-center font-mono border-0 bg-transparent p-0 h-auto text-lg focus-visible:ring-0"
                  disabled={isRunning || !!startedAt}
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
              {'Notification' in window && Notification.permission !== 'granted' && (
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={requestNotificationPermission}>
                  <Bell className="h-3.5 w-3.5" /> Enable alerts
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {onBreak ? (
            <Button onClick={handleEndBreakEarly} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> End Break & Resume
            </Button>
          ) : !isRunning ? (
            <Button onClick={handleStart} disabled={!focusTarget} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> {startedAt ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} variant="secondary" size="lg" className="gap-2">
                <Pause className="h-4 w-4" /> Pause
              </Button>
              <Dialog open={showBreakDialog} onOpenChange={setShowBreakDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="gap-2">
                    <Coffee className="h-4 w-4" /> Break
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Coffee className="h-5 w-5" /> Take a Break</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Study will auto-resume after your break ends.</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[3, 5, 10].map(m => (
                        <Button key={m} variant="outline" className="h-12 text-lg font-mono" onClick={() => handleStartBreak(m)}>
                          {m}m
                        </Button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
          <Button onClick={handleReset} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </Button>
        </div>
      </Card>

      {/* Today's Sessions */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" /> Today's Sessions
        </h3>
        {todayLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions yet today. Start your first session!</p>
        ) : (
          <div className="space-y-2">
            {todayLogs.map(log => {
              const subj = subjects.find(s => s.id === log.subject_id);
              const task = log.task_id ? tasks.find(t => t.id === log.task_id) : null;
              return (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subj ? SUBJECT_COLOR_MAP[subj.color] : 'gray' }} />
                    <span className="text-sm font-medium">{subj?.name || 'Unknown'}</span>
                    {task && <span className="text-xs text-muted-foreground">· {task.title}</span>}
                  </div>
                  <span className="text-sm font-mono text-muted-foreground">{formatMinutes(log.duration_minutes)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Subject Stats */}
      {subjects.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Subject Progress</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {subjects.map(s => {
              const total = getSubjectTotalMinutes(sessionLogs, s.id);
              const todayMin = getSubjectTodayMinutes(sessionLogs, s.id);
              const { level, title } = getSubjectLevel(total);
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: SUBJECT_COLOR_MAP[s.color] + '22', color: SUBJECT_COLOR_MAP[s.color] }}>
                    L{level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{title} · {formatMinutes(total)} total · {formatMinutes(todayMin)} today</div>
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

export default PomodoroTimer;
