'use client';

import { PortfolioChart } from '@/components/portfolio-chart';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TradeData, parseTradeData, sampleData } from '@/lib/tradeParser';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

// Constants
const POINTS_SCALING_FACTOR = 50000; // Adjust this to change the height of the volume bars (5 = 20 points = 100% height)

// Type definitions
interface TradingData {
  pnl: number;
  trades: number;
  profitableTrades: number;
  profitPoints: number[];
  lossPoints: number[];
}

interface WeekdayData {
  day: string;
  pnl: number;
  trades: number;
}

interface DayData {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tradingData?: TradingData;
  pnl: number;
  trades: number;
  profitableTrades: number;
  profitPoints: number[];
  lossPoints: number[];
}

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

export function TradingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tradeInput, setTradeInput] = useState('');
  const [tradingData, setTradingData] = useState<TradeData>({});
  const [weekdayData, setWeekdayData] = useState<WeekdayData[]>([]);
  const [profitFactor, setProfitFactor] = useState<number | null>(null);
  const [showImportSection, setShowImportSection] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();

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

    const dayTradingData = tradingData[dateKey as keyof typeof tradingData];

    calendarDays.push({
      date: new Date(currentDateIter),
      isCurrentMonth,
      isToday,
      tradingData: dayTradingData,
      pnl: dayTradingData?.pnl || 0,
      trades: dayTradingData?.trades || 0,
      profitableTrades: dayTradingData?.profitableTrades || 0,
      profitPoints: dayTradingData?.profitPoints || [],
      lossPoints: dayTradingData?.lossPoints || [],
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
        acc.profitableTrades += data.profitableTrades;
        acc.tradingDays += 1;
        acc.profitPoints.push(...(data.profitPoints || []));
        acc.lossPoints.push(...(data.lossPoints || []));
      }
      return acc;
    },
    {
      totalPnl: 0,
      totalTrades: 0,
      profitableTrades: 0,
      tradingDays: 0,
      profitPoints: [] as number[],
      lossPoints: [] as number[],
    }
  );

  // analyzeTradingDays function removed as it was unused

  const handleImportTrades = () => {
    const data = parseTradeData(tradeInput || sampleData);
    setTradingData(data);
    setShowImportSection(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // Parse HTML content
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');

      // Get all table rows and process only consecutive tr[align="right"]
      const allRows = doc.querySelectorAll('tr');
      const tradeData: string[] = [];
      let foundFirstRightAligned = false;
      // Removed unused shouldStop variable

      for (const row of Array.from(allRows)) {
        // Check if this is a right-aligned row
        const isRightAligned = row.getAttribute('align') === 'right';

        // If we find a non-right-aligned row after finding right-aligned ones, stop
        if (foundFirstRightAligned && !isRightAligned) {
          break;
        }

        // If this is a right-aligned row, process it
        if (isRightAligned) {
          foundFirstRightAligned = true;
          const cells = Array.from((row as HTMLTableRowElement).cells || []);
          // Skip rows where all cells are hidden
          const visibleCells = cells.filter(
            (cell) => !cell.classList.contains('hidden')
          );
          if (visibleCells.length > 0) {
            const rowData = visibleCells.map(
              (cell) => cell.textContent?.trim() || ''
            );
            tradeData.push(rowData.join('\t'));
          }
        }
      }

      // Process the extracted trade data
      if (tradeData.length > 0) {
        try {
          // Join the rows with newlines to match the expected format
          const tradeDataText = tradeData.join('\n');
          console.log('Processed trade data:', tradeDataText);

          // Analyze trades by weekday
          const analyzeTradesByWeekday = (
            tradeDataText: string
          ): WeekdayData[] => {
            const daysOfWeek = [
              'Sunday',
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
            ];
            const weekdayStats = daysOfWeek.map((day) => ({
              day,
              winningTrades: 0,
              losingTrades: 0,
              totalTrades: 0,
              totalProfit: 0,
            }));

            const lines = tradeDataText.split('\n');

            lines.forEach((line) => {
              if (!line.trim()) return;

              const columns = line.split('\t');
              if (columns.length < 13) return; // Skip invalid lines

              try {
                const dateStr = columns[0].split(' ')[0]; // Get date part from Time column
                const [year, month, day] = dateStr.split('.').map(Number);
                // Handle 2-digit year by adding 2000
                const date = new Date(2000 + year, month - 1, day);
                const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

                const profit = parseFloat(
                  columns[12].replace(/[^0-9.-]/g, '') || '0'
                );

                weekdayStats[dayOfWeek].totalTrades++;
                weekdayStats[dayOfWeek].totalProfit += profit;

                if (profit >= 0) {
                  weekdayStats[dayOfWeek].winningTrades++;
                } else {
                  weekdayStats[dayOfWeek].losingTrades++;
                }
              } catch (error) {
                console.error('Error processing trade:', error);
              }
            });

            // Log the results
            console.log('\n=== Trading Performance by Weekday ===');
            weekdayStats.forEach((stat) => {
              if (stat.totalTrades > 0) {
                const winRate = (
                  (stat.winningTrades / stat.totalTrades) *
                  100
                ).toFixed(1);
                const avgProfit = (stat.totalProfit / stat.totalTrades).toFixed(
                  2
                );
                console.log(`\n${stat.day}:`);
                console.log(`  Trades: ${stat.totalTrades}`);
                console.log(
                  `  Winning Trades: ${stat.winningTrades} (${winRate}%)`
                );
                console.log(`  Losing Trades: ${stat.losingTrades}`);
                console.log(`  Average P&L per Trade: $${avgProfit}`);
                console.log(`  Total P&L: $${stat.totalProfit.toFixed(2)}`);
              }
            });
            console.log('===================================\n');

            // Return the processed data for the chart
            return weekdayStats.map((stat) => ({
              day: stat.day,
              pnl: stat.totalProfit,
              trades: stat.totalTrades,
            }));
          };

          // Run the analysis and get weekday stats
          const weekdayStats = analyzeTradesByWeekday(tradeDataText);

          // Update weekday data for the chart
          const weekdays = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ];
          const formattedWeekdayData = weekdays.map((day) => {
            const stats = weekdayStats.find((d) => d.day === day) || {
              day,
              pnl: 0,
              trades: 0,
            };
            return {
              day: day.substring(0, 3), // Shorten day names for the chart
              pnl: stats.pnl || 0,
              trades: stats.trades || 0,
            };
          });

          setWeekdayData(formattedWeekdayData);

          // Parse the trade data using our existing parser
          const parsedTradeData = parseTradeData(tradeDataText);

          // Calculate profit factor using actual P&L values
          let grossProfit = 0;
          let grossLoss = 0;

          // Process each day's trades
          Object.values(parsedTradeData).forEach((dayData) => {
            // Calculate daily P&L from the actual P&L values (which already include commissions)
            const dailyPnl = dayData.pnl;

            if (dailyPnl > 0) {
              grossProfit += dailyPnl;
            } else if (dailyPnl < 0) {
              grossLoss += Math.abs(dailyPnl);
            }
          });

          // Calculate profit factor
          const factor =
            grossLoss > 0
              ? grossProfit / grossLoss
              : grossProfit > 0
              ? Infinity
              : 0;
          setProfitFactor(factor);

          // Update the trading data state
          setTradingData(parsedTradeData);
          setShowImportSection(false);

          // Show success message
          const tradeCount = Object.values(parsedTradeData).reduce(
            (sum, day) => sum + day.trades,
            0
          );
          console.log(
            `Successfully imported ${tradeCount} trades from ${
              Object.keys(parsedTradeData).length
            } trading days.\n\nCheck browser console (F12) for detailed weekday analysis.`
          );
        } catch (error) {
          console.error('Error processing trade data:', error);
          alert('Error processing trade data. Please check the file format.');
        }
      } else {
        alert('No trade data found in the uploaded file.');
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };

    reader.readAsText(file);
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

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        navigateMonth('prev');
      } else if (e.key === 'ArrowRight') {
        navigateMonth('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPoints = (value: number) => {
    if (value === 0) return '0';
    if (!value) return 'N/A';

    // Convert to points (multiply by 100,000) and round to nearest integer
    return Math.round(value * 100000).toString();
  };

  // Calculate overall stats (commented out as it's not currently used)
  // const overallStats = {
  //   totalPnl: Object.values(tradingData).reduce((sum, day) => sum + day.pnl, 0),
  //   totalTrades: Object.values(tradingData).reduce(
  //     (sum, day) => sum + day.trades,
  //     0
  //   ),
  //   profitableTrades: Object.values(tradingData).reduce(
  //     (sum, day) => sum + day.profitableTrades,
  //     0
  //   ),
  //   tradingDays: Object.keys(tradingData).length,
  //   profitPoints: Object.values(tradingData).flatMap((day) => day.profitPoints),
  //   lossPoints: Object.values(tradingData).flatMap((day) => day.lossPoints),
  //   profitFactor: (() => {
  //     // Calculate total profit from profitable days
  //     const totalProfit = Object.values(tradingData)
  //       .filter((day) => day.pnl > 0)
  //       .reduce((sum, day) => sum + day.pnl, 0);
  //
  //     // Calculate total loss from losing days (as positive number)
  //     const totalLoss = Math.abs(
  //       Object.values(tradingData)
  //         .filter((day) => day.pnl < 0)
  //         .reduce((sum, day) => sum + day.pnl, 0)
  //     );
  //
  //     // Calculate profit factor (avoid division by zero)
  //     return totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
  //   })(),
  // };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  const handleShowImportSection = () => {
    setShowImportSection(true);
  };

  // Prepare chart data
  const chartData = useMemo(() => {
    const sortedDays = Object.entries(tradingData).sort(
      ([dateA], [dateB]) =>
        new Date(dateA).getTime() - new Date(dateB).getTime()
    );

    let cumulativePnl = 0;
    return sortedDays.map(([date, dayData]) => {
      cumulativePnl += dayData.pnl;
      return {
        date,
        pnl: dayData.pnl,
        cumulativePnl: parseFloat(cumulativePnl.toFixed(2)),
      };
    });
  }, [tradingData]);

  return (
    <div
      className="min-h-screen bg-background p-2 md:p-4 focus:outline-none"
      tabIndex={0} // Make the div focusable
      onKeyDown={(e) => e.stopPropagation()} // Prevent event bubbling
    >
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Trade Data Import Toggle */}
        {!showImportSection && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowImportSection}
              className="h-8"
            >
              Import Trades
            </Button>
          </div>
        )}

        {/* Trade Data Import Section */}
        {showImportSection && (
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
              <CardTitle className="text-lg">Import Trade Data</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImportSection(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground/90">
                      Import Trades
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Upload your trading report to analyze performance
                    </p>
                  </div>
                  <div
                    className="relative mt 2 border-1 border-dashed border-border rounded-xl p-8 text-center transition-colors hover:border-primary/50 bg-card/50 hover:bg-card/70"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add(
                        'border-primary/70',
                        'bg-card/80'
                      );
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove(
                        'border-primary/70',
                        'bg-card/80'
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove(
                        'border-primary/70',
                        'bg-card/80'
                      );
                      if (
                        e.dataTransfer.files &&
                        e.dataTransfer.files.length > 0
                      ) {
                        const event = {
                          target: { files: e.dataTransfer.files },
                          preventDefault: () => {},
                          stopPropagation: () => {}
                        } as React.ChangeEvent<HTMLInputElement>;
                        handleFileUpload(event);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 rounded-full bg-primary/10">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6 text-primary"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div className="space-y-1">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                          <span>Click to upload</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".html,.htm,text/html"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="text-xs text-muted-foreground">
                          or drag and drop HTML files
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Supports HTML reports from your trading platform
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs font-medium bg-background text-muted-foreground rounded-full border border-border">
                      OR
                    </span>
                  </div>
                </div>

                {/* Manual Input Section */}
                <div className="space-y-2">
                  <label
                    htmlFor="tradeData"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Paste trade data manually:
                  </label>
                  <textarea
                    id="tradeData"
                    rows={8}
                    className="w-full p-2 border rounded-md font-mono text-sm"
                    value={tradeInput}
                    onChange={handleInputChange}
                    placeholder="Paste your trade data here..."
                  />
                </div>

                <div className="flex flex-col md:flex-row justify-between pt-2 space-y-2 md:space-y-0">
                  <Button className="w-full md:w-auto" onClick={handleImportTrades}>
                    Import Trades
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full md:w-auto"
                    onClick={() => setShowImportSection(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <Card className="mb-8">
          <CardHeader className="px-4 py-3">
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4 md:gap-12">
              <div className="w-10 flex-shrink-0">
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
              <div className="w-10 flex-shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateMonth('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 justify-center md:justify-start">
                <div className="text-right min-w-[80px]">
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
                <div className="text-right min-w-[80px]">
                  <div className="text-sm text-muted-foreground">
                    Trading Days
                  </div>
                  <div className="text-lg font-bold">
                    {monthlyTotals.tradingDays}
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm text-muted-foreground">
                    Total Trades
                  </div>
                  <div className="text-lg font-bold">
                    {monthlyTotals.totalTrades}
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-lg font-bold">
                    {monthlyTotals.totalTrades > 0
                      ? formatPercentage(
                          (monthlyTotals.profitableTrades /
                            monthlyTotals.totalTrades) *
                            100
                        )
                      : 'N/A'}
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm text-muted-foreground">
                    Avg Profit (pts)
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {monthlyTotals.profitPoints.length > 0
                      ? formatPoints(
                          monthlyTotals.profitPoints.reduce(
                            (a, b) => a + b,
                            0
                          ) / monthlyTotals.profitPoints.length
                        )
                      : 'N/A'}
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm text-muted-foreground">
                    Avg Loss (pts)
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {monthlyTotals.lossPoints.length > 0
                      ? formatPoints(
                          monthlyTotals.lossPoints.reduce((a, b) => a + b, 0) /
                            monthlyTotals.lossPoints.length
                        )
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-4 mt-6">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-2 text-center text-xs font-medium text-muted-foreground"
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
                      'relative min-h-[80px] border-r p-1.5 last:border-r-0',
                      !day.isCurrentMonth && 'bg-muted/30',
                      day.isToday && 'bg-blue-50 dark:bg-blue-950/20'
                    )}
                  >
                    {/* Date number */}
                    <div className="flex items-start justify-between">
                      <div
                        className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
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
                          {formatCurrency(day.tradingData.pnl).replace('$', '')}
                        </Badge>

                        {/* Volume bars */}
                        {(day.tradingData.profitPoints.length > 0 ||
                          day.tradingData.lossPoints.length > 0) && (
                          <div className="mt-1 flex items-end justify-center h-8 w-full">
                            <div className="flex items-end h-full w-full space-x-0.5 px-1 opacity-25 hover:opacity-100 transition-opacity">
                              {/* Winning trades */}
                              {day.tradingData?.profitPoints?.map(
                                (points: number, i: number) => (
                                  <div
                                    key={`win-${i}`}
                                    className=" bg-green-500 rounded-xs w-2"
                                    style={{
                                      height: `${Math.min(
                                        points * POINTS_SCALING_FACTOR,
                                        100
                                      )}%`,
                                      maxHeight: '100%',
                                    }}
                                    title={`+${formatPoints(points)} pts`}
                                  />
                                )
                              )}
                              {/* Losing trades */}
                              {day.tradingData?.lossPoints?.map(
                                (points: number, i: number) => (
                                  <div
                                    key={`loss-${i}`}
                                    className=" bg-red-500 rounded-xs w-2"
                                    style={{
                                      height: `${Math.min(
                                        points * POINTS_SCALING_FACTOR,
                                        100
                                      )}%`,
                                      maxHeight: '100%',
                                      alignSelf: 'flex-end',
                                    }}
                                    title={`-${formatPoints(points)} pts`}
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Overall Statistics */}
        <Card className="mt-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Overall Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-12">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total P&L
                  </CardTitle>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      Object.values(tradingData).reduce(
                        (sum, day) => sum + day.pnl,
                        0
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time profit & loss
                  </p>
                </CardContent>
              </Card>
              <Card className="col-span-3 border-0 shadow-sm bg-gradient-to-b from-card to-card/90 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-foreground/90">
                    Weekly Performance
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Net P&L by weekday
                  </p>
                </CardHeader>
                <CardContent className="h-[300px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weekdayData}
                      margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      barCategoryGap={12}
                      barSize={32}
                    >
                      <defs>
                        <linearGradient
                          id="profitGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#10b981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor="#059669"
                            stopOpacity={0.9}
                          />
                        </linearGradient>
                        <linearGradient
                          id="lossGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#ef4444"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor="#dc2626"
                            stopOpacity={0.9}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--muted))"
                        strokeOpacity={0.3}
                      />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: 'hsl(0, 0%, 80%)',
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                        padding={{ left: 10, right: 10 }}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `$${Math.abs(Number(value))}${
                            value >= 1000 ? 'K' : ''
                          }`
                        }
                        width={50}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: 'hsl(0, 0%, 80%)',
                          fontSize: 11,
                          dx: -5,
                        }}
                        tickMargin={8}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const value = payload[0].value as number;
                            return (
                              <div className="bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-lg">
                                <p className="font-medium text-sm">{label}</p>
                                <p
                                  className={cn(
                                    'text-sm font-semibold',
                                    value >= 0
                                      ? 'text-green-500'
                                      : 'text-red-500'
                                  )}
                                >
                                  {value >= 0 ? '+' : ''}
                                  {value.toFixed(2)} USD
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {payload[0].payload.trades} trades
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                        cursor={{
                          fill: 'hsl(var(--muted))',
                          fillOpacity: 0.1,
                          stroke: 'hsl(var(--muted-foreground))',
                          strokeWidth: 1,
                          strokeDasharray: '3 3',
                          radius: 4,
                        }}
                      />
                      <Bar
                        dataKey="pnl"
                        name="P&L"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      >
                        {weekdayData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.pnl >= 0
                                ? 'url(#profitGradient)'
                                : 'url(#lossGradient)'
                            }
                            stroke={
                              entry.pnl >= 0
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)'
                            }
                            strokeWidth={1}
                            className="transition-all duration-300 hover:opacity-80"
                          />
                        ))}
                      </Bar>
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Profit Factor
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    profitFactor === null
                      ? 'text-muted-foreground'
                      : profitFactor > 1.5
                      ? 'text-green-500'
                      : profitFactor > 1
                      ? 'text-amber-400'
                      : 'text-red-500'
                  }`}
                >
                  {profitFactor === null
                    ? 'N/A'
                    : profitFactor === Infinity
                    ? '∞'
                    : profitFactor.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">
                  Total Trades
                </div>
                <div className="text-2xl font-bold mt-1">
                  {Object.values(tradingData).reduce(
                    (sum, day) => sum + day.trades,
                    0
                  )}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Win Rate</div>
                <div className="text-2xl font-bold mt-1">
                  {Object.values(tradingData).reduce(
                    (sum, day) => sum + day.trades,
                    0
                  ) > 0
                    ? formatPercentage(
                        (Object.values(tradingData).reduce(
                          (sum, day) => sum + day.profitableTrades,
                          0
                        ) /
                          Object.values(tradingData).reduce(
                            (sum, day) => sum + day.trades,
                            0
                          )) *
                          100
                      )
                    : 'N/A'}
                </div>
              </div>
            </div>
            <div className="h-80">
              <PortfolioChart data={chartData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default TradingCalendar;
