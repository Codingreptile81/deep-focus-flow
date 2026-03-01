import React, { useState } from 'react';
import { Task, TaskPriority, TaskRecurrence, Subject, Habit, HabitLog, SUBJECT_COLOR_MAP } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import TaskCard from '@/components/TaskCard';
import ActivityCalendar from '@/components/ActivityCalendar';

interface PlannerViewProps {
  tasks: Task[];
  subjects: Subject[];
  habits: Habit[];
  habitLogs: HabitLog[];
  onAddTask: (task: { title: string; description?: string; scheduled_date?: string; deadline?: string; start_time?: string; end_time?: string; priority: TaskPriority; recurrence?: TaskRecurrence; subject_id?: string; estimate_minutes?: number }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ tasks, subjects, habits, habitLogs, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasks
    .filter(t => t.scheduled_date === dateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setPriority('medium');
    setRecurrence('none');
    setSubjectId('none');
    setEstimateMinutes('');
    setDeadline(undefined);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <ActivityCalendar
          tasks={tasks}
          habitLogs={habitLogs}
          habits={habits}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
        />
      </div>

      <div className="space-y-3 relative min-h-[300px]">
        <h3 className="text-sm font-semibold">Tasks for {format(selectedDate, 'MMM d, yyyy')}</h3>
        {dayTasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks scheduled for this day</p>
        )}
        {dayTasks.map(task => (
          <TaskCard key={task.id} task={task} subjects={subjects} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} showMoveButtons={false} />
        ))}

        {/* Floating Add Button */}
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 transition-transform"
            >
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
                  <SelectItem value="none">No subject</SelectItem>
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
