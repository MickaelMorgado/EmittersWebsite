// src/app/todo/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
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

interface DayRecord {
  date: string; // ISO date string (YYYY-MM-DD)
  items: TodoItem[];
}

// Helper to format date strings
const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function TodoPage() {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [todayItems, setTodayItems] = useState<TodoItem[]>([]);
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
  // Load from localStorage on mount
  // ------------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem('todoRecords');
    let parsed: DayRecord[] = stored ? JSON.parse(stored) : [];
    if (parsed.length === 0) {
      const sample: DayRecord[] = [];
      for (let i = 30; i >= 0; i--) {
        const date = formatDate(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
        const items: TodoItem[] = [
          { id: crypto.randomUUID(), text: 'Check finances', completed: Math.random() > 0.5 },
          { id: crypto.randomUUID(), text: 'Study (backtesting trading strategies)', completed: Math.random() > 0.5 },
        ];
        sample.push({ date, items });
      }
      parsed = sample;
      localStorage.setItem('todoRecords', JSON.stringify(sample));
    }
    setRecords(parsed);
    const today = formatDate(new Date());
    const todayRecord = parsed.find((r) => r.date === today);
    if (todayRecord) {
      setTodayItems(todayRecord.items);
    } else {
      const defaults: TodoItem[] = [
        { id: crypto.randomUUID(), text: 'Check finances', completed: false },
        { id: crypto.randomUUID(), text: 'Study (backtesting trading strategies)', completed: false },
      ];
      setTodayItems(defaults);
      setRecords((prev) => [...prev, { date: today, items: defaults }]);
    }
    setSelectedDate(today);
  }, []);

  // ------------------------------------------------------------
  // Update today items when selectedDate changes
  // ------------------------------------------------------------
  useEffect(() => {
    const record = records.find((r) => r.date === selectedDate);
    if (record) {
      setTodayItems(record.items);
    } else {
      const defaults: TodoItem[] = [
        { id: crypto.randomUUID(), text: 'Check finances', completed: false },
        { id: crypto.randomUUID(), text: 'Study (backtesting trading strategies)', completed: false },
      ];
      setTodayItems(defaults);
      setRecords((prev) => [...prev, { date: selectedDate, items: defaults }]);
    }
  }, [selectedDate]);

  // ------------------------------------------------------------
  // Persist changes to localStorage whenever records change
  // ------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem('todoRecords', JSON.stringify(records));
  }, [records]);

  // ------------------------------------------------------------
  // Sync todayItems with records when they change
  // ------------------------------------------------------------
  useEffect(() => {
    setRecords((prev) => {
      const other = prev.filter((r) => r.date !== selectedDate);
      return [...other, { date: selectedDate, items: todayItems }];
    });
  }, [todayItems, selectedDate]);

  const toggleItem = (id: string) => {
    setTodayItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: TodoItem = { id: crypto.randomUUID(), text: newItemText.trim(), completed: false };
    setTodayItems((prev) => [...prev, newItem]);
    setRecords((prev) => prev.map((r) => ({ ...r, items: [...r.items, newItem] })));
    setNewItemText('');
  };

  // ------------------------------------------------------------
  // Compute chart data (percentage completed per day)
  // ------------------------------------------------------------
  const chartData = useMemo(() => {
    return records
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => {
        const total = r.items.length;
        const completed = r.items.filter((i) => i.completed).length;
        const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { date: r.date, percent };
      });
  }, [records]);

  // ------------------------------------------------------------
  // Filter data based on active tab
  // ------------------------------------------------------------
  const filteredData = useMemo(() => {
    switch (activeTab) {
      case 'daily':
        return chartData.slice(-7);
      case 'weekly': {
        const weeksMap: { [key: string]: number[] } = {};
        chartData.forEach((d) => {
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
        chartData.forEach((d) => {
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
        chartData.forEach((d) => {
          const yearKey = d.date.slice(0, 4);
          if (!yearsMap[yearKey]) yearsMap[yearKey] = [];
          yearsMap[yearKey].push(d.percent);
        });
        return Object.entries(yearsMap)
          .map(([year, vals]) => ({ date: year, percent: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) }))
          .slice(-5);
      }
    }
    return [];
  }, [activeTab, chartData]);

  const consistency = useMemo(() => {
    return filteredData.length
      ? Math.round(filteredData.reduce((sum, d) => sum + d.percent, 0) / filteredData.length)
      : 0;
  }, [filteredData]);

  return (
    <div className="container mx-auto px-4 py-8 text-white flex space-x-4">
      {/* Left: Todo List (33%) */}
      <div className="w-1/3">
        <h1 className="text-3xl font-bold mb-4">Daily Todo Tracker</h1>
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 w-full">
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
        {/* Todo List Card */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-xl">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {todayItems.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-center w-full p-3 rounded-lg mb-2 ${item.completed ? 'bg-green-300/10' : 'bg-gray-500/10'}`}
                >
                  <label className="flex items-center w-full cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleItem(item.id)}
                      className="mr-2 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className={item.completed ? 'line-through text-green-400 font-bold' : 'font-medium'}>{item.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Right: Tabs & Chart (67%) */}
      <div className="w-2/3">
        {/* Tabs */}
        <div className="flex space-x-2 mb-4">
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((tab) => (
            <Button key={tab} variant={activeTab === tab ? 'default' : 'outline'} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
        {/* Consistency display */}
        <div className="mb-4 text-lg font-medium text-white">Consistency: {consistency}%</div>
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
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
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
                  type="monotone"
                  dataKey="percent"
                  stroke="#6366F1"
                  fill="url(#progressGradient)"
                  strokeWidth={2}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Daily Progress Bar Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-700 rounded h-4 overflow-hidden">
              <div
                className="h-4 bg-green-500 transition-all duration-300"
                style={{ width: `${(todayItems.filter((i) => i.completed).length / (todayItems.length || 1)) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        {/* Progress Calendar Card */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-lg">Progress Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {weeks.map((week) =>
                week.map((day) => {
                  const dateStr = day.date.toISOString().split('T')[0];
                  const percent = chartData.find((d) => d.date === dateStr)?.percent ?? 0;
                  const bg = percent >= 100 ? 'bg-green-300' : percent > 50 ? 'bg-orange-300' : 'bg-red-300';
                  return (
                    <div
                      key={dateStr}
                      className={cn('flex items-center justify-center h-8 rounded text-xs font-medium', bg, !day.isCurrentMonth && 'opacity-50')}
                    >
                      {percent}%
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
