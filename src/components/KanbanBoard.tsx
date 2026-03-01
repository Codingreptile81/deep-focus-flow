import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, Subject } from '@/types';
import TaskCard from '@/components/TaskCard';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

interface KanbanBoardProps {
  tasks: Task[];
  subjects: Subject[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, subjects, onUpdateTask, onDeleteTask }) => {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const newPosition = result.destination.index;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.status === newStatus && task.position === newPosition) return;
    onUpdateTask({ ...task, status: newStatus, position: newPosition });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.status).sort((a, b) => a.position - b.position);
          return (
            <div key={col.status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>
              <Droppable droppableId={col.status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[100px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? 'bg-accent/60' : 'bg-muted/50'
                    }`}
                  >
                    {colTasks.length === 0 && !snapshot.isDraggingOver && (
                      <p className="text-xs text-muted-foreground text-center py-8">No tasks</p>
                    )}
                    {colTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} {...dragProvided.dragHandleProps}>
                            <TaskCard task={task} subjects={subjects} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} isDragging={dragSnapshot.isDragging} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
