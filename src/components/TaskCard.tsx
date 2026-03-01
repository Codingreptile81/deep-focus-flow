import React, { useState } from 'react';
import { Task, TaskStatus, Subject, SUBJECT_COLOR_MAP } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Clock, Trash2, Repeat, Timer, Check, X, AlertTriangle, CalendarIcon } from 'lucide-react';
import { formatMinutes } from '@/lib/analytics';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const PRIORITY_COLORS: Record<string, { border: string; badge: string }> = {
  high: { border: 'border-l-4 border-l-[hsl(0,72%,51%)]', badge: 'bg-[hsl(0,72%,51%)] text-white' },
  medium: { border: 'border-l-4 border-l-[hsl(45,93%,47%)]', badge: 'bg-[hsl(45,93%,47%)] text-white' },
  low: { border: 'border-l-4 border-l-[hsl(160,60%,45%)]', badge: 'bg-[hsl(160,60%,45%)] text-white' },
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

interface TaskCardProps {
  task: Task;
  subjects?: Subject[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  showMoveButtons?: boolean;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, subjects = [], onUpdateTask, onDeleteTask, showMoveButtons = true, isDragging = false }) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editSubjectId, setEditSubjectId] = useState(task.subject_id || 'none');
  const [editEstimate, setEditEstimate] = useState(task.estimate_minutes?.toString() || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(task.deadline ? parseISO(task.deadline) : undefined);
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < STATUS_ORDER.length - 1;
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const linkedSubject = task.subject_id ? subjects.find(s => s.id === task.subject_id) : null;

  const deadlineOrScheduled = task.deadline || task.scheduled_date;
  const isOverdue = task.status !== 'done' && deadlineOrScheduled && isBefore(parseISO(deadlineOrScheduled), startOfDay(new Date()));

  const moveStatus = (direction: -1 | 1) => {
    const newStatus = STATUS_ORDER[currentIdx + direction];
    onUpdateTask({ ...task, status: newStatus });
  };

  const startEdit = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setEditing(true);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditSubjectId(task.subject_id || 'none');
    setEditEstimate(task.estimate_minutes?.toString() || '');
    setEditPriority(task.priority);
    setEditDeadline(task.deadline ? parseISO(task.deadline) : undefined);
  };

  const saveEdit = () => {
    if (!editTitle.trim()) return;
    onUpdateTask({
      ...task,
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      subject_id: editSubjectId === 'none' ? undefined : editSubjectId,
      estimate_minutes: editEstimate ? parseInt(editEstimate) : undefined,
      priority: editPriority,
      deadline: editDeadline ? format(editDeadline, 'yyyy-MM-dd') : undefined,
    });
    setEditing(false);
  };

  const cancelEdit = () => setEditing(false);

  if (editing) {
    return (
      <Card className={`${colors.border} transition-all ring-2 ring-primary/30`}>
        <CardContent className="p-3 space-y-2">
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="h-8 text-sm" autoFocus />
          <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="h-8 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={editSubjectId} onValueChange={setEditSubjectId}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No subject</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[s.color] }} />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={editPriority} onValueChange={v => setEditPriority(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input type="number" value={editEstimate} onChange={e => setEditEstimate(e.target.value)} placeholder="Estimate (min)" className="h-8 text-sm" min={1} />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-8 text-xs", !editDeadline && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-3 w-3" />
                {editDeadline ? format(editDeadline, 'PPP') : <span>Deadline (optional)</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={editDeadline} onSelect={setEditDeadline} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          {editDeadline && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setEditDeadline(undefined)}>Clear deadline</Button>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="h-7 text-xs gap-1 flex-1" onClick={saveEdit}><Check className="h-3 w-3" /> Save</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1 flex-1" onClick={cancelEdit}><X className="h-3 w-3" /> Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`group cursor-pointer ${colors.border} ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''} ${isOverdue ? 'ring-1 ring-[hsl(0,72%,51%)]/40' : ''} transition-all`}
      onClick={startEdit}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-[hsl(0,72%,51%)] shrink-0" />}
            <p className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
          </div>
          <Badge className={`shrink-0 text-[10px] border-0 ${colors.badge}`}>
            {task.priority}
          </Badge>
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          {linkedSubject && (
            <div className="flex items-center gap-1 text-xs">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: SUBJECT_COLOR_MAP[linkedSubject.color] }} />
              <span className="text-muted-foreground">{linkedSubject.name}</span>
            </div>
          )}
          {(task.deadline || task.scheduled_date) && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              <span>{task.deadline ? `Due ${format(parseISO(task.deadline), 'MMM d')}` : format(parseISO(task.scheduled_date!), 'MMM d')}</span>
              {isOverdue && <span className="text-[10px]">(overdue)</span>}
            </div>
          )}
          {(task.start_time || task.end_time) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{task.start_time || '?'} – {task.end_time || '?'}</span>
            </div>
          )}
          {task.recurrence && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Repeat className="h-3 w-3" />
              <span>{task.recurrence}</span>
            </div>
          )}
          {(task.estimate_minutes || task.actual_minutes > 0) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              <span>{formatMinutes(task.actual_minutes)}{task.estimate_minutes ? ` / ${formatMinutes(task.estimate_minutes)}` : ''}</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          {showMoveButtons ? (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canMoveLeft} onClick={() => moveStatus(-1)} title={canMoveLeft ? `Move to ${STATUS_LABELS[STATUS_ORDER[currentIdx - 1]]}` : undefined}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canMoveRight} onClick={() => moveStatus(1)} title={canMoveRight ? `Move to ${STATUS_LABELS[STATUS_ORDER[currentIdx + 1]]}` : undefined}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          ) : <div />}
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => onDeleteTask(task.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
