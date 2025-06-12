'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

// Type definitions
interface TradeData {
  [key: string]: {
    pnl: number;
    trades: number;
  };
}

// Sample trading data
const parseTradeData = (input: string): TradeData => {
  const lines = input.trim().split('\n');
  const data: TradeData = {};

  // Skip header line if it exists
  const startIndex = lines[0].includes('Time\tPosition') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split('\t');
    if (columns.length < 12) continue; // Ensure we have all required columns

    try {
      // Column indices based on the provided format:
      // 0: Open Time, 1: Position, 2: Symbol, 3: Type, 4: Volume
      // 5: Price, 6: S/L, 7: T/P, 8: Close Time, 9: Close Price
      // 10: Commission, 11: Swap, 12: Profit
      const closeTime = columns[8]; // 9th column is close time
      const commission = parseFloat(columns[10]) || 0;
      const swap = parseFloat(columns[11]) || 0;
      const profit = parseFloat(columns[12]); // 13th column is profit
      const totalProfit = profit + commission + swap;

      // Parse the close time (format: YYYY.MM.DD HH:MM:SS)
      const [datePart] = closeTime.split(' ');
      const [year, month, day] = datePart.split('.').map(Number);
      // Create a date object in local timezone
      const tradeDate = new Date(year, month - 1, day);
      // Format as YYYY-MM-DD in local timezone
      const formattedDate = tradeDate.toISOString().split('T')[0];

      if (data[formattedDate]) {
        data[formattedDate].pnl += totalProfit;
        data[formattedDate].trades += 1;
      } else {
        data[formattedDate] = { pnl: totalProfit, trades: 1 };
      }
    } catch (error) {
      console.error('Error parsing line:', line, error);
    }
  }

  return data;
};

const sampleData = `2025.06.05 10:04:02\t61595621\tEURUSD\tbuy\t1\t1.14129\t1.14117\t1.14200\t2025.06.05 10:06:54\t1.14117\t-4.00\t0.00\t-10.52
2025.06.05 10:10:05\t61596071\tEURUSD\tbuy\t1\t1.14146\t1.14162\t1.14202\t2025.06.05 10:14:58\t1.14192\t-4.00\t0.00\t40.28
2025.06.06 10:37:04\t61675593\tEURUSD\tbuy\t1\t1.14280\t1.14267\t1.14378\t2025.06.06 10:37:11\t1.14267\t-4.00\t0.00\t-11.38
2025.06.06 10:45:06\t61676274\tEURUSD\tbuy\t1\t1.14284\t1.14271\t1.14375\t2025.06.06 10:46:50\t1.14271\t-4.00\t0.00\t-11.38
2025.06.06 11:03:02\t61677483\tEURUSD\tsell\t1.5\t1.14225\t1.14237\t1.14157\t2025.06.06 11:03:25\t1.14237\t-6.00\t0.00\t-15.76
2025.06.06 11:12:22\t61677870\tEURUSD\tsell\t1.5\t1.14220\t1.14231\t1.14154\t2025.06.06 11:13:26\t1.14231\t-6.00\t0.00\t-14.44`;

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tradingData?: {
    pnl: number;
    trades: number;
  };
}

