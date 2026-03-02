import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority, Subject, SUBJECT_COLOR_MAP, SUBJECT_COLORS } from '@/types';
import { useAppState } from '@/contexts/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Clock, Trash2, Repeat, Timer, Check, X, AlertTriangle, CalendarIcon, Plus, Pencil, ListTree, Paperclip, FolderPlus } from 'lucide-react';
import TaskResources from '@/components/TaskResources';
import { formatMinutes } from '@/lib/analytics';
import { format, parseISO, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-destructive text-destructive-foreground',
  medium: 'bg-[hsl(45,93%,47%)] text-white',
  low: 'bg-[hsl(160,60%,45%)] text-white',
};

const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'done'];
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

interface TaskCardProps {
  task: Task;
  subjects?: Subject[];
  allTasks?: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddTask?: (task: { title: string; priority: TaskPriority; parent_task_id?: string; scheduled_date?: string; subject_id?: string }) => void;
  showMoveButtons?: boolean;
  isDragging?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, subjects = [], allTasks = [], onUpdateTask, onDeleteTask, onAddTask, showMoveButtons = true, isDragging = false }) => {
  const { addSubject } = useAppState();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editSubjectId, setEditSubjectId] = useState(task.subject_id || 'none');
  const [editEstimate, setEditEstimate] = useState(task.estimate_minutes?.toString() || '');
  const [editPriority, setEditPriority] = useState(task.priority);
  const [editDeadline, setEditDeadline] = useState<Date | undefined>(task.deadline ? parseISO(task.deadline) : undefined);
  const [addingSubTask, setAddingSubTask] = useState(false);
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const [showResources, setShowResources] = useState(false);
  const [addingNewSubject, setAddingNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = currentIdx > 0;
  const canMoveRight = currentIdx < STATUS_ORDER.length - 1;
  const linkedSubject = task.subject_id ? subjects.find(s => s.id === task.subject_id) : null;
  const subTasks = allTasks.filter(t => t.parent_task_id === task.id);
  const completedSubTasks = subTasks.filter(t => t.status === 'done').length;

  const deadlineOrScheduled = task.deadline || task.scheduled_date;
  const isOverdue = task.status !== 'done' && deadlineOrScheduled && isBefore(parseISO(deadlineOrScheduled), startOfDay(new Date()));

  // Subject-based border color
  const borderColor = linkedSubject
    ? SUBJECT_COLOR_MAP[linkedSubject.color] || 'hsl(var(--border))'
    : 'hsl(var(--muted-foreground))';

  const moveStatus = (direction: -1 | 1) => {
    const newStatus = STATUS_ORDER[currentIdx + direction];
    onUpdateTask({ ...task, status: newStatus });
  };

  const startEdit = () => {
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

  const handleAddSubTask = () => {
    if (!subTaskTitle.trim() || !onAddTask) return;
    onAddTask({
      title: subTaskTitle.trim(),
      priority: task.priority,
      parent_task_id: task.id,
      scheduled_date: task.scheduled_date,
      subject_id: task.subject_id,
    });
    setSubTaskTitle('');
    setAddingSubTask(false);
  };

  const toggleSubTaskDone = (st: Task) => {
    onUpdateTask({ ...st, status: st.status === 'done' ? 'todo' : 'done' });
  };

  if (editing) {
    return (
      <Card className="border-l-4 transition-all ring-2 ring-primary/30" style={{ borderLeftColor: borderColor }}>
        <CardContent className="p-3 space-y-2">
          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" className="h-8 text-sm" autoFocus />
          <Input value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" className="h-8 text-sm" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            {addingNewSubject ? (
              <div className="flex gap-1 col-span-2">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="New subject name"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newSubjectName.trim()) {
                      const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
                      addSubject({ name: newSubjectName.trim(), category: 'study', color });
                      setNewSubjectName('');
                      setAddingNewSubject(false);
                    }
                    if (e.key === 'Escape') setAddingNewSubject(false);
                  }}
                />
                <Button size="sm" className="h-8 px-2" disabled={!newSubjectName.trim()} onClick={() => {
                  const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
                  addSubject({ name: newSubjectName.trim(), category: 'study', color });
                  setNewSubjectName('');
                  setAddingNewSubject(false);
                }}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setAddingNewSubject(false)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex gap-1">
                  <Select value={editSubjectId} onValueChange={setEditSubjectId}>
                    <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Untitled</SelectItem>
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
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setAddingNewSubject(true)} title="Add new subject">
                    <FolderPlus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Select value={editPriority} onValueChange={v => setEditPriority(v as any)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
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
      className={`group border-l-4 ${isDragging ? 'opacity-50 rotate-2 shadow-lg' : ''} ${isOverdue ? 'ring-1 ring-destructive/40' : ''} transition-all`}
      style={{ borderLeftColor: borderColor }}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {isOverdue && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
            <p className={`text-sm font-medium leading-tight ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Badge className={`text-[10px] border-0 ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium}`}>
              {task.priority}
            </Badge>
          </div>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: borderColor }} />
            <span className="text-muted-foreground">{linkedSubject?.name || 'Untitled'}</span>
          </div>
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

        {/* Sub-tasks inside the card */}
        {subTasks.length > 0 && (
          <div className="border-t border-border pt-2 mt-1 space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
              <ListTree className="h-3 w-3" />
              <span>Sub-tasks ({completedSubTasks}/{subTasks.length})</span>
            </div>
            {subTasks.map(st => (
              <div key={st.id} className="flex items-center gap-2 group/sub">
                <Checkbox
                  checked={st.status === 'done'}
                  onCheckedChange={() => toggleSubTaskDone(st)}
                  className="h-3.5 w-3.5"
                />
                <span className={`text-xs flex-1 ${st.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                  {st.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteTask(st.id)}
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add sub-task inline */}
        {addingSubTask && (
          <div className="flex gap-1 pt-1">
            <Input
              className="h-7 text-xs flex-1"
              placeholder="Sub-task title"
              value={subTaskTitle}
              onChange={e => setSubTaskTitle(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAddSubTask(); if (e.key === 'Escape') setAddingSubTask(false); }}
            />
            <Button size="sm" className="h-7 text-xs px-2" onClick={handleAddSubTask} disabled={!subTaskTitle.trim()}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingSubTask(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Resources panel */}
        {showResources && (
          <div className="border-t border-border pt-2 mt-1">
            <TaskResources taskId={task.id} />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            {showMoveButtons && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canMoveLeft} onClick={() => moveStatus(-1)} title={canMoveLeft ? `Move to ${STATUS_LABELS[STATUS_ORDER[currentIdx - 1]]}` : undefined}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={!canMoveRight} onClick={() => moveStatus(1)} title={canMoveRight ? `Move to ${STATUS_LABELS[STATUS_ORDER[currentIdx + 1]]}` : undefined}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </>
            )}
            {onAddTask && (
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={() => setAddingSubTask(true)} title="Add sub-task">
                <Plus className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className={`h-6 w-6 ${showResources ? 'text-primary' : 'text-muted-foreground'}`} onClick={() => setShowResources(!showResources)} title="Resources">
              <Paperclip className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={startEdit} title="Edit task">
              <Pencil className="h-3 w-3" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => onDeleteTask(task.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
