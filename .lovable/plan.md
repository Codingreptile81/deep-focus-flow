

# Google Calendar Two-Way Sync

## Overview

Two-way sync between your planner tasks and Google Calendar events. Tasks with scheduled dates and times become calendar events; calendar events become tasks in your planner.

## Why This Is Complex

Google Calendar two-way sync requires:
1. **Google OAuth consent** — users must grant calendar access via their Google account
2. **Google Cloud project setup** — you need a Google Cloud project with Calendar API enabled and OAuth credentials (Client ID + Secret)
3. **Edge functions** for server-side API calls (push tasks → events, pull events → tasks)
4. **Conflict resolution** — deciding what happens when both sides change
5. **Webhook or polling** for near-real-time sync from Google back to your app

## Technical Plan

### 1. Database Migration
- Add `google_calendar_id` column to `tasks` table (stores the Google event ID for synced tasks)
- Create `google_calendar_sync` table to store per-user sync metadata (last sync timestamp, sync enabled flag, calendar ID to sync with)

### 2. Google OAuth Flow
- Use the existing auth system. Add a "Connect Google Calendar" button on the Profile or Planner page.
- Create an edge function `google-calendar-auth` that initiates OAuth with `https://www.googleapis.com/auth/calendar` scope, and a callback handler that stores refresh/access tokens securely in a new `google_tokens` table (encrypted, RLS-protected).
- **Required secrets**: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from Google Cloud Console.

### 3. Edge Functions
- **`google-calendar-sync`**: Handles both push (task → event) and pull (event → task) operations. Uses refresh tokens to get valid access tokens. Matches by `google_calendar_id` to avoid duplicates.
- **`google-calendar-webhook`** (optional, for real-time): Receives push notifications from Google Calendar API when events change.

### 4. Frontend Changes
- Add "Connect Google Calendar" button in Profile/Settings
- Add sync toggle and manual "Sync Now" button in Planner
- Show sync status indicator on tasks that are linked to calendar events

### 5. Sync Logic
- On task create/update with `scheduled_date` + `start_time`/`end_time` → create/update Google Calendar event
- On pull: fetch recent calendar changes → create/update tasks
- Conflict resolution: last-write-wins based on `updated_at` timestamps

## Prerequisites You Need

Before implementation, you'll need to:
1. Create a project in Google Cloud Console
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URI (your app's callback URL)
5. Provide the Client ID and Client Secret to be stored securely

## Implementation Steps

1. Set up Google Cloud credentials (user action)
2. Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` as secrets
3. Create database tables (`google_tokens`, add `google_calendar_id` to tasks, `google_calendar_sync`)
4. Build OAuth edge function for Google Calendar authorization
5. Build sync edge function for push/pull operations
6. Add frontend UI for connecting, disconnecting, and triggering sync
7. Add sync status indicators on tasks

