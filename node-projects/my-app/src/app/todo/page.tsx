// src/app/todo/page.tsx
'use client';

import { VersionBadge } from '@/components/VersionBadge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Types
interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}



// Helper to format date strings
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function TodoPage() {
  // Global list of tasks (same for every day)
  const [globalTasks, setGlobalTasks] = useState<TodoItem[]>([]);
  // Map of date -> { taskId: completed }
  const [statusMap, setStatusMap] = useState<Record<string, Record<string, boolean>>>({});
  const [newItemText, setNewItemText] = useState('');
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));

  // ------------------------------------------------------------
  // Calendar calculations (used for the Progress Calendar card)
  // ------------------------------------------------------------
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const year = new Date(selectedDate).getFullYear();
  const month = new Date(selectedDate).getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);
  const endDate = new Date(lastDayOfMonth);
  const remainingDays = 6 - lastDayOfMonth.getDay();
  endDate.setDate(endDate.getDate() + remainingDays);
  const calendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
  const cur = new Date(startDate);
  while (cur <= endDate) {
    calendarDays.push({
      date: new Date(cur),
      isCurrentMonth: cur.getMonth() === month,
      isToday: cur.toDateString() === new Date().toDateString(),
    });
    cur.setDate(cur.getDate() + 1);
  }
  const weeks: { date: Date; isCurrentMonth: boolean; isToday: boolean }[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // ------------------------------------------------------------
  // Load global tasks and status map from localStorage on mount
  // ------------------------------------------------------------
  useEffect(() => {
  const fetchData = async () => {
    // Load tasks
    const { data: tasksData, error: tasksError } = await supabase.from('todos').select('*');
    // Load statuses
    const { data: statusData, error: statusError } = await supabase.from('todo_statuses').select('*');

    if (tasksError) console.error('Error loading tasks:', tasksError);
    if (statusError) console.error('Error loading statuses:', statusError);

    const tasks: TodoItem[] = tasksData ? tasksData.map((t: any) => ({ id: t.id, text: t.text, completed: false })) : [];
    const statusMap: Record<string, Record<string, boolean>> = {};
    if (statusData) {
      statusData.forEach((row: any) => {
        const date = row.date;
        if (!statusMap[date]) statusMap[date] = {};
        statusMap[date][row.todo_id] = row.completed;
      });
    }

    if (tasks.length === 0) {
      // Initialise with sample tasks
      const sampleTasks: TodoItem[] = [
        { id: crypto.randomUUID(), text: 'Check finances', completed: false },
        { id: crypto.randomUUID(), text: 'Study (backtesting trading strategies)', completed: false },
      ];
      // Insert sample tasks
      const { error: insertErr } = await supabase.from('todos').insert(sampleTasks.map(t => ({ id: t.id, text: t.text })));
      if (insertErr) console.error('Error inserting sample tasks:', insertErr);
      // Initialise status for the past 30 days
      const initStatus: Record<string, Record<string, boolean>> = {};
      for (let i = 30; i >= 0; i--) {
        const date = formatDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
        initStatus[date] = {};
        sampleTasks.forEach((t) => (initStatus[date][t.id] = false));
        // Insert status rows
        const rows = sampleTasks.map(t => ({ todo_id: t.id, date, completed: false }));
        await supabase.from('todo_statuses').upsert(rows, { onConflict: 'todo_id,date' });
      }
      setGlobalTasks(sampleTasks);
      setStatusMap(initStatus);
    } else {
      setGlobalTasks(tasks);
      setStatusMap(statusMap);
    }
    setSelectedDate(formatDate(new Date()));
  };
  fetchData();
}, []);



  // ------------------------------------------------------------
  // Persist global tasks and status map to localStorage whenever they change
  // ------------------------------------------------------------
  useEffect(() => {
  const syncData = async () => {
    // Upsert tasks
    for (const task of globalTasks) {
      await supabase.from('todos').upsert({ id: task.id, text: task.text });
    }
    // Upsert statuses
    const statusEntries = Object.entries(statusMap);
    for (const [date, tasks] of statusEntries) {
      for (const [taskId, completed] of Object.entries(tasks)) {
        await supabase.from('todo_statuses').upsert({ todo_id: taskId, date, completed }, { onConflict: 'todo_id,date' });
      }
    }
  };
  syncData();
}, [globalTasks, statusMap]);



  const toggleItem = async (id: string) => {
  let newValue = false;
  setStatusMap((prev) => {
    const dayStatus = { ...(prev[selectedDate] || {}) };
    newValue = !dayStatus[id];
    dayStatus[id] = newValue;
    return { ...prev, [selectedDate]: dayStatus };
  });
  // Update Supabase after state change
  await supabase.from('todo_statuses').upsert({ todo_id: id, date: selectedDate, completed: newValue }, { onConflict: 'todo_id,date' });
};

  const addItem = async () => {
  if (!newItemText.trim()) return;
  const newTask: TodoItem = { id: crypto.randomUUID(), text: newItemText.trim(), completed: false };
  // Add to global list
  setGlobalTasks((prev) => [...prev, newTask]);
  // Insert into Supabase
  await supabase.from('todos').insert({ id: newTask.id, text: newTask.text });
  // Determine dates that need status rows
  const existingDates = Object.keys(statusMap);
  const dates = existingDates.includes(selectedDate) ? existingDates : [...existingDates, selectedDate];
  // Update local statusMap synchronously
  setStatusMap((prev) => {
    const updated = { ...prev };
    dates.forEach((date) => {
      if (!updated[date]) updated[date] = {};
      updated[date][newTask.id] = false;
    });
    return updated;
  });
  // Upsert status rows for all relevant dates
  const rows = dates.map((date) => ({ todo_id: newTask.id, date, completed: false }));
  await supabase.from('todo_statuses').upsert(rows, { onConflict: 'todo_id,date' });
  setNewItemText('');
};

  // Delete a task (with user confirmation) and remove its status from all dates
  const deleteItem = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task? It will be removed from all days.')) {
      // Remove from global task list
      setGlobalTasks((prev) => prev.filter((t) => t.id !== id));
      // Delete from Supabase
      await supabase.from('todos').delete().eq('id', id);
      // Remove status entries for this task across all dates
      setStatusMap((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((date) => {
          if (updated[date] && updated[date][id] !== undefined) {
            delete updated[date][id];
          }
        });
        return updated;
      });
      // Delete status rows
      await supabase.from('todo_statuses').delete().eq('todo_id', id);
    }
  };

  // Update a task's name (text) with user input
  const editItem = async (id: string) => {
    const current = globalTasks.find((t) => t.id === id);
    const newName = window.prompt('Edit task name', current?.text || '');
    if (newName && newName.trim()) {
      const trimmed = newName.trim();
      setGlobalTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, text: trimmed } : t))
      );
      // Update Supabase
      await supabase.from('todos').update({ text: trimmed }).eq('id', id);
    }
  };
  // ------------------------------------------------------------
  // Compute chart data (percentage completed per day)
  // ------------------------------------------------------------
  const chartData = useMemo(() => {
    // Build chart data from statusMap and globalTasks
    const dates = Object.keys(statusMap).sort();
    return dates.map((date) => {
      const dayStatus = statusMap[date] || {};
      const total = globalTasks.length;
      const completed = Object.values(dayStatus).filter(Boolean).length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      return { date, percent };
    });
  }, [statusMap, globalTasks]);

  // ------------------------------------------------------------
  // Filter data based on active tab
  // ------------------------------------------------------------
  const filteredData = useMemo(() => {
    // Helper to get records up to the selected date
    const upToSelected = chartData.filter((d) => d.date <= selectedDate);
    switch (activeTab) {
      case 'daily':
        // Show the last 7 days up to the selected date
        return upToSelected.slice(-7);
      case 'weekly': {
        const weeksMap: { [key: string]: number[] } = {};
        upToSelected.forEach((d) => {
          const date = new Date(d.date);
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay() + 1));
          const key = formatDate(weekStart);
          if (!weeksMap[key]) weeksMap[key] = [];
          weeksMap[key].push(d.percent);
        });
        return Object.entries(weeksMap)
          .map(([week, vals]) => ({ date: week, percent: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
          .slice(-4);
      }
      case 'monthly': {
        const monthsMap: { [key: string]: number[] } = {};
        upToSelected.forEach((d) => {
          const monthKey = d.date.slice(0, 7);
          if (!monthsMap[monthKey]) monthsMap[monthKey] = [];
          monthsMap[monthKey].push(d.percent);
        });
        return Object.entries(monthsMap)
          .map(([month, vals]) => ({ date: month, percent: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
          .slice(-12);
      }
      case 'yearly': {
        const yearsMap: { [key: string]: number[] } = {};
        upToSelected.forEach((d) => {
          const yearKey = d.date.slice(0, 4);
          if (!yearsMap[yearKey]) yearsMap[yearKey] = [];
          yearsMap[yearKey].push(d.percent);
        });
        return Object.entries(yearsMap)
          .map(([year, vals]) => ({ date: year, percent: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
          .slice(-5);
      }
    }
  }, [activeTab, chartData, selectedDate]);

  const consistency = useMemo(() => {
    return filteredData.length
      ? Math.round(filteredData.reduce((sum, d) => sum + d.percent, 0) / filteredData.length)
      : 0;
  }, [filteredData]);

  return (
    <div className="container-full mx-auto p-4 lg:p-8 text-white flex flex-col lg:flex-row gap-4 items-start">
      {/* Left: Todo List (33%) */}
      <div className="w-full lg:w-1/3">
        {/* Navigation */}
        <div className="mb-4 w-full">
          <div className="flex items-center justify-between mb-2">
            <Button
              onClick={() => {
                const newDate = formatDate(new Date(new Date(selectedDate).getTime() - 24 * 60 * 60 * 1000));
                setSelectedDate(newDate);
              }}
              variant="outline"
              className="text-2xl font-bold px-2"
            >
              &#60;
            </Button>
            <span className="text-lg font-medium flex-1 text-center">{selectedDate}</span>
            <Button
              onClick={() => {
                const newDate = formatDate(new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000));
                setSelectedDate(newDate);
              }}
              variant="outline"
              className="text-2xl font-bold px-2"
            >
              &#62;
            </Button>
          </div>
        </div>
        {/* Today's Progress Bar Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-green-500/10 rounded h-2 overflow-hidden">
              <div
                className="h-2 bg-green-500 transition-all duration-300 shadow-xl shadow-green-500"
                style={{
                  width: `${
                    (Object.values(statusMap[selectedDate] || {}).filter(Boolean).length /
                    (globalTasks.length || 1)
                  ) * 100}%`
                }}
              />
            </div>
          </CardContent>
        </Card>
        {/* Todo List Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {globalTasks.map((task) => {
                const completed = statusMap[selectedDate]?.[task.id] ?? false;
                return (
                  <li
                    key={task.id}
                    className={`flex items-center w-full p-3 rounded-lg mb-2 ${completed ? 'bg-green-500/10' : 'bg-gray-500/10'}`}
                  >
                    <label className="flex items-center w-full cursor-pointer">
                      <input
                        type="checkbox"
                        checked={completed}
                        onChange={() => toggleItem(task.id)}
                        className="mr-2 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={completed ? 'line-through text-green-500 font-bold' : 'font-medium'}>{task.text}</span>
                    </label>
                    {/* Edit button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 cursor-pointer"
                      onClick={() => editItem(task.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {/* Delete button with confirmation */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 cursor-pointer"
                      onClick={() => deleteItem(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}            </ul>
          </CardContent>
        </Card>
        {/* Add New Task Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl">Add New Task</CardTitle>
          </CardHeader>
          <CardContent className="flex space-x-2">
            <Input placeholder="Add new task" value={newItemText} onChange={(e) => setNewItemText(e.target.value)} />
            <Button onClick={addItem}>Add</Button>
          </CardContent>
        </Card>
      </div>

      {/* Right: Tabs & Chart (67%) */}
      <div className="w-full lg:w-2/3">
        {/* Tabs and Consistency */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 sm:gap-0">
          <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tab) => (
              <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
          <div className="text-lg font-medium text-white ml-0 sm:ml-4">
            Consistency: <span className="text-green-500 font-bold">{consistency}%</span>
          </div>
        </div>
        {/* Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Completion %</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c950" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00c950" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" tick={{ fill: '#9CA3AF' }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area
                  type="step"
                  dataKey="percent"
                  stroke="#00c950"
                  fill="url(#progressGradient)"
                  strokeWidth={2}
                  animationDuration={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress Calendar Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardAction>
              <Button
                onClick={() => setSelectedDate(formatDate(new Date()))}
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={selectedDate === formatDate(new Date())}
              >
                Today
              </Button>
            </CardAction>
            <CardTitle className="text-lg">Progress Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {weeks.map((week) =>
                week.map((day) => {
                  const dateStr = day.date.toISOString().split('T')[0];
                  const percent = chartData.find((d) => d.date === dateStr)?.percent ?? 0;
                  const bg = percent >= 100 ? 'bg-green-500' : percent >= 50 ? 'bg-orange-500/40' : 'bg-red-500/10';
                  const textColor = percent >= 100 ? 'text-green-500' : percent >= 50 ? 'text-orange-500' : 'text-red-500';
                  const isSelected = dateStr === selectedDate;
                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        'relative min-h-[60px] p-1 rounded cursor-pointer transition-all hover:scale-105',
                        !day.isCurrentMonth && 'opacity-10',
                        day.isToday && 'bg-blue-50 dark:bg-blue-950/20',
                        isSelected && 'bg-indigo-50 dark:bg-indigo-950/30 ring-2 ring-indigo-500'
                      )}
                    >
                      <div className="flex flex-col items-center justify-start">
                        <div
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                            day.isToday && !isSelected && 'bg-blue-600 text-white',
                            isSelected && 'bg-indigo-600 text-white',
                            !day.isToday && !isSelected && !day.isCurrentMonth && 'text-muted-foreground'
                          )}
                        >
                          {day.date.getDate()}
                        </div>
                        {day.isCurrentMonth && (
                          <div className={cn('text-[10px] font-semibold mt-1', textColor)}>
                            {percent}%
                          </div>
                        )}
                      </div>
                      {day.isCurrentMonth && (
                        <div className={cn('mt-1 h-1 rounded-full', bg)} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <VersionBadge projectName="todo" />
    </div>
  );
}
