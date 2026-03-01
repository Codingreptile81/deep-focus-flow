import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppState } from '@/contexts/AppContext';
import PlannerView from '@/components/PlannerView';
import KanbanBoard from '@/components/KanbanBoard';
import { CalendarDays, Columns3 } from 'lucide-react';

const PlannerPage: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useAppState();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Planner</h1>
      <Tabs defaultValue="planner">
        <TabsList>
          <TabsTrigger value="planner" className="gap-1.5">
            <CalendarDays className="h-4 w-4" /> Planner
          </TabsTrigger>
          <TabsTrigger value="kanban" className="gap-1.5">
            <Columns3 className="h-4 w-4" /> Kanban
          </TabsTrigger>
        </TabsList>
        <TabsContent value="planner">
          <PlannerView tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
        </TabsContent>
        <TabsContent value="kanban">
          <KanbanBoard tasks={tasks} onUpdateTask={updateTask} onDeleteTask={deleteTask} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlannerPage;
