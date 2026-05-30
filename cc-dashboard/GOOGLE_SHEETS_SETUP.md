# Secure Google Sheets Setup

This dashboard reads leaderboard data from Google Sheets using a **service account**.

## Why this setup

- The browser never contacts Google Sheets directly
- The spreadsheet can stay private
- Only the server needs Google credentials

## Required environment variables

Set these in your local `.env.local` or production environment:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=1IlLBIBrOpewHpQ8NnT-eUvp7HRxhOvPgrhgUh9-ufmo
GOOGLE_SHEETS_RANGE=
```

## What to put in the sheet

The first row should contain headers like:

- `name`
- `email id`
- `Campaign`
- `Walkin Scheduled`
- `Admission`
- `Walkin Turned`
- `Photo Link`

## Access required

Share the Google Sheet with the service account email as a viewer.

## How the app reads data

- It uses the spreadsheet ID from `GOOGLE_SHEETS_SPREADSHEET_ID`
- If `GOOGLE_SHEETS_RANGE` is empty, it reads the first sheet tab automatically
- It reads the full row set and groups rows by `Campaign`
- It ranks each campaign by the selected metric and shows only the top 3

## Notes

- Keep the private key server-side only
- Do not expose these values in client-side code
- If you rotate to a different sheet later, change only the spreadsheet ID and range env vars