export function TradingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tradeInput, setTradeInput] = useState('');
  const [tradingData, setTradingData] = useState<TradeData>({});

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Calculate days to show (including previous/next month days)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfWeek);

  const endDate = new Date(lastDayOfMonth);
  const remainingDays = 6 - lastDayOfMonth.getDay();
  endDate.setDate(endDate.getDate() + remainingDays);

  // Generate calendar days
  const calendarDays: DayData[] = [];
  const currentDateIter = new Date(startDate);

  while (currentDateIter <= endDate) {
    const dateKey = currentDateIter.toISOString().split('T')[0];
    const isCurrentMonth = currentDateIter.getMonth() === month;
    const isToday =
      currentDateIter.toDateString() === new Date().toDateString();

    calendarDays.push({
      date: new Date(currentDateIter),
      isCurrentMonth,
      isToday,
      tradingData: tradingData[dateKey as keyof typeof tradingData],
    });

    currentDateIter.setDate(currentDateIter.getDate() + 1);
  }

  // Group days into weeks
  const weeks: DayData[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  // Calculate monthly totals
  const monthlyTotals = Object.entries(tradingData).reduce(
    (acc, [dateStr, data]) => {
      const date = new Date(dateStr);
      if (date.getMonth() === month && date.getFullYear() === year) {
        acc.totalPnl += data.pnl;
        acc.totalTrades += data.trades;
        acc.tradingDays += 1;
      }
      return acc;
    },
    { totalPnl: 0, totalTrades: 0, tradingDays: 0 }
  );

  const handleImportTrades = () => {
    const data = parseTradeData(tradeInput || sampleData);
    setTradingData(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTradeInput(e.target.value);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Trade Data Import */}
        <Card>
          <CardHeader>
            <CardTitle>Import Trade Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="trade-data" className="text-sm font-medium">
                  Paste your trade history (tab-separated values)
                </label>
                <textarea
                  id="trade-data"
                  rows={8}
                  value={tradeInput}
                  onChange={handleInputChange}
                  placeholder="Paste your trade data here..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <p className="text-sm text-muted-foreground">
                  Paste your trade history in the format: Time, Position,
                  Symbol, Type, Volume, Price, S/L, T/P, Close Time, Close
                  Price, Commission, Swap, Profit
                </p>
              </div>
              <Button onClick={handleImportTrades}>Import Trades</Button>
              <Button
                variant="outline"
                onClick={() => setTradeInput(sampleData)}
                className="ml-2"
              >
                Load Sample Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="px-6 py-4">
            <div className="flex items-center justify-between w-full gap-12">
              <div className="w-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 text-center min-w-[240px] px-4">
                <CardTitle className="text-2xl md:text-3xl font-medium">
                  {monthNames[month]} {year}
                </CardTitle>
              </div>
              <div className="w-10">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Monthly P&L
                  </div>
                  <div
                    className={cn(
                      'text-lg font-bold',
                      monthlyTotals.totalPnl >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {formatCurrency(monthlyTotals.totalPnl)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Trading Days
                  </div>
                  <div className="text-lg font-bold">
                    {monthlyTotals.tradingDays}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">
                    Total Trades
                  </div>
                  <div className="text-lg font-bold">
                    {monthlyTotals.totalTrades}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Legend */}
        <div className="mb-4 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Profitable Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <span>Loss Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-muted"></div>
            <span>No Trading</span>
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-0">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-4 text-center text-sm font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <div
                key={weekIndex}
                className="grid grid-cols-7 border-b last:border-b-0"
              >
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={cn(
                      'relative min-h-[120px] border-r p-3 last:border-r-0',
                      !day.isCurrentMonth && 'bg-muted/30',
                      day.isToday && 'bg-blue-50 dark:bg-blue-950/20'
                    )}
                  >
                    {/* Date number */}
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                          day.isToday && 'bg-blue-600 text-white',
                          !day.isCurrentMonth && 'text-muted-foreground'
                        )}
                      >
                        {day.date.getDate()}
                      </div>

                      {/* Trade count badge */}
                      {day.tradingData && (
                        <Badge variant="secondary" className="text-xs">
                          {day.tradingData.trades} trades
                        </Badge>
                      )}
                    </div>

                    {/* Trading data */}
                    {day.tradingData && (
                      <div className="mt-2 space-y-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'w-full justify-center text-xs py-1 px-2 rounded-full border-1',
                            day.tradingData.pnl >= 0
                              ? 'bg-green-50 text-green-800 border-green-300 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                              : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                          )}
                        >
                          {formatCurrency(day.tradingData.pnl)}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TradingCalendar;
