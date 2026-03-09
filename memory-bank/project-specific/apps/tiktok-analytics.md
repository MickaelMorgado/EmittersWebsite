# TikTok Analytics

Import and analyze TikTok video metrics from CSV data.

## Overview

The TikTok Analytics app allows you to import tab-separated CSV data containing TikTok video metrics and visualize engagement trends over time.

## CSV Format

Tab-separated values with columns:
1. Post date (e.g., "March 7")
2. Caption/Description
3. TikTok URL
4. Metrics date (e.g., "August 10")
5. Views
6. Likes
7. Comments
8. Shares

Example:
```
March 7	Chasing perfection at AIA. 🏎️💨 ...	https://www.tiktok.com/@mickaelmorgado7/video/7536751957243989280	August 10	23	3	0	357
```

## Key Features

- **CSV Import**: Drag-and-drop or file picker to import tab-separated data.
- **Stats Dashboard**: Overview cards showing total videos, views, likes, comments, and shares.
- **Engagement Charts**: Area charts visualizing views and likes trends over time.
- **Data Table**: Sortable table with all video metrics.
- **Direct Links**: Click any row to open the TikTok video in a new tab.
- **Sort Functionality**: Click column headers to sort by any metric.

## Technical Details

- **Frontend**: Next.js (App Router), Recharts for data visualization.
- **State Management**: Zustand store (`useTikTokAnalyticsStore`).
- **UI Components**: Card, Button, Input from `@/components/ui/`.
- **Location**: `node-projects/my-app/src/app/tiktok-analytics/`

## Usage

1. Open the TikTok Analytics page.
2. Drag and drop a CSV file or click to select one.
3. View the stats dashboard and charts.
4. Click column headers to sort data.
5. Click any row to open the TikTok video.
