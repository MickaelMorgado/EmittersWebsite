export interface Entry {
  id?: string;
  symbol?: string;
  date: string;
  qty: number;
  price: number;
  currency?: string;
}

export const CURRENCY_MAP: Record<string, string> = {
  DIB: 'EUR', KVU: 'USD', EXO: 'USD', EXOD: 'USD', XBO: 'EUR', MOTA: 'EUR',
  XPEV: 'USD', MSGM: 'USD', NBIU: 'EUR', IPRP: 'EUR', EDPR: 'EUR', TDG: 'EUR', XGAT: 'EUR',
  BTC: 'USD', ETH: 'USD', LTC: 'USD', XRP: 'USD', SOL: 'USD',
  FIL: 'USD', DOGE: 'USD', ADA: 'USD', XTZ: 'USD',
  XAU: 'USD', XPT: 'USD', SP500: 'USD',
};

export async function fetchEntries(symbol: string): Promise<Entry[]> {
  try {
    const res = await fetch(`/api/investments/entries?symbol=${symbol}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchAllEntries(): Promise<Record<string, Entry[]>> {
  try {
    const res = await fetch('/api/investments/entries', { cache: 'no-store' });
    if (!res.ok) return {};
    const data = await res.json();
    if (!Array.isArray(data)) return {};

    const grouped: Record<string, Entry[]> = {};
    for (const entry of data) {
      if (!grouped[entry.symbol]) grouped[entry.symbol] = [];
      grouped[entry.symbol].push(entry);
    }
    for (const symbol of Object.keys(grouped)) {
      grouped[symbol].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return grouped;
  } catch {
    return {};
  }
}

export async function createEntry(entry: { symbol: string; date: string; qty: number; price: number; currency?: string }): Promise<Entry | null> {
  try {
    const res = await fetch('/api/investments/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteEntry(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/investments/entries?id=${id}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export function getEntriesFromMap(allEntries: Record<string, Entry[]>, symbol: string): Entry[] {
  return allEntries[symbol] || [];
}

export function getTotalQty(entries: Entry[]): number {
  return entries.reduce((sum, e) => sum + e.qty, 0);
}

export function getBEPFromEntries(entries: Entry[]): number {
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

export function getCurrency(symbol: string, entries?: Entry[]): string {
  if (entries && entries.length > 0 && entries[0].currency) {
    return entries[0].currency;
  }
  return CURRENCY_MAP[symbol] || 'USD';
}
