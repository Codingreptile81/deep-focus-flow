import React, { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskPriority, TaskRecurrence, Subject, Habit, HabitLog, SUBJECT_COLOR_MAP } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CalendarIcon, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskCard from '@/components/TaskCard';

interface PlannerViewProps {
  tasks: Task[];
  subjects: Subject[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onAddTask: (task: { title: string; description?: string; scheduled_date?: string; deadline?: string; start_time?: string; end_time?: string; priority: TaskPriority; recurrence?: TaskRecurrence; subject_id?: string; estimate_minutes?: number; parent_task_id?: string }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

// Animated collapse/expand wrapper
const AnimatedCollapse: React.FC<{ open: boolean; children: React.ReactNode }> = ({ open, children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(open ? undefined : 0);
  const [overflow, setOverflow] = useState(open ? 'visible' : 'hidden');

  useEffect(() => {
    if (!ref.current) return;
    if (open) {
      const h = ref.current.scrollHeight;
      setHeight(h);
      setOverflow('hidden');
      const timer = setTimeout(() => {
        setHeight(undefined);
        setOverflow('visible');
      }, 250);
      return () => clearTimeout(timer);
    } else {
      const h = ref.current.scrollHeight;
      setHeight(h);
      setOverflow('hidden');
      // Force reflow then collapse
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setHeight(0);
        });
      });
    }
  }, [open]);

  return (
    <div
      ref={ref}
      style={{ height: height !== undefined ? `${height}px` : 'auto', overflow }}
      className="transition-[height,opacity] duration-250 ease-out"
    >
      {children}
    </div>
  );
};

