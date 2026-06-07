# Telegram Message Parser

## Description
A web-based tool for analyzing Telegram chat exports. Upload your Telegram JSON export to get detailed statistics and visualizations about your chat.

## Features
- Upload Telegram chat export (result.json)
- View comprehensive statistics:
  - Total messages, participants, date range
  - Average message length
  - Most active senders
  - Media message counts
- Interactive charts:
  - Messages per day (timeline)
  - Messages by hour of day
  - Messages by day of week
  - Top senders
  - Media type distribution
  - Response time distribution
- Responsive design - works on mobile and desktop
- Client-side processing - your data never leaves your browser

## Deployment
This repository is configured to automatically deploy to `amenoke.ru/index/tg-parser/` via the amenodes-ci CI system.

## How to Use
1. Go to https://inzexg-coder.github.io/tg-parser/ (once deployed)
2. Click "Choose JSON file" and select your Telegram chat export
3. Wait for analysis to complete
4. Explore the statistics and charts

## Development
To run locally:
1. Clone the repository
2. Open `index.html` in your browser
3. Use the file uploader to test with sample data

## Notes
- All processing happens in the browser - no data is sent to any server
- Supports various Telegram export formats
- Large chats may take a moment to process
Last updated: 2026-06-07 19:52:37 UTC
Last updated: 2026-06-07 19:59:06 UTC
Last updated: 2026-06-07 20:04:56 UTC
Last updated: 2026-06-07 20:05:09 UTC
