# Agent Leaderboard Dashboard Spec

## Goal

Build a dashboard that shows, for each campaign:

- Agent name
- Agent image
- Selected metric rank
- Photo-first top 3 display

The dashboard must:

- Read live or near-live data from Google Sheets
- Support 3 to 4 campaign-specific dashboard views
- Rotate between campaign views on a fixed interval
- Update rankings automatically when the sheet data changes

Final behavior:

- Use the sheet fields `name`, `email id`, `Campaign`, `Walkin Scheduled`, `Admission`, `Walkin Turned`, and `Photo Link`
- Show only the top 3 agents per `Campaign`
- Treat `Walkin Scheduled` as day-wise
- Treat `Admission` and `Walkin Turned` as month-to-date
- If the main heading is `Walkin Scheduled`, show the three campaign dashboards for that metric on one screen

## Recommended Approach

Use **Next.js App Router** as the dashboard shell, with **Google Sheets as the source of truth** and a thin server layer that normalizes the sheet data.

Best practical setup:

1. Store agent data in Google Sheets
2. Expose that data through a small server-side fetch layer
3. Render each campaign dashboard from the normalized data
4. Auto-rotate campaign views on the client
5. Revalidate or refresh data on a short interval

This is the best balance of:

- Simplicity
- Low maintenance
- Easy updates by non-technical users
- Good performance for a public or internal display screen

## Why This Is the Best Feasible Option

Google Sheets is already the easiest place for manual updates. The dashboard should not duplicate that data in a separate database unless absolutely necessary.

This approach avoids:

- Building and maintaining a second data entry system
- Manual sync jobs that can drift
- Heavy backend infrastructure for a simple leaderboard use case

It also keeps the dashboard flexible if later you want:

- More campaign tabs
- More agent fields
- Multiple display screens
- Historical reporting

## Data Source Design

### Option A: Google Apps Script JSON endpoint

Recommended if the sheet will be edited manually and you want the simplest reliable sync.

Flow:

1. Google Sheet contains the raw agent rows
2. Apps Script reads the sheet
3. Apps Script returns JSON from a published endpoint
4. Next.js fetches the JSON and renders the dashboard

Pros:

- Easy to set up
- No service account setup on the Next.js side
- Can trigger refresh logic from the sheet if needed

### Option B: Google Sheets API directly

Recommended only if you already have Google Cloud credentials and want tighter control.

Flow:

1. Next.js server fetches Google Sheets API
2. Sheet rows are normalized on the server
3. Dashboard uses the processed data

Pros:

- More direct integration
- Easier to scale if the data model grows

## Data Model

Use one row per agent.

Suggested columns:

- `name`
- `email_id`
- `campaign`
- `walkin_scheduled`
- `admission`
- `walkin_turned`
- `photo_link`
- `updated_at`

Optional columns:

- `agent_id`
- `team`
- `location`
- `badge_color`
- `sort_override`

### Example Sheet Structure

| name | email id | Campaign | Walkin Scheduled | Admission | Walkin Turned | Photo Link |
| --- | --- | --- | --- | --- | --- | --- |
| Rahul | rahul@example.com | Campaign A | 12 | 42 | 18 | https://.../rahul.jpg |
| Priya | priya@example.com | Campaign A | 15 | 39 | 20 | https://.../priya.jpg |
| Amir | amir@example.com | Campaign B | 10 | 51 | 22 | https://.../amir.jpg |

## Ranking Rules

Rank agents within each campaign by the selected metric descending.

Metric mapping:

- `Walkin Scheduled` -> day-wise total
- `Admission` -> month-to-date total
- `Walkin Turned` -> month-to-date total

Only show:

- Rank 1
- Rank 2
- Rank 3

Tie-breakers:

1. Higher selected metric value
2. Earlier `updated_at`
3. Alphabetical `name`

If the sheet already provides rank, the dashboard can still compute it again to avoid stale ordering.

## Dashboard Behavior

### Campaign Views

There should be one visual dashboard per campaign.

Each campaign view should show:

- Campaign title
- Live update status
- The top 3 ranked agents only
- Agent photos as the primary visual
- Agent name and metric value as secondary text if needed
- Current rank

If the selected main heading is `Walkin Scheduled`, render three sections on the same screen. Each section should be fetched by `Campaign` and should show the top 3 agents for that campaign based on `Walkin Scheduled`.

### Rotation

Rotate campaign dashboards automatically at a fixed interval.

Recommended default:

- Switch campaign every `15` to `30` seconds
- Keep the transition smooth and non-jarring
- Loop continuously

If there are 3 to 4 dashboards, a timed rotation is enough. No complex routing is required unless each dashboard needs a unique URL.

### Rotation Modes

Use either of these:

1. **Single screen rotation**
   - One page cycles through all campaigns
   - Best for TV displays and kiosk mode

2. **Separate campaign routes**
   - Each campaign gets its own URL
   - A shell component rotates between them
   - Better if different teams need dedicated links

