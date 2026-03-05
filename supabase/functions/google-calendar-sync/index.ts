import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string | null> {
  const { data: tokenRow } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!tokenRow) return null;

  const row = tokenRow as any;
  const expiresAt = new Date(row.expires_at);

  // If token is still valid (with 5 min buffer)
  if (expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return row.access_token;
  }

  // Refresh the token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: row.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (data.error) return null;

  const newExpiresAt = new Date(
    Date.now() + data.expires_in * 1000
  ).toISOString();

  await supabase
    .from("google_tokens")
    .update({
      access_token: data.access_token,
      expires_at: newExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return data.access_token;
}

// Convert a task to a Google Calendar event body
function taskToEvent(task: any) {
  const event: any = {
    summary: task.title,
    description: task.description || undefined,
  };

  if (task.scheduled_date && task.start_time && task.end_time) {
    event.start = {
      dateTime: `${task.scheduled_date}T${task.start_time}:00`,
      timeZone: "UTC",
    };
    event.end = {
      dateTime: `${task.scheduled_date}T${task.end_time}:00`,
      timeZone: "UTC",
    };
  } else if (task.scheduled_date) {
    event.start = { date: task.scheduled_date };
    event.end = { date: task.scheduled_date };
  }

  return event;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Google Calendar not connected or token expired" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: syncConfig } = await supabase
      .from("google_calendar_sync")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!syncConfig || !(syncConfig as any).sync_enabled) {
      return new Response(
        JSON.stringify({ error: "Sync is disabled" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const calendarId = (syncConfig as any).calendar_id || "primary";
    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };

    // ===== PUSH: Send tasks to Google Calendar =====
    const { data: tasks } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .not("scheduled_date", "is", null);

    const pushResults: any[] = [];

    for (const task of (tasks as any[]) || []) {
      const eventBody = taskToEvent(task);

      if (task.google_calendar_id) {
        // Update existing event
        const res = await fetch(
          `${baseUrl}/events/${task.google_calendar_id}`,
          { method: "PUT", headers, body: JSON.stringify(eventBody) }
        );
        const data = await res.json();
        if (res.ok) {
          pushResults.push({ task_id: task.id, action: "updated", event_id: data.id });
        } else {
          // Event may have been deleted on Google side — create new
          if (res.status === 404) {
            const createRes = await fetch(`${baseUrl}/events`, {
              method: "POST",
              headers,
              body: JSON.stringify(eventBody),
            });
            const createData = await createRes.json();
            if (createRes.ok) {
              await supabase
                .from("tasks")
                .update({ google_calendar_id: createData.id })
                .eq("id", task.id);
              pushResults.push({ task_id: task.id, action: "recreated", event_id: createData.id });
            }
          }
        }
      } else {
        // Create new event
        const res = await fetch(`${baseUrl}/events`, {
          method: "POST",
          headers,
          body: JSON.stringify(eventBody),
        });
        const data = await res.json();
        if (res.ok) {
          await supabase
            .from("tasks")
            .update({ google_calendar_id: data.id })
            .eq("id", task.id);
          pushResults.push({ task_id: task.id, action: "created", event_id: data.id });
        }
      }
    }

    // ===== PULL: Fetch events from Google Calendar =====
    const syncToken = (syncConfig as any).sync_token;
    let eventsUrl = `${baseUrl}/events?maxResults=100&singleEvents=true`;
    if (syncToken) {
      eventsUrl += `&syncToken=${syncToken}`;
    } else {
      // Initial sync: only get future events
      const now = new Date().toISOString();
      eventsUrl += `&timeMin=${now}`;
    }

    const eventsRes = await fetch(eventsUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const eventsData = await eventsRes.json();

    const pullResults: any[] = [];

    if (eventsRes.ok && eventsData.items) {
      // Get all task google_calendar_ids for matching
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("id, google_calendar_id")
        .eq("user_id", user.id)
        .not("google_calendar_id", "is", null);

      const eventIdToTaskId = new Map<string, string>();
      for (const t of (existingTasks as any[]) || []) {
        if (t.google_calendar_id) eventIdToTaskId.set(t.google_calendar_id, t.id);
      }

      for (const event of eventsData.items) {
        if (event.status === "cancelled") {
          // If we have a linked task, we could mark it or skip
          continue;
        }

        const existingTaskId = eventIdToTaskId.get(event.id);
        if (existingTaskId) {
          // Already linked — update task from event
          const updateData: any = { title: event.summary || "Untitled Event" };
          if (event.description) updateData.description = event.description;
          if (event.start?.date) {
            updateData.scheduled_date = event.start.date;
            updateData.start_time = null;
            updateData.end_time = null;
          } else if (event.start?.dateTime) {
            const startDt = new Date(event.start.dateTime);
            updateData.scheduled_date = startDt.toISOString().split("T")[0];
            updateData.start_time = startDt.toTimeString().slice(0, 5);
            if (event.end?.dateTime) {
              const endDt = new Date(event.end.dateTime);
              updateData.end_time = endDt.toTimeString().slice(0, 5);
            }
          }
          await supabase.from("tasks").update(updateData).eq("id", existingTaskId);
          pullResults.push({ event_id: event.id, action: "updated", task_id: existingTaskId });
        } else {
          // New event from Google — create a task
          const newTask: any = {
            title: event.summary || "Untitled Event",
            description: event.description || null,
            user_id: user.id,
            status: "todo",
            priority: "medium",
            position: 0,
            google_calendar_id: event.id,
          };

          if (event.start?.date) {
            newTask.scheduled_date = event.start.date;
          } else if (event.start?.dateTime) {
            const startDt = new Date(event.start.dateTime);
            newTask.scheduled_date = startDt.toISOString().split("T")[0];
            newTask.start_time = startDt.toTimeString().slice(0, 5);
            if (event.end?.dateTime) {
              const endDt = new Date(event.end.dateTime);
              newTask.end_time = endDt.toTimeString().slice(0, 5);
            }
          }

          const { data: inserted } = await supabase
            .from("tasks")
            .insert(newTask)
            .select("id")
            .single();

          if (inserted) {
            pullResults.push({ event_id: event.id, action: "created", task_id: (inserted as any).id });
          }
        }
      }

      // Save the new sync token
      if (eventsData.nextSyncToken) {
        await supabase
          .from("google_calendar_sync")
          .update({
            sync_token: eventsData.nextSyncToken,
            last_sync_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      }
    } else if (eventsRes.status === 410) {
      // Sync token expired — clear it so next sync does a full pull
      await supabase
        .from("google_calendar_sync")
        .update({ sync_token: null, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        pushed: pushResults.length,
        pulled: pullResults.length,
        push_details: pushResults,
        pull_details: pullResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
