

## Plan: Add Planner / To-Do List with Kanban Board

### Overview
Add a new "Planner" page with two views via tabs: a **time-blocked to-do list** (plan tasks with time slots) and a **Kanban board** (drag tasks across columns: To Do, In Progress, Done).

### Database Changes
Create a new `tasks` table:

```text
tasks
├── id (uuid, PK, default gen_random_uuid())
├── user_id (uuid, NOT NULL)
├── title (text, NOT NULL)
├── description (text, nullable)
├── status (text, NOT NULL, default 'todo')  — 'todo' | 'in_progress' | 'done'
├── scheduled_date (text, nullable)          — 'YYYY-MM-DD'
├── start_time (text, nullable)              — 'HH:MM'
├── end_time (text, nullable)                — 'HH:MM'
├── priority (text, default 'medium')        — 'low' | 'medium' | 'high'
├── position (integer, default 0)            — for ordering within columns
├── created_at (timestamptz, default now())
```

RLS policies: full CRUD restricted to `auth.uid() = user_id`.

### New Files
1. **`src/pages/PlannerPage.tsx`** — Page with two tabs:
   - **Planner tab**: Date picker + time-blocked task list. Add tasks with title, time range, priority. Shows tasks for selected day sorted by start_time.
   - **Kanban tab**: Three columns (To Do, In Progress, Done). Tasks displayed as cards. Click-to-move between columns (using buttons/dropdown rather than complex drag-drop for reliability).

2. **`src/components/TaskCard.tsx`** — Reusable card showing task title, time, priority badge, and status-change controls.

3. **`src/components/KanbanBoard.tsx`** — Three-column layout rendering TaskCards, with "move left/right" actions on each card.

4. **`src/components/PlannerView.tsx`** — Date-filtered task list with add-task form (title, description, start/end time, priority).

### Modifications
- **`src/contexts/AppContext.tsx`** — Add `tasks` state, `fetchTasks`, `addTask`, `updateTask`, `deleteTask` methods.
- **`src/types/index.ts`** — Add `Task` interface.
- **`src/components/AppLayout.tsx`** — Add "Planner" nav item with `ClipboardList` icon, route `/planner`.
- **`src/App.tsx`** — Add `/planner` route.

### UI Design
- Tabs component at top of page to switch between "Planner" and "Kanban" views
- Planner view: date picker on top, task list below with time slots, inline add form
- Kanban view: three equal columns with task cards, priority color-coded (high=red, medium=amber, low=green), move buttons on each card
- Consistent with existing app styling (cards, muted backgrounds, same color palette)

