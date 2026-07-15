const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = {};
fs.readFileSync('.env', 'utf-8').split('\n').forEach(l => { const m = l.match(/^([^#=]+)=(.*)$/); if (m) env[m[1].trim()] = m[2].trim(); });
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const entries = [
  { symbol: 'TDG', date: '2026-06-19', qty: 1, price: 42.354, currency: 'EUR' },
  { symbol: 'XGAT', date: '2026-10-06', qty: 2, price: 116.79, currency: 'EUR' },
  { symbol: 'EXOD', date: '2026-04-29', qty: 4, price: 6.80, currency: 'USD' },
  { symbol: 'EXOD', date: '2026-04-29', qty: 6, price: 6.80, currency: 'USD' },
  { symbol: 'EXOD', date: '2026-04-29', qty: 1, price: 7.44, currency: 'USD' },
  { symbol: 'XPEV', date: '2026-02-02', qty: 1, price: 17.20, currency: 'USD' },
  { symbol: 'EXOD', date: '2026-02-02', qty: 4, price: 12.89, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-12-15', qty: 4, price: 15.20, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-12-02', qty: 4, price: 14.40, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-11-10', qty: 2, price: 21.50, currency: 'USD' },
  { symbol: 'DB', date: '2025-10-16', qty: 5, price: 11.66, currency: 'EUR' },
  { symbol: 'DB', date: '2025-09-25', qty: 1, price: 12.18, currency: 'EUR' },
  { symbol: 'KVU', date: '2025-09-24', qty: 2, price: 17.22, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-09-15', qty: 1, price: 27.405, currency: 'USD' },
  { symbol: 'TTWO_L', date: '2025-09-15', qty: -4, price: 20.73, currency: 'EUR' },
  { symbol: 'EXOD', date: '2025-09-10', qty: 1, price: 26.85, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-09-10', qty: 1, price: 26.85, currency: 'USD' },
  { symbol: 'XBO', date: '2025-08-25', qty: 70, price: 0.254, currency: 'EUR' },
  { symbol: 'DB', date: '2025-08-18', qty: 1, price: 12.48, currency: 'EUR' },
  { symbol: 'TTWO_L', date: '2025-07-25', qty: 1, price: 17.28, currency: 'EUR' },
  { symbol: 'DB', date: '2025-07-25', qty: 1, price: 12.00, currency: 'EUR' },
  { symbol: 'TTWO_L', date: '2025-07-14', qty: 1, price: 19.03, currency: 'EUR' },
  { symbol: 'MOTA', date: '2025-10-07', qty: 2, price: 4.26, currency: 'EUR' },
  { symbol: 'IPRP', date: '2025-10-07', qty: 1, price: 30.865, currency: 'EUR' },
  { symbol: 'MSGM', date: '2025-06-23', qty: -4, price: 2.72, currency: 'USD' },
  { symbol: 'MSGM', date: '2025-06-17', qty: 4, price: 2.80, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-06-06', qty: 1, price: 26.42, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-06-02', qty: 1, price: 28.11, currency: 'USD' },
  { symbol: 'XPEV', date: '2025-05-13', qty: 1, price: 20.36, currency: 'USD' },
  { symbol: 'EXOD', date: '2025-04-09', qty: 1, price: 40.00, currency: 'USD' },
  { symbol: 'DB', date: '2025-12-03', qty: 1, price: 10.02, currency: 'EUR' },
  { symbol: 'NBIU', date: '2025-12-03', qty: -2, price: 5.914, currency: 'EUR' },
  { symbol: 'TTWO_L', date: '2025-10-03', qty: 1, price: 15.56, currency: 'EUR' },
  { symbol: 'DB', date: '2025-03-03', qty: 1, price: 14.52, currency: 'EUR' },
  { symbol: 'EDPR', date: '2025-03-03', qty: -1, price: 8.445, currency: 'EUR' },
  { symbol: 'TTWO_L', date: '2025-02-17', qty: 1, price: 18.60, currency: 'EUR' },
  { symbol: 'EDPR', date: '2025-02-17', qty: -1, price: 8.635, currency: 'EUR' },
  { symbol: 'DB', date: '2024-11-18', qty: 2, price: 8.63, currency: 'EUR' },
  { symbol: 'NBIU', date: '2024-08-13', qty: 2, price: 6.192, currency: 'EUR' },
  { symbol: 'EDPR', date: '2024-07-26', qty: 2, price: 14.22, currency: 'EUR' },
];

(async () => {
  const { error: delErr } = await supabase.from('investment_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1); }
  console.log('All entries deleted');

  const { data, error: insErr } = await supabase.from('investment_entries').insert(entries).select();
  if (insErr) { console.error('Insert error:', insErr.message); process.exit(1); }
  console.log('Inserted', data.length, 'entries');
})();
