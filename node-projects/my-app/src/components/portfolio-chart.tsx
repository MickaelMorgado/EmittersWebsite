'use client';

import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

interface PortfolioChartProps {
  data: Array<{
    date: string;
    pnl: number;
    cumulativePnl: number;
  }>;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    const pnl = payload[0]?.value || 0;
    const isPositive = Number(pnl) >= 0;

    return (
      <div className="bg-card border rounded-lg shadow-lg p-3 text-sm bg-black/75">
        <p className="font-medium">{format(date, 'MMM d, yyyy')}</p>
        <p
          className={cn(
            'font-semibold',
            isPositive ? 'text-green-500' : 'text-red-500'
          )}
        >
          {isPositive ? '+' : ''}
          {pnl?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
        </p>
      </div>
    );
  }
  return null;
};

export function PortfolioChart({ data }: PortfolioChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-muted-foreground bg-card/50 rounded-lg border border-dashed">
        No trading data available
      </div>
    );
  }

  const gradientId = 'portfolioGradient';

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 10,
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeDasharray="0 0"
          />

          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.7)' }}
            tickMargin={10}
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
            className="text-xs"
          />

          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'rgba(255, 255, 255, 0.7)' }}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
                notation: 'compact',
                compactDisplay: 'short',
                minimumFractionDigits: 0,
              }).format(value)
            }
            width={60}
            className="text-xs"
          />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: 'rgba(255, 255, 255, 0.2)',
              strokeWidth: 1,
            }}
          />

          <ReferenceLine
            y={0}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeDasharray="0"
          />

          <Area
            type="monotone"
            dataKey="cumulativePnl"
            stroke="#ffffff"
            strokeWidth={1}
            fillOpacity={0.4}
            fill={`url(#${gradientId})`}
            activeDot={{
              r: 4,
              stroke: '#ffffff',
              strokeWidth: 1,
              fill: '#555',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
