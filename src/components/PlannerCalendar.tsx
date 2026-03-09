import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { Task, Subject, TaskPriority } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarViewMode = 'day' | 'week' | 'month';

interface PlannerCalendarProps {
  tasks: Task[];
  subjects: Subject[];
  onAddTask: (task: { title: string; scheduled_date?: string; start_time?: string; end_time?: string; priority: TaskPriority; subject_id?: string }) => Promise<void>;
  onUpdateTask: (task: Task) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

// Generate time options in 15-min intervals
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_OPTIONS.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
  }
}

function formatHour(hour: number): string {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
}

function formatTimeLabel(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getTaskColor(task: Task, subjects: Subject[]): string {
  if (task.subject_id) {
    const subject = subjects.find(s => s.id === task.subject_id);
    if (subject) {
      const colorMap: Record<string, string> = {
        'subject-blue': 'hsl(210, 80%, 55%)',
        'subject-green': 'hsl(160, 60%, 45%)',
        'subject-orange': 'hsl(30, 90%, 56%)',
        'subject-pink': 'hsl(340, 65%, 55%)',
        'subject-purple': 'hsl(270, 60%, 55%)',
        'subject-teal': 'hsl(180, 55%, 45%)',
      };
      return colorMap[subject.color] || 'hsl(var(--primary))';
    }
  }
  const priorityColors: Record<string, string> = {
    high: 'hsl(0, 72%, 51%)',
    medium: 'hsl(30, 90%, 56%)',
    low: 'hsl(210, 80%, 55%)',
  };
  return priorityColors[task.priority] || 'hsl(var(--primary))';
}

const PlannerCalendar: React.FC<PlannerCalendarProps> = ({
  tasks, subjects, onAddTask, onUpdateTask, onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragStart, setDragStart] = useState<{ date: string; minutes: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [dragDate, setDragDate] = useState<string | null>(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');
  const [newTaskSubject, setNewTaskSubject] = useState<string>('');
  const [pendingSlot, setPendingSlot] = useState<{ date: string; start: string; end: string } | null>(null);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);
  // Resize state
  const [resizingTask, setResizingTask] = useState<Task | null>(null);
  const [resizeEndMinutes, setResizeEndMinutes] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const scrollTo = (now.getHours() - 1) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollTo);
    }
  }, [viewMode]);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate(prev => {
      if (viewMode === 'day') return addDays(prev, dir);
      if (viewMode === 'week') return dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1);
      return dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1);
    });
  }, [viewMode]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  const visibleDays = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [viewMode, currentDate]);

  const headerLabel = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy');
    if (viewMode === 'day') return format(currentDate, 'EEEE, MMMM d, yyyy');
    const start = visibleDays[0];
    const end = visibleDays[visibleDays.length - 1];
    if (start.getMonth() === end.getMonth()) return format(start, 'MMMM yyyy');
    return `${format(start, 'MMM')} – ${format(end, 'MMM yyyy')}`;
  }, [viewMode, currentDate, visibleDays]);

  const getTasksForDay = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(t => t.scheduled_date === dateStr && t.start_time && t.end_time);
  }, [tasks]);

  const getUntimed = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(t => t.scheduled_date === dateStr && (!t.start_time || !t.end_time));
  }, [tasks]);

  // Mouse handlers for drag-to-create
  const handleMouseDown = useCallback((date: string, e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingTask || resizingTask) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.floor(y / HOUR_HEIGHT * 60 / 15) * 15;
    setDragStart({ date, minutes });
    setDragEnd(minutes + 15);
    setDragDate(date);
    isDragging.current = true;
  }, [draggingTask, resizingTask]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Handle resize
    if (resizingTask) {
      const columns = e.currentTarget.querySelectorAll('[data-day-column]');
      // Find the column for the resizing task
      const dateStr = resizingTask.scheduled_date;
      let rect: DOMRect | null = null;
      columns.forEach(col => {
        if (col.getAttribute('data-day-column') === dateStr) {
          rect = col.getBoundingClientRect();
        }
      });
      if (!rect) {
        // fallback: use the grid container
        rect = e.currentTarget.getBoundingClientRect();
      }
      const y = e.clientY - (rect as DOMRect).top;
      const minutes = Math.max(0, Math.min(24 * 60, Math.floor(y / HOUR_HEIGHT * 60 / 15) * 15));
      const startMin = timeToMinutes(resizingTask.start_time!);
      setResizeEndMinutes(Math.max(startMin + 15, minutes));
      return;
    }
    if (!isDragging.current || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.max(0, Math.min(24 * 60, Math.floor(y / HOUR_HEIGHT * 60 / 15) * 15));
    setDragEnd(minutes);
  }, [dragStart, resizingTask]);

  const handleMouseUp = useCallback(() => {
    // Handle resize end
    if (resizingTask && resizeEndMinutes !== null) {
      onUpdateTask({
        ...resizingTask,
        end_time: minutesToTime(resizeEndMinutes),
      });
      setResizingTask(null);
      setResizeEndMinutes(null);
      return;
    }

    if (!isDragging.current || !dragStart || dragEnd === null) {
      isDragging.current = false;
      return;
    }
    isDragging.current = false;
    const startMin = Math.min(dragStart.minutes, dragEnd);
    const endMin = Math.max(dragStart.minutes, dragEnd);
    if (endMin - startMin < 15) {
      setDragStart(null);
      setDragEnd(null);
      setDragDate(null);
      return;
    }
    setPendingSlot({
      date: dragStart.date,
      start: minutesToTime(startMin),
      end: minutesToTime(endMin),
    });
    setShowTaskDialog(true);
    setDragStart(null);
    setDragEnd(null);
    setDragDate(null);
  }, [dragStart, dragEnd, resizingTask, resizeEndMinutes, onUpdateTask]);

  // Resize start handler
  const handleResizeStart = useCallback((e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingTask(task);
    setResizeEndMinutes(timeToMinutes(task.end_time!));
  }, []);

  // Task drag to move
  const handleTaskDragStart = useCallback((e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
    setDraggingTask(task);
  }, []);

  const handleDayDrop = useCallback((date: string, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!draggingTask) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const dropMinutes = Math.floor(y / HOUR_HEIGHT * 60 / 15) * 15;
    const duration = draggingTask.start_time && draggingTask.end_time
      ? timeToMinutes(draggingTask.end_time) - timeToMinutes(draggingTask.start_time)
      : 60;
    onUpdateTask({
      ...draggingTask,
      scheduled_date: date,
      start_time: minutesToTime(dropMinutes),
      end_time: minutesToTime(dropMinutes + duration),
    });
    setDraggingTask(null);
  }, [draggingTask, onUpdateTask]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!newTaskTitle.trim() || !pendingSlot) return;
    await onAddTask({
      title: newTaskTitle.trim(),
      scheduled_date: pendingSlot.date,
      start_time: pendingSlot.start,
      end_time: pendingSlot.end,
      priority: newTaskPriority,
      subject_id: newTaskSubject && newTaskSubject !== 'none' ? newTaskSubject : undefined,
    });
    setNewTaskTitle('');
    setNewTaskPriority('medium');
    setNewTaskSubject('');
    setPendingSlot(null);
    setShowTaskDialog(false);
  }, [newTaskTitle, pendingSlot, newTaskPriority, newTaskSubject, onAddTask]);

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const currentTimeTop = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_HEIGHT;

  // Global mouseup listener for resize
  useEffect(() => {
    const onUp = () => {
      if (resizingTask && resizeEndMinutes !== null) {
        onUpdateTask({
          ...resizingTask,
          end_time: minutesToTime(resizeEndMinutes),
        });
        setResizingTask(null);
        setResizeEndMinutes(null);
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [resizingTask, resizeEndMinutes, onUpdateTask]);

  const renderDayColumn = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = getTasksForDay(date);
    const isCurrentDay = isToday(date);

    return (
      <div
        key={dateStr}
        data-day-column={dateStr}
        className="relative border-l border-border flex-1 min-w-0"
        onMouseDown={(e) => handleMouseDown(dateStr, e)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDayDrop(dateStr, e)}
        style={{ height: 24 * HOUR_HEIGHT }}
      >
        {HOURS.map(h => (
          <div key={h} className="absolute w-full border-t border-border/50" style={{ top: h * HOUR_HEIGHT }} />
        ))}
        {HOURS.map(h => (
          <div key={`half-${h}`} className="absolute w-full border-t border-border/20" style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }} />
        ))}

        {isCurrentDay && (
          <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: currentTimeTop }}>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1.5 shrink-0" />
              <div className="flex-1 h-[2px] bg-destructive" />
            </div>
          </div>
        )}

        {isDragging.current && dragStart && dragDate === dateStr && dragEnd !== null && (
          <div
            className="absolute left-1 right-1 rounded-md bg-primary/20 border border-primary/40 z-20 pointer-events-none"
            style={{
              top: Math.min(dragStart.minutes, dragEnd) / 60 * HOUR_HEIGHT,
              height: Math.abs(dragEnd - dragStart.minutes) / 60 * HOUR_HEIGHT,
            }}
          />
        )}

        {dayTasks.map(task => {
          const startMin = timeToMinutes(task.start_time!);
          const isResizing = resizingTask?.id === task.id;
          const endMin = isResizing && resizeEndMinutes !== null ? resizeEndMinutes : timeToMinutes(task.end_time!);
          const top = startMin / 60 * HOUR_HEIGHT;
          const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, 20);
          const color = getTaskColor(task, subjects);

          return (
            <div
              key={task.id}
              draggable={!isResizing}
              onDragStart={(e) => handleTaskDragStart(e, task)}
              className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs z-10 overflow-hidden select-none group"
              style={{
                top,
                height,
                backgroundColor: color,
                color: '#fff',
                opacity: task.status === 'done' ? 0.5 : 1,
                cursor: isResizing ? 'ns-resize' : 'grab',
              }}
              title={`${task.title}\n${task.start_time} – ${task.end_time}`}
            >
              <div className="font-medium truncate">{task.title}</div>
              {height > 30 && (
                <div className="opacity-75 text-[10px]">
                  {task.start_time} – {isResizing && resizeEndMinutes !== null ? minutesToTime(resizeEndMinutes) : task.end_time}
                </div>
              )}
              {/* Resize handle */}
              <div
                className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.3))' }}
                onMouseDown={(e) => handleResizeStart(e, task)}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const weeks: Date[][] = [];
    let day = calendarStart;
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(day);
        day = addDays(day, 1);
      }
      weeks.push(week);
    }

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="px-2 py-2 text-xs font-medium text-muted-foreground text-center">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-b-0">
            {week.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasks.filter(t => t.scheduled_date === dateStr);
              const inMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[100px] p-1 border-l border-border first:border-l-0 cursor-pointer hover:bg-accent/30 transition-colors",
                    !inMonth && "opacity-40"
                  )}
                  onClick={() => { setCurrentDate(day); setViewMode('day'); }}
                >
                  <div className={cn(
                    "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                    isToday(day) && "bg-destructive text-destructive-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => (
                      <div key={t.id} className="text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: getTaskColor(t, subjects) }}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{headerLabel}</h2>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-md p-1">
          {(['day', 'week', 'month'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "px-3 py-1 text-sm rounded-sm capitalize transition-colors",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'month' && renderMonthView()}

      {(viewMode === 'day' || viewMode === 'week') && (
        <div className="flex-1 border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="flex border-b border-border bg-muted/30 shrink-0">
            <div className="w-16 shrink-0" />
            {visibleDays.map(day => (
              <div key={format(day, 'yyyy-MM-dd')} className="flex-1 text-center py-2 border-l border-border min-w-0">
                <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                <div className={cn(
                  "text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mx-auto",
                  isToday(day) && "bg-destructive text-destructive-foreground"
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          <div className="flex border-b border-border shrink-0">
            <div className="w-16 shrink-0 text-[10px] text-muted-foreground px-2 py-1">All-day</div>
            {visibleDays.map(day => {
              const untimed = getUntimed(day);
              return (
                <div key={format(day, 'yyyy-MM-dd')} className="flex-1 border-l border-border p-0.5 min-h-[28px] min-w-0">
                  {untimed.slice(0, 2).map(t => (
                    <div key={t.id} className="text-[10px] px-1 py-0.5 rounded truncate text-white mb-0.5"
                      style={{ backgroundColor: getTaskColor(t, subjects) }}>
                      {t.title}
                    </div>
                  ))}
                  {untimed.length > 2 && <div className="text-[9px] text-muted-foreground px-1">+{untimed.length - 2}</div>}
                </div>
              );
            })}
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <div className="flex" style={{ height: 24 * HOUR_HEIGHT }}>
              <div className="w-16 shrink-0 relative">
                {HOURS.map(h => (
                  <div key={h} className="absolute w-full text-right pr-2 text-xs text-muted-foreground -translate-y-1/2"
                    style={{ top: h * HOUR_HEIGHT }}>
                    {h > 0 ? formatHour(h) : ''}
                  </div>
                ))}
              </div>
              {visibleDays.map(day => renderDayColumn(day))}
            </div>
          </div>
        </div>
      )}

      {/* Create task dialog */}
      <Dialog open={showTaskDialog} onOpenChange={(open) => {
        if (!open) { setShowTaskDialog(false); setPendingSlot(null); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          {pendingSlot && (
            <div className="text-sm text-muted-foreground mb-2">
              {format(new Date(pendingSlot.date + 'T00:00:00'), 'EEEE, MMMM d')} · {formatTimeLabel(pendingSlot.start)} – {formatTimeLabel(pendingSlot.end)}
            </div>
          )}
          <div className="space-y-3">
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
              autoFocus
            />
            {/* Start / End time dropdowns */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                <Select
                  value={pendingSlot?.start || '09:00'}
                  onValueChange={v => setPendingSlot(prev => prev ? { ...prev, start: v } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">End</label>
                <Select
                  value={pendingSlot?.end || '10:00'}
                  onValueChange={v => setPendingSlot(prev => prev ? { ...prev, end: v } : null)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-48">
                    {TIME_OPTIONS.map(t => (
                      <SelectItem key={t} value={t}>{formatTimeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={newTaskPriority} onValueChange={v => setNewTaskPriority(v as TaskPriority)}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              {subjects.length > 0 && (
                <Select value={newTaskSubject} onValueChange={setNewTaskSubject}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button onClick={handleCreateTask} className="w-full" disabled={!newTaskTitle.trim()}>
              Create Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlannerCalendar;
