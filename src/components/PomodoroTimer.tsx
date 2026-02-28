import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppState } from '@/contexts/AppContext';
import { SUBJECT_COLORS, SUBJECT_COLOR_MAP } from '@/types';
import { getSubjectTotalMinutes, getSubjectTodayMinutes, formatMinutes, getSubjectLevel } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Play, Pause, RotateCcw, Plus, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

const PomodoroTimer: React.FC = () => {
  const { subjects, sessionLogs, addSubject, addSessionLog } = useAppState();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCategory, setNewSubjectCategory] = useState<'study' | 'skill'>('study');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          completeSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const completeSession = useCallback(() => {
    if (!selectedSubjectId || !startedAt) return;
    addSessionLog({
      subject_id: selectedSubjectId,
      duration_minutes: durationMinutes,
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setStartedAt(null);
  }, [selectedSubjectId, startedAt, durationMinutes, addSessionLog]);

  const handleStart = () => {
    if (!selectedSubjectId) return;
    setIsRunning(true);
    if (!startedAt) {
      setStartedAt(new Date().toISOString());
    }
  };

  const handlePause = () => setIsRunning(false);

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(durationMinutes * 60);
    setStartedAt(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleDurationChange = (val: string) => {
    const num = parseInt(val) || 25;
    setDurationMinutes(num);
    if (!isRunning && !startedAt) setSecondsLeft(num * 60);
  };

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    addSubject({
      name: newSubjectName.trim(),
      category: newSubjectCategory,
      color,
    });
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progress = startedAt ? ((durationMinutes * 60 - secondsLeft) / (durationMinutes * 60)) * 100 : 0;
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
  const todayLogs = sessionLogs.filter(l => l.date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="space-y-6">
      {/* Timer Card */}
      <Card className="p-8 text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a subject..." />
            </SelectTrigger>
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

        {/* Timer Display */}
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
            {selectedSubject && (
              <span className="text-sm text-muted-foreground mt-1">{selectedSubject.name}</span>
            )}
          </div>
        </div>

        {/* Duration Input */}
        <div className="flex items-center justify-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={120}
            value={durationMinutes}
            onChange={e => handleDurationChange(e.target.value)}
            className="w-20 text-center font-mono"
            disabled={isRunning}
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {!isRunning ? (
            <Button onClick={handleStart} disabled={!selectedSubjectId} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> {startedAt ? 'Resume' : 'Start'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" size="lg" className="gap-2">
              <Pause className="h-4 w-4" /> Pause
            </Button>
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
              return (
                <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subj ? SUBJECT_COLOR_MAP[subj.color] : 'gray' }} />
                    <span className="text-sm font-medium">{subj?.name || 'Unknown'}</span>
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