Recommended default: **single screen rotation with route-based campaign data**

For your use case, the most practical display mode is:

- One main heading selected by config or operator choice
- Three campaign panels shown together
- Each panel bound to the selected metric
- Automatic rotation only if the screen cannot fit all three panels comfortably

## Refresh Strategy

The sheet data must update without requiring a manual page reload.

Recommended refresh strategy:

- Fetch fresh data on the server at a short interval
- Revalidate the dashboard data on a timer
- Optionally trigger immediate refresh when the sheet changes

### Practical Refresh Options

#### Option 1: Poll every 15 seconds

Simple and reliable.

Use when:

- Sheet updates are frequent but not constant
- You want minimal moving parts

#### Option 2: Webhook-style refresh from Apps Script

Best if you want the dashboard to update soon after the sheet changes.

Use Apps Script to call a refresh endpoint whenever the sheet changes.

Use when:

- Updates need to appear quickly
- You want less polling traffic

#### Recommended default

Use **polling + server caching** first, then add webhook-triggered refresh later if needed.

## Metric Interpretation

Interpret the sheet data like this:

- `Walkin Scheduled` uses the current day only
- `Admission` uses month start to today
- `Walkin Turned` uses month start to today

If the sheet stores already-aggregated values, use them directly for the selected metric.

If the sheet stores raw rows, the server layer should group by:

- `name`
- `campaign`
- date window for the selected metric

Then compute totals before ranking.

The dashboard should then:

- Filter rows by the selected main metric
- Group the rows by `Campaign`
- Sort each campaign group by the selected metric descending
- Keep only the top 3 agents in each group
- Render only the agent photos prominently

## Next.js Implementation Notes

The current repo uses the App Router, so the implementation should follow that structure.

Recommended structure:

- `src/app/page.tsx` for the main dashboard shell
- `src/app/api/...` for a data proxy or refresh endpoint if needed
- `src/app/loading.tsx` or route-level loading states for smooth transitions
- Client-side carousel/rotation logic in a small component

### Image Handling

Use `next/image` for agent photos.

Requirements:

- Allow external image URLs in `next.config.ts` if the photos are hosted outside the app
- Use fixed dimensions or `fill` with a constrained parent container
- Provide a fallback image for missing or broken URLs

### Caching Recommendation

If the data comes through a server fetch layer:

- Cache the response briefly
- Revalidate on a short interval
- Refresh the route when the sheet changes

This keeps the dashboard responsive while still showing recent counts.

## Suggested UI Layout

### Header

- Campaign name
- Metric heading, for example `Walkin Scheduled`
- Current date/time
- Last sync time
- Live status indicator

### Spotlight Section

- Top 1 agent
- Large photo
- Name
- Metric value
- Rank badge

### Leaderboard Section

- Ranked list of the top 3 agents in the campaign
- Image thumbnail
- Name
- Metric value
- Rank

### Footer

- Campaign identifier
- Auto-rotation countdown
- Data source status

## Edge Cases

Handle these cases explicitly:

- Missing image URL
- Duplicate agent names
- Zero count
- Empty campaign sheet
- Sheet temporarily unavailable
- Two agents with the same count

Fallback behavior:

- Show a placeholder avatar
- Show `0` for missing counts
- Show an empty state if a campaign has no rows
- Keep the previous data visible briefly if the fetch fails

## Security Notes

- Do not expose raw spreadsheet credentials to the browser
- Keep Google API keys or service account credentials server-side only
- If using Apps Script, publish only the minimum read-only endpoint needed
- Validate and sanitize all sheet values before rendering

## Implementation Phases

### Phase 1: Data contract

- Define the sheet column structure
- Decide whether to use Apps Script or Sheets API
- Normalize campaign and agent fields

### Phase 2: Dashboard shell

- Build the main page
- Add campaign rotation
- Render the leaderboard UI

### Phase 3: Live refresh

- Add polling or webhook refresh
- Add cache invalidation if needed
- Show sync state and fallback handling

### Phase 4: Polish

- Add transitions
- Improve avatar fallbacks
- Add kiosk-friendly full-screen mode
- Tune the auto-rotation interval

## Acceptance Criteria

The dashboard is complete when:

- It reads agent data from Google Sheets
- It shows the top 3 agents per campaign
- It uses the selected metric to calculate rank
- It displays agent photos as the primary element
- It applies the correct time window for the selected metric
- It updates when sheet values change
- It rotates through all campaign dashboards automatically
- It remains stable when data is missing or the source is temporarily down

## Recommendation Summary

Use:

- **Google Sheets** as the source of truth
- **Google Apps Script JSON endpoint** or **Google Sheets API** as the fetch layer
- **Next.js App Router** for rendering
- **Client-side auto-rotation** for campaign switching
- **Short refresh intervals** plus optional webhook revalidation

This is the most practical and maintainable approach for a live leaderboard dashboard that non-technical users will update in Sheets.
