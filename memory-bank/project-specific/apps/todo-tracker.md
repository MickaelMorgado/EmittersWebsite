# Daily Todo Tracker

Habit and progress monitoring tool with persistent storage and performance analytics.

## Features

- **Dynamic Task Management**:
  - Global task list applies to every day.
  - Add, edit, and delete tasks globally.
  - Daily completion status tracking.
- **Progress Visualization**:
  - **Progress Bar**: Relative to today's task completion.
  - **Analytics Chart**: Area chart showing completion percentage over time (Daily, Weekly, Monthly, Yearly).
  - **Progress Calendar**: Color-coded heat map of historical performance.
- **Consistency Tracking**: Real-time calculation of completion consistency.
- **Data Persistence**: Full synchronization with Supabase backend.

## Technical Details

- **Location**: `node-projects/my-app/src/app/todo/`
- **Database**: Supabase (tables: `todos`, `todo_statuses`).
- **Charts**: `recharts` for progress visualization.
- **UI Components**: `shadcn/ui` (Card, Button, Input).
- **Date Management**: Custom formatting and calendar calculation logic.

## Dependencies

- `@supabase/supabase-js`
- `recharts`
- `lucide-react`
- `@/lib/supabase`
