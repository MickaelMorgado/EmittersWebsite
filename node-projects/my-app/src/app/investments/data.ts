export interface Entry {
  date: string;
  qty: number;
  price: number;
}

export interface PortfolioItem {
  entries: Entry[];
  currency: string;
}

export const PORTFOLIO: Record<string, PortfolioItem> = {
  DB: {
    entries: [
      { date: '2024-11-18', qty: 2, price: 8.63 },
      { date: '2025-03-03', qty: 1, price: 14.52 },
      { date: '2025-03-12', qty: 1, price: 10.02 },
      { date: '2025-07-25', qty: 1, price: 12.00 },
      { date: '2025-08-24', qty: 1, price: 12.48 },
      { date: '2025-09-25', qty: 1, price: 12.18 },
    ],
    currency: 'EUR',
  },
  KVU: {
    entries: [
      { date: '2025-09-24', qty: 2, price: 17.22 },
    ],
    currency: 'USD',
  },
  EXO: {
    entries: [
      { date: '2025-04-09', qty: 1, price: 40.00 },
      { date: '2025-06-02', qty: 1, price: 28.11 },
      { date: '2025-06-06', qty: 1, price: 26.42 },
      { date: '2025-09-10', qty: 1, price: 26.85 },
      { date: '2025-09-15', qty: 1, price: 27.41 },
      { date: '2026-04-29', qty: 10, price: 6.80 },
    ],
    currency: 'USD',
  },
  XBO: {
    entries: [
      { date: '2025-08-25', qty: 70, price: 0.254 },
    ],
    currency: 'EUR',
  },
  MOTA: {
    entries: [
      { date: '2025-07-10', qty: 2, price: 4.26 },
    ],
    currency: 'EUR',
  },
  BTC: {
    entries: [
      { date: '2022-08-24', qty: 0.004158, price: 21540 },
      { date: '2022-08-25', qty: -0.0009, price: 21367 },
      { date: '2022-08-29', qty: -0.002548, price: 19660 },
      { date: '2022-11-03', qty: -0.0006582, price: 20171 },
      { date: '2022-11-07', qty: 0.0006, price: 20933 },
      { date: '2022-11-07', qty: 0.0005489, price: 20933 },
      { date: '2022-11-07', qty: -0.000868, price: 20933 },
      { date: '2023-01-10', qty: 0.0009621, price: 17191 },
      { date: '2023-02-06', qty: 0.00225, price: 22985 },
      { date: '2023-05-05', qty: -0.0002417, price: 28838 },
      { date: '2023-07-14', qty: 0.002289, price: 31458 },
      { date: '2023-08-29', qty: 0.003643, price: 26081 },
      { date: '2024-09-12', qty: 0.007697, price: 25151 },
      { date: '2024-09-13', qty: -0.00455, price: 25835 },
      { date: '2025-01-06', qty: -0.0003752, price: 93748 },
      { date: '2025-01-20', qty: 0.0003752, price: 90109 },
      { date: '2025-01-20', qty: 0.0003752, price: 92514 },
      { date: '2025-07-26', qty: 0.001924, price: 117517 },
      { date: '2025-09-09', qty: 0.0005, price: 112080 },
      { date: '2025-09-20', qty: 0.00005, price: 115660 },
      { date: '2025-09-20', qty: 0.003, price: 115667 },
      { date: '2025-10-02', qty: 0.002492, price: 119000 },
      { date: '2025-10-03', qty: 0.001, price: 120450 },
      { date: '2025-10-11', qty: 0.0003, price: 112933 },
      { date: '2025-10-11', qty: 0.0009, price: 112933 },
      { date: '2025-11-11', qty: 0.000326, price: 106000 },
      { date: '2025-11-13', qty: 0.0005393, price: 101600 },
      { date: '2025-11-20', qty: 0.002662, price: 91300 },
      { date: '2026-01-06', qty: -0.0003752, price: 93748 },
      { date: '2026-01-20', qty: 0.0003752, price: 90108.76 },
      { date: '2026-01-20', qty: 0.0003752, price: 34730 },
      { date: '2026-02-05', qty: 0.001595, price: 72970 },
    ],
    currency: 'USD',
  },
};

export function getEntries(symbol: string): Entry[] {
  return PORTFOLIO[symbol]?.entries || [];
}

export function getTotalQty(entries: Entry[]): number {
  return entries.filter(e => e.qty > 0).reduce((sum, e) => sum + e.qty, 0);
}

export function getBEP(entries: Entry[]): number {
  if (entries.length === 0) return 0;
  const buys = entries.filter(e => e.qty > 0);
  if (buys.length === 0) return 0;
  const totalValue = buys.reduce((sum, e) => sum + e.qty * e.price, 0);
  const totalQty = buys.reduce((sum, e) => sum + e.qty, 0);
  return totalQty > 0 ? totalValue / totalQty : 0;
}

export function getAccumulatedValue(entries: Entry[], currentPrice: number): number {
  const totalQty = getTotalQty(entries);
  return totalQty * currentPrice;
}

export function getBEPHistory(entries: Entry[]): { date: string; bep: number }[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningQty = 0;
  let runningValue = 0;

  return sorted.map((entry) => {
    runningQty += entry.qty;
    runningValue += entry.qty * entry.price;
    return {
      date: entry.date,
      bep: runningQty > 0 ? runningValue / runningQty : 0,
    };
  });
}

export function getCurrency(symbol: string): string {
  return PORTFOLIO[symbol]?.currency || 'USD';
}

export function getAllSymbols(): string[] {
  return Object.keys(PORTFOLIO);
}