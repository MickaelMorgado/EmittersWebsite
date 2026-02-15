# PNL Calendar

Trading profit and loss tracking calendar for monitoring performance and analyzing trade data.

## Features

- **Interactive Calendar**: View daily P&L results in a grid format.
- **Data Import**: 
  - **File Upload**: Import trade data from CSV files.
  - **Manual Paste**: Paste trade results directly into the application.
- **Statistics & Analysis**:
  - Monthly P&L totals.
  - Performance analysis by weekday (Win/Loss ratios, Avg P&L).
  - Visualization of trading performance via charts.
- **Trade Logging**: Detailed breakdown of individual trades per day.

## Technical Details

- **Location**: `node-projects/my-app/src/app/PNLCalendar/`
- **Component Structure**:
  - `page.tsx`: Main entry point.
  - `full-calendar.tsx`: Core logic for trade parsing, statistics calculation, and rendering.
- **Logic**:
  - Parses trade data into daily buckets.
  - Calculates daily P&L sums.
  - Aggregates monthly and weekday-based performance metrics.

## Dependencies

- `date-fns`: For date manipulation and formatting.
- `recharts` (implied/used for data visualization).
- `lucide-react`: For UI icons.
