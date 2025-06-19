export interface TradeData {
  [key: string]: {
    pnl: number;
    trades: number;
    profitableTrades: number;
    profitPoints: number[];
    lossPoints: number[];
  };
}

export interface Trade {
  time: string;
  position: string;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  sl: number;
  tp: number;
  closeTime: string;
  closePrice: number;
  commission: number;
  swap: number;
  profit: number;
}

export const parseTradeData = (input: string): TradeData => {
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
      // Parse trade data
      const [datePart] = columns[8].split(' '); // Close time
      const [year, month, day] = datePart.split('.').map(Number);
      const tradeDate = new Date(year, month - 1, day);
      const formattedDate = tradeDate.toISOString().split('T')[0];

      // Parse numeric values with proper error handling
      const parseNumber = (value: string): number => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      };

      const commission = parseNumber(columns[10]);
      const swap = parseNumber(columns[11]);
      const profit = parseNumber(columns[12]);
      const totalProfit = profit + commission + swap;

      // Calculate points for the trade
      const entryPrice = parseNumber(columns[5]);
      const stopLoss = parseNumber(columns[6]);
      const takeProfit = parseNumber(columns[7]);
      const closePrice = parseNumber(columns[9]);
      const tradeType = columns[3].toLowerCase();

      let points = 0;

      if (totalProfit >= 0) {
        points = tradeType === 'buy'
          ? (takeProfit > 0 ? takeProfit - entryPrice : closePrice - entryPrice)
          : (takeProfit > 0 ? entryPrice - takeProfit : entryPrice - closePrice);
      } else {
        points = tradeType === 'buy'
          ? (stopLoss > 0 ? entryPrice - stopLoss : entryPrice - closePrice)
          : (stopLoss > 0 ? stopLoss - entryPrice : closePrice - entryPrice);
      }

      // Ensure points are positive and valid
      points = Math.abs(points) > 0.00001 ? Math.abs(points) : 0;

      // Update or create trade data for this date
      if (data[formattedDate]) {
        data[formattedDate].pnl += totalProfit;
        data[formattedDate].trades += 1;
        if (totalProfit >= 0) {
          data[formattedDate].profitableTrades += 1;
          data[formattedDate].profitPoints.push(points);
        } else {
          data[formattedDate].lossPoints.push(points);
        }
      } else {
        data[formattedDate] = {
          pnl: totalProfit,
          trades: 1,
          profitableTrades: totalProfit >= 0 ? 1 : 0,
          profitPoints: totalProfit >= 0 ? [points] : [],
          lossPoints: totalProfit < 0 ? [points] : [],
        };
      }
    } catch (error) {
      console.error('Error parsing line:', line, error);
    }
  }

  return data;
};

export const sampleData = `2025.06.05 10:04:02\t61595621\tEURUSD\tbuy\t1\t1.14129\t1.14117\t1.14200\t2025.06.05 10:06:54\t1.14117\t-4.00\t0.00\t-10.52
2025.06.05 10:10:05\t61596071\tEURUSD\tbuy\t1\t1.14146\t1.14162\t1.14202\t2025.06.05 10:14:58\t1.14192\t-4.00\t0.00\t40.28
2025.06.06 10:37:04\t61675593\tEURUSD\tbuy\t1\t1.14280\t1.14267\t1.14378\t2025.06.06 10:37:11\t1.14267\t-4.00\t0.00\t-11.38
2025.06.06 10:45:06\t61676274\tEURUSD\tbuy\t1\t1.14284\t1.14271\t1.14375\t2025.06.06 10:46:50\t1.14271\t-4.00\t0.00\t-11.38
2025.06.06 11:03:02\t61677483\tEURUSD\tsell\t1.5\t1.14225\t1.14237\t1.14157\t2025.06.06 11:03:25\t1.14237\t-6.00\t0.00\t-15.76
2025.06.06 11:12:22\t61677870\tEURUSD\tsell\t1.5\t1.14220\t1.14231\t1.14154\t2025.06.06 11:13:26\t1.14231\t-6.00\t0.00\t-14.44`;
