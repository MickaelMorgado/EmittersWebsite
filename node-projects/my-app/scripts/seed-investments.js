/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PORTFOLIO = {
  DB: {
    currency: 'EUR',
    entries: [
      { date: '2024-11-18', qty: 2, price: 8.63 },
      { date: '2025-03-03', qty: 1, price: 14.52 },
      { date: '2025-03-12', qty: 1, price: 10.02 },
      { date: '2025-07-25', qty: 1, price: 12.00 },
      { date: '2025-08-24', qty: 1, price: 12.48 },
      { date: '2025-09-25', qty: 1, price: 12.18 },
    ],
  },
  KVU: {
    currency: 'USD',
    entries: [{ date: '2025-09-24', qty: 2, price: 17.22 }],
  },
  EXO: {
    currency: 'USD',
    entries: [
      { date: '2025-04-09', qty: 1, price: 40.0 },
      { date: '2025-06-02', qty: 1, price: 28.11 },
      { date: '2025-06-06', qty: 1, price: 26.42 },
      { date: '2025-09-10', qty: 1, price: 26.85 },
      { date: '2025-09-15', qty: 1, price: 27.41 },
      { date: '2026-04-29', qty: 10, price: 6.8 },
    ],
  },
  XBO: {
    currency: 'EUR',
    entries: [{ date: '2025-08-25', qty: 70, price: 0.254 }],
  },
  MOTA: {
    currency: 'EUR',
    entries: [{ date: '2025-07-10', qty: 2, price: 4.26 }],
  },
  BTC: {
    currency: 'USD',
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
  },
};

const seed = async () => {
  console.log('Seeding investment entries...\n');

  const rows = [];
  for (const [symbol, data] of Object.entries(PORTFOLIO)) {
    for (const entry of data.entries) {
      rows.push({
        symbol,
        date: entry.date,
        qty: entry.qty,
        price: entry.price,
        currency: data.currency,
      });
    }
  }

  console.log(`Inserting ${rows.length} entries...`);

  const { data, error } = await supabase
    .from('investment_entries')
    .insert(rows)
    .select();

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Done! Inserted ${data.length} entries.`);
};

seed();
