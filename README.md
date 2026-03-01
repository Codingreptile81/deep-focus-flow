# DeepTrack — Unified Productivity System

**DeepTrack** is a personal productivity app that unifies **planning**, **execution**, and **analytics** around the concept of *Subjects* — the things you study, learn, or work on.

---

## Why DeepTrack?

Most productivity tools treat timers, task lists, and habit trackers as separate apps. DeepTrack connects them:

- **Plan** your work with todos and a Kanban board
- **Execute** with a Pomodoro timer linked to your tasks and subjects
- **Track** habits daily with streaks and completion rates
- **Analyze** everything — study time, task throughput, estimate accuracy — in one unified dashboard

Every minute you spend is attributed to a subject, whether you started the timer on a subject directly, a todo, or a Kanban card. This gives you a complete, consistent picture of where your time goes.

---

## Core Workflow

```
Subjects ← link → Tasks (Todo / Kanban)
    ↓                    ↓
Pomodoro Timer ──→ SessionLogs ──→ Analytics
    ↓
Habit Tracker ──→ HabitLogs ──→ Analytics
```

1. **Create Subjects** — e.g. "Mathematics", "React", "Spanish"
2. **Create Tasks** — link them to subjects, set priorities, estimates, and due dates
3. **Start a Pomodoro** — choose a subject, a todo, or an in-progress Kanban card
4. **Session completes** → a `SessionLog` is created, `actual_minutes` on the task updates automatically
5. **Log habits daily** — binary (did/didn't), count, or minutes
6. **View Analytics** — study trends, task throughput, Kanban flow, planning accuracy

---

## Features

### 📚 Subjects
Organize your work into color-coded subjects with categories (Study / Skill) and optional goal hours. Subjects are the backbone — all time tracking rolls up to them.

### ⏱ Pomodoro Timer
Focus timer with three targeting modes:
- **Subject** — pure study time
- **Todo** — work on a specific planned task
- **Kanban Card** — work on an in-progress item

Selecting a task auto-fills its linked subject, so all time stays unified.

### ✅ Planner (Todo)
Calendar-based task planning with:
- Date scheduling and time blocks
- Priority levels (Low / Medium / High) with color coding
- Subject linking and time estimates
- Recurring tasks (daily / weekly)
- Inline editing by clicking any task
- Overdue indicators for missed deadlines

### 📋 Kanban Board
Drag-and-drop board with three columns: To Do → In Progress → Done. Cards show subject, priority, time tracked, and overdue status.

### 🔥 Habits
Daily habit tracker supporting binary, count, and minute-based metrics. Includes streak tracking and a calendar heatmap view.

### 📊 Analytics Dashboard
Four-tab analytics view:

| Tab | Metrics |
|-----|---------|
| **Study** | Weekly/daily study time, subject distribution pie, habit streaks |
| **Tasks** | Completion rate, daily throughput, time per task, overdue count |
| **Kanban** | WIP count, cards completed/week, time per column |
| **Planning** | Planned vs actual time, focus accuracy %, estimate accuracy per task |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **Drag & Drop**: @hello-pangea/dnd
- **Backend**: Lovable Cloud (Supabase) — auth, database, RLS
- **Date handling**: date-fns

---

## Getting Started

```bash
# Clone and install
git clone <YOUR_GIT_URL>
cd deeptrack
npm install

# Start dev server
npm run dev
```

1. Create an account or sign in
2. Add your first subject
3. Start a Pomodoro session
4. Check Analytics to see your progress

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `subjects` | User's study/skill topics |
| `tasks` | Todos and Kanban cards (with subject link, estimates) |
| `session_logs` | Pomodoro sessions (linked to subject and optionally task) |
| `habits` | Habit definitions |
| `habit_logs` | Daily habit completions |
| `profiles` | User profile data |

All tables use Row Level Security — users can only access their own data.

---
