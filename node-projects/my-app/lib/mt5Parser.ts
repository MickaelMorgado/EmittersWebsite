interface Trade {
  date: string;
  profit: number;
  symbol: string;
  type: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
}

export function parseMT5CSV(csvText: string): Trade[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return []; // Need at least header + one data row

  const trades: Trade[] = [];
  const header = lines[0].toLowerCase();
  const isTabSeparated = header.includes('\t');
  const delimiter = isTabSeparated ? '\t' : /,(?=(?:[^"]*"[^"]*")*[^"]*$)/; // Handle quoted commas

  // Split header to get column indices
  const headerColumns = header.split('\t').map(col => col.trim().toLowerCase());
  const getHeaderIndex = (colName: string) => headerColumns.indexOf(colName);

  // Process each line (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Handle both quoted and unquoted values
      const values = isTabSeparated
        ? line.split('\t').map(v => v.trim().replace(/^"|"$/g, ''))
        : line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));

      // Get column indices from header
      const timeIndex = getHeaderIndex('time');
      const profitIndex = getHeaderIndex('profit');
      const symbolIndex = getHeaderIndex('symbol');
      const typeIndex = getHeaderIndex('type');
      const volumeIndex = getHeaderIndex('volume');
      const priceIndex = getHeaderIndex('price');
      const commissionIndex = getHeaderIndex('commission');
      const swapIndex = getHeaderIndex('swap');

      console.log('Header indices:', {
        timeIndex, profitIndex, symbolIndex, typeIndex,
        volumeIndex, priceIndex, commissionIndex, swapIndex
      });
      console.log('Values:', values);

      if (timeIndex === -1 || profitIndex === -1) continue; // Skip if required columns not found

      // Parse date from MT5 format (YYYY.MM.DD HH:MM:SS or YYYY/MM/DD HH:MM:SS)
      const timeValue = values[timeIndex] || '';
      const dateMatch = timeValue.match(/(\d{4})[\/\.](\d{1,2})[\/\.](\d{1,2})/);
      if (!dateMatch) continue; // Skip if date format is invalid

      const [_, year, month, day] = dateMatch.map(Number);
      const date = new Date(year, month - 1, day).toISOString().split('T')[0];

      // Parse numeric values, defaulting to 0 if not a valid number
      const parseNumber = (val: string) => {
        if (val === undefined || val === null || val.trim() === '') return 0;
        const num = parseFloat(val.toString().replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
      };

      trades.push({
        date,
        profit: parseNumber(values[profitIndex] || '0'),
        symbol: values[symbolIndex] || '',
        type: values[typeIndex] || '',
        volume: parseNumber(values[volumeIndex] || '0'),
        price: parseNumber(values[priceIndex] || '0'),
        commission: parseNumber(values[commissionIndex] || '0'),
        swap: parseNumber(values[swapIndex] || '0')
      });

    } catch (err) {
      console.warn('Error parsing line:', line, err);
      continue; // Skip lines that cause errors
    }
  }

  return trades;
}

export function groupTradesByDate(trades: Trade[]): Record<string, { pnl: number; trades: number }> {
  const result: Record<string, { pnl: number; trades: number }> = {};

  trades.forEach(trade => {
    if (!result[trade.date]) {
      result[trade.date] = { pnl: 0, trades: 0 };
    }

    result[trade.date].pnl += trade.profit + trade.commission + trade.swap;
    result[trade.date].trades++;
  });

  return result;
}
