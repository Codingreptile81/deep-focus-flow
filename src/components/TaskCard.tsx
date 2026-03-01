import React from 'react';
import { Task, TaskStatus, Subject, SUBJECT_COLOR_MAP } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Trash2, Repeat, Timer } from 'lucide-react';
import { formatMinutes } from '@/lib/analytics';

const PRIORITY_COLORS: Record<string, { border: string; bg: string; badge: string }> = {
  high: { border: 'border-l-4 border-l-[hsl(0,72%,51%)]', bg: '', badge: 'bg-[hsl(0,72%,51%)] text-white' },
  medium: { border: 'border-l-4 border-l-[hsl(45,93%,47%)]', bg: '', badge: 'bg-[hsl(45,93%,47%)] text-white' },
  low: { border: 'border-l-4 border-l-[hsl(160,60%,45%)]', bg: '', badge: 'bg-[hsl(160,60%,45%)] text-white' },
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
  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < STATUS_ORDER.length - 1;
  const colors = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const linkedSubject = task.subject_id ? subjects.find(s => s.id === task.subject_id) : null;

  const moveStatus = (direction: -1 | 1) => {
    const newStatus = STATUS_ORDER[currentIdx + direction];
    onUpdateTask({ ...task, status: newStatus });
  };

  return (
    <Card className={`group ${colors.border} ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''} transition-all`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </p>
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
          {(task.start_time || task.end_time) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
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
