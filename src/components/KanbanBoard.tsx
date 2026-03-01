import React from 'react';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/TaskCard';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onUpdateTask, onDeleteTask }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.status).sort((a, b) => a.position - b.position);
        return (
          <div key={col.status} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{col.label}</h3>
              <span className="text-xs text-muted-foreground">{colTasks.length}</span>
            </div>
            <div className="space-y-2 min-h-[100px] rounded-lg bg-muted/50 p-2">
              {colTasks.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
              )}
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
