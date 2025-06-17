"use client";

import React, { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { parseMT5CSV } from '../../lib/mt5Parser';

type Trade = {
    time: string;
    profit: number;
};

type TradingData = {
    [date: string]: {
        profit: number;
        trades: number;
    };
};

export default function PNLCalendar() {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [tradingData, setTradingData] = useState<TradingData>({});
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
    const currentYear = currentDate.getFullYear();

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
    };

    const groupTradesByDate = (trades: Trade[]): TradingData => {
        return trades.reduce((acc, trade) => {
            const date = trade.time.split(' ')[0];
            if (!acc[date]) {
                acc[date] = { profit: 0, trades: 0 };
            }
            acc[date].profit += trade.profit;
            acc[date].trades += 1;
            return acc;
        }, {} as TradingData);
    };

    const handleParseData = useCallback(() => {
        if (!inputText.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const trades = parseMT5CSV(inputText);
            setTradingData(groupTradesByDate(trades));
        } catch (err) {
            setError('Failed to parse the data. Please check the format and try again.');
            console.error('Error parsing data:', err);
        } finally {
            setIsLoading(false);
        }
    }, [inputText]);

    const handleDateSelect = useCallback((date: Date | null) => {
        if (date) {
            setSelectedDate(format(date, 'yyyy-MM-dd'));
        } else {
            setSelectedDate(null);
        }
    }, []);

    const prevMonth = () => {
        setCurrentDate(new Date(currentYear, currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentYear, currentDate.getMonth() + 1, 1));
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>PNL Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="mb-4">
                                <label htmlFor="trades" className="block text-sm font-medium mb-2">
                                    Paste MT5 Trades (CSV format)
                                </label>
                                <textarea
                                    id="trades"
                                    rows={10}
                                    className="w-full p-2 border rounded-md font-mono text-sm"
                                    value={inputText}
                                    onChange={handleInputChange}
                                    placeholder="Paste your MT5 trades CSV data here..."
                                />
                            </div>
                            <Button
                                onClick={handleParseData}
                                disabled={isLoading || !inputText.trim()}
                                className="w-full md:w-auto"
                            >
                                {isLoading ? 'Processing...' : 'Parse Trades'}
                            </Button>
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <Button variant="outline" size="icon" onClick={prevMonth}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <h2 className="text-xl font-semibold">
                                    {monthName} {currentYear}
                                </h2>
                                <Button variant="outline" size="icon" onClick={nextMonth}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="rounded-md border p-4">

                            </div>

                            {selectedDate && tradingData[selectedDate] && (
                                <div className="mt-4 p-3 bg-muted rounded-md">
                                    <h3 className="font-medium mb-1">
                                        {format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy')}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Trades</p>
                                            <p className="font-medium">{tradingData[selectedDate].trades}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">Daily P/L</p>
                                            <p className={cn(
                                                'font-medium',
                                                tradingData[selectedDate].profit >= 0 ? 'text-green-600' : 'text-red-600'
                                            )}>
                                                {tradingData[selectedDate].profit >= 0 ? '+' : ''}
                                                {tradingData[selectedDate].profit.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