const PlannerView: React.FC<PlannerViewProps> = ({ tasks, subjects, habits, habitLogs, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<string>('none');
  const [subjectId, setSubjectId] = useState<string>('none');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [groupBySubject, setGroupBySubject] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasks
    .filter(t => t.scheduled_date === dateStr && !t.parent_task_id)
    .sort((a, b) => a.position - b.position || (a.start_time || '').localeCompare(b.start_time || ''));

  const resetForm = () => {
    setTitle(''); setDescription(''); setStartTime(''); setEndTime('');
    setPriority('medium'); setRecurrence('none'); setSubjectId('none');
    setEstimateMinutes(''); setDeadline(undefined);
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_date: dateStr,
      deadline: deadline ? format(deadline, 'yyyy-MM-dd') : undefined,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      priority,
      recurrence: recurrence === 'none' ? null : recurrence as TaskRecurrence,
      subject_id: subjectId === 'none' ? undefined : subjectId,
      estimate_minutes: estimateMinutes ? parseInt(estimateMinutes) : undefined,
    });
    resetForm();
    setShowAddDialog(false);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newPosition = result.destination.index;
    const task = dayTasks.find(t => t.id === taskId);
    if (!task || task.position === newPosition) return;
    // Reorder: update positions for all affected tasks
    const reordered = [...dayTasks];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(newPosition, 0, moved);
    reordered.forEach((t, i) => {
      if (t.position !== i) {
        onUpdateTask({ ...t, position: i });
      }
    });
  };

  const handleGroupedDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const task = dayTasks.find(t => t.id === taskId);
    if (!task) return;

    const destGroupId = result.destination.droppableId;
    const newSubjectId = destGroupId === 'ungrouped' ? undefined : destGroupId;

    // Update subject if moved between groups
    if ((task.subject_id || undefined) !== newSubjectId) {
      onUpdateTask({ ...task, subject_id: newSubjectId, position: result.destination.index });
    } else if (task.position !== result.destination.index) {
      onUpdateTask({ ...task, position: result.destination.index });
    }
  };

  // Group tasks by subject
  const renderGrouped = () => {
    const grouped = new Map<string, Task[]>();
    const ungrouped: Task[] = [];
    dayTasks.forEach(t => {
      if (t.subject_id) {
        const arr = grouped.get(t.subject_id) || [];
        arr.push(t);
        grouped.set(t.subject_id, arr);
      } else {
        ungrouped.push(t);
      }
    });

    const GroupSection: React.FC<{ groupTasks: Task[]; label: string; color: string; droppableId: string }> = ({ groupTasks, label, color, droppableId }) => {
      const [open, setOpen] = useState(false);
      const doneCount = groupTasks.filter(t => t.status === 'done').length;
      const progress = groupTasks.length > 0 ? Math.round((doneCount / groupTasks.length) * 100) : 0;

      return (
        <div className="rounded-xl border bg-card overflow-hidden shadow-sm animate-fade-in">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-3 w-full py-3 px-4 hover:bg-accent/40 transition-colors text-left"
          >
            <div className="h-8 w-1 rounded-full shrink-0 transition-all duration-300" style={{ backgroundColor: color }} />
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted-foreground">{doneCount}/{groupTasks.length} done</span>
              </div>
              <div className="h-1 w-full bg-muted rounded-full mt-1.5 max-w-[200px]">
                <div
                  className="h-1 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%`, backgroundColor: color }}
                />
              </div>
            </div>
          </button>

          {/* Collapsed title list */}
          <AnimatedCollapse open={!open}>
            <div className="px-4 pb-3 pl-[3.25rem] space-y-1">
              {groupTasks.map((task, i) => (
                <div key={task.id} className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                  <div
                    className={`h-1.5 w-1.5 rounded-full shrink-0 transition-colors duration-200 ${task.status === 'done' ? 'bg-muted-foreground/40' : ''}`}
                    style={task.status !== 'done' ? { backgroundColor: color } : {}}
                  />
                  <span className={`text-xs truncate ${task.status === 'done' ? 'line-through text-muted-foreground' : 'text-foreground/80'}`}>
                    {task.title}
                  </span>
                  {task.priority === 'high' && <span className="text-[10px] text-destructive font-medium">!</span>}
                </div>
              ))}
            </div>
          </AnimatedCollapse>

          {/* Expanded: droppable task cards */}
          <AnimatedCollapse open={open}>
            <Droppable droppableId={droppableId}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 px-4 pb-4 pt-1 border-t border-border/50 min-h-[40px] transition-colors rounded-b-xl ${snapshot.isDraggingOver ? 'bg-accent/30' : ''}`}
                >
                  {groupTasks.map((task, i) => (
                    <Draggable key={task.id} draggableId={task.id} index={i}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className="animate-scale-in"
                          style={{ ...dragProvided.draggableProps.style, animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}
                        >
                          <TaskCard task={task} subjects={subjects} allTasks={tasks} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onAddTask={onAddTask} showMoveButtons={false} isDragging={dragSnapshot.isDragging} />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {groupTasks.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Drop tasks here</p>
                  )}
                </div>
              )}
            </Droppable>
          </AnimatedCollapse>
        </div>
      );
    };

    return (
      <DragDropContext onDragEnd={handleGroupedDragEnd}>
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([subjectId, sTasks]) => {
            const subject = subjects.find(s => s.id === subjectId);
            return <GroupSection key={subjectId} droppableId={subjectId} groupTasks={sTasks} label={subject?.name || 'Unknown'} color={SUBJECT_COLOR_MAP[subject?.color || 'subject-blue']} />;
          })}
          <GroupSection droppableId="ungrouped" groupTasks={ungrouped} label="Untitled" color="hsl(var(--muted-foreground))" />
        </div>
      </DragDropContext>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <div className="rounded-md border">
          <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} className="p-3" />
        </div>
      </div>

      <div className="space-y-3 relative min-h-[300px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Tasks for {format(selectedDate, 'MMM d, yyyy')}</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setGroupBySubject(!groupBySubject)}>
            {groupBySubject ? 'Ungroup' : 'Group by Subject'}
          </Button>
        </div>

        {dayTasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks scheduled for this day</p>
        )}

        {dayTasks.length > 0 && groupBySubject ? renderGrouped() : dayTasks.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="planner-tasks">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 min-h-[60px] rounded-lg p-1 transition-colors ${snapshot.isDraggingOver ? 'bg-accent/30' : ''}`}
                >
                  {dayTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                          <TaskCard
                            task={task}
                            subjects={subjects}
                            allTasks={tasks}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onAddTask={onAddTask}
                            showMoveButtons={false}
                            isDragging={dragSnapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : null}

        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 transition-transform">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Add Task — {format(selectedDate, 'MMM d, yyyy')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
              <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
              </div>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger><SelectValue placeholder="Subject (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Untitled</SelectItem>
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
              <Input type="number" placeholder="Estimate (minutes)" value={estimateMinutes} onChange={e => setEstimateMinutes(e.target.value)} min={1} />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, 'PPP') : <span>Deadline (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline} onSelect={setDeadline} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <div className="grid grid-cols-2 gap-2">
                <Select value={priority} onValueChange={v => setPriority(v as TaskPriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={recurrence} onValueChange={setRecurrence}>
                  <SelectTrigger><SelectValue placeholder="Repeat" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={!title.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PlannerView;
