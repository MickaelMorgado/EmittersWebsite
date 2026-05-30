#!/usr/bin/env python3
import csv
import random
from datetime import datetime, timedelta

# Read existing CSV
existing_file = '/sessions/charming-optimistic-franklin/mnt/EmittersWebsite/tools/EURUSD_M5_202603020000_202603170000.csv'
output_file = '/sessions/charming-optimistic-franklin/mnt/EmittersWebsite/tools/EURUSD_M5_6months_demo.csv'

# Read existing data
rows = []
last_close = 1.17722
last_date = None
last_time = None

with open(existing_file, 'r') as f:
    reader = csv.reader(f, delimiter='\t')
    header = next(reader)  # Skip header
    for row in reader:
        if len(row) < 9:
            continue
        row_dict = {
            '<DATE>': row[0],
            '<TIME>': row[1],
            '<OPEN>': row[2],
            '<HIGH>': row[3],
            '<LOW>': row[4],
            '<CLOSE>': row[5],
            '<TICKVOL>': int(row[6]),
            '<VOL>': int(row[7]),
            '<SPREAD>': int(row[8])
        }
        rows.append(row_dict)
        last_close = float(row[5])
        last_date = row[0]
        last_time = row[1]

print(f"Loaded {len(rows)} existing candles")
print(f"Last candle: {last_date} {last_time} @ {last_close}")

# Parse last datetime
date_parts = last_date.split('.')
time_parts = last_time.split(':')
last_datetime = datetime(int(date_parts[0]), int(date_parts[1]), int(date_parts[2]),
                         int(time_parts[0]), int(time_parts[1]), int(time_parts[2]))

print(f"Last datetime: {last_datetime}")

# Generate 6 months of data (approximately 180 days)
# 5-minute candles: 288 per day (24*60/5)
target_candles = 51840  # 180 days * 288 candles/day
needed_candles = target_candles - len(rows)

print(f"Generating {needed_candles} additional candles...")

# Start from the day after last candle
current_datetime = last_datetime + timedelta(minutes=5)
current_price = last_close

# Parameters for realistic price movement
volatility = 0.0001  # ~1 pip on average
trend_strength = 0.00002
trend_direction = random.choice([-1, 1])
trend_change_interval = 1440  # Change trend every 1440 candles (1 day)
candles_in_trend = 0

generated_rows = []

for i in range(needed_candles):
    # Change trend periodically
    if candles_in_trend >= trend_change_interval:
        trend_direction = random.choice([-1, 1])
        candles_in_trend = 0
    candles_in_trend += 1

    # Generate OHLC
    open_price = current_price

    # Random walk with trend
    close_price = current_price + (random.gauss(0, volatility) + trend_direction * trend_strength)

    # High and low (typically open/close ± some volatility)
    price_range = abs(random.gauss(0, volatility * 0.8))
    high_price = max(open_price, close_price) + price_range
    low_price = min(open_price, close_price) - price_range

    # Normalize to 5 decimal places
    open_price = round(open_price, 5)
    high_price = round(high_price, 5)
    low_price = round(low_price, 5)
    close_price = round(close_price, 5)

    # Generate timestamp
    date_str = current_datetime.strftime('%Y.%m.%d')
    time_str = current_datetime.strftime('%H:%M:%S')

    # Generate realistic volume data
    tickvol = random.randint(20, 800)
    vol = 0
    spread = random.randint(0, 15)

    generated_rows.append({
        '<DATE>': date_str,
        '<TIME>': time_str,
        '<OPEN>': f'{open_price:.5f}',
        '<HIGH>': f'{high_price:.5f}',
        '<LOW>': f'{low_price:.5f}',
        '<CLOSE>': f'{close_price:.5f}',
        '<TICKVOL>': tickvol,
        '<VOL>': vol,
        '<SPREAD>': spread
    })

    current_price = close_price
    current_datetime += timedelta(minutes=5)

    if (i + 1) % 10000 == 0:
        print(f"Generated {i + 1}/{needed_candles} candles...")

print(f"Total generated candles: {len(generated_rows)}")

# Write combined data to output file
with open(output_file, 'w', newline='') as f:
    fieldnames = ['<DATE>', '<TIME>', '<OPEN>', '<HIGH>', '<LOW>', '<CLOSE>', '<TICKVOL>', '<VOL>', '<SPREAD>']
    writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter='\t')

    # Write header
    writer.writerow({field: field for field in fieldnames})

    # Write existing rows
    for row in rows:
        writer.writerow(row)

    # Write generated rows
    for row in generated_rows:
        writer.writerow(row)

total_candles = len(rows) + len(generated_rows)
print(f"\n✅ Successfully created {output_file}")
print(f"Total candles: {total_candles}")
print(f"Date range: {rows[0]['<DATE>']} {rows[0]['<TIME>']} to {generated_rows[-1]['<DATE>']} {generated_rows[-1]['<TIME>']}")
print(f"Approximately {total_candles / 288:.0f} days of 5-minute data")
