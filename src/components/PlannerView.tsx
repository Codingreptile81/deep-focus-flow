import React, { useState } from 'react';
import { Task, TaskPriority, TaskRecurrence } from '@/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import TaskCard from '@/components/TaskCard';

interface PlannerViewProps {
  tasks: Task[];
  onAddTask: (task: { title: string; description?: string; scheduled_date?: string; start_time?: string; end_time?: string; priority: TaskPriority; recurrence?: TaskRecurrence }) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const PlannerView: React.FC<PlannerViewProps> = ({ tasks, onAddTask, onUpdateTask, onDeleteTask }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<string>('none');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayTasks = tasks
    .filter(t => t.scheduled_date === dateStr)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  const handleAdd = () => {
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      description: description.trim() || undefined,
      scheduled_date: dateStr,
      start_time: startTime || undefined,
      end_time: endTime || undefined,
      priority,
      recurrence: recurrence === 'none' ? null : recurrence as TaskRecurrence,
    });
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setPriority('medium');
    setRecurrence('none');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={d => d && setSelectedDate(d)}
          className="rounded-md border"
        />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Add Task</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
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
            <Button className="w-full" size="sm" onClick={handleAdd} disabled={!title.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add Task
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Tasks for {format(selectedDate, 'MMM d, yyyy')}</h3>
        {dayTasks.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">No tasks scheduled for this day</p>
        )}
        {dayTasks.map(task => (
          <TaskCard key={task.id} task={task} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} showMoveButtons={false} />
        ))}
      </div>
    </div>
  );
};

export default PlannerView;
