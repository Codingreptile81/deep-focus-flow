import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GoogleCalendarStatus {
  connected: boolean;
  sync_enabled: boolean;
  last_sync_at: string | null;
  calendar_id: string;
}

export function useGoogleCalendar() {
  const [status, setStatus] = useState<GoogleCalendarStatus>({
    connected: false,
    sync_enabled: false,
    last_sync_at: null,
    calendar_id: 'primary',
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=status`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await res.json();
      setStatus({
        connected: result.connected ?? false,
        sync_enabled: result.sync_enabled ?? false,
        last_sync_at: result.last_sync_at ?? null,
        calendar_id: result.calendar_id ?? 'primary',
      });
    } catch (err) {
      console.error('Failed to fetch Google Calendar status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const connect = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const redirectUri = `${window.location.origin}/google-callback`;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=get-auth-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ redirect_uri: redirectUri }),
        }
      );
      const result = await res.json();
      if (result.url) {
        window.location.href = result.url;
      } else {
        toast({ title: 'Failed to get auth URL', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Connection failed', description: (err as Error).message, variant: 'destructive' });
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=disconnect`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await res.json();
      if (result.success) {
        setStatus({ connected: false, sync_enabled: false, last_sync_at: null, calendar_id: 'primary' });
        toast({ title: 'Google Calendar disconnected' });
      }
    } catch (err) {
      toast({ title: 'Disconnect failed', description: (err as Error).message, variant: 'destructive' });
    }
  }, []);

  const sync = useCallback(async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await res.json();
      if (result.success) {
        toast({
          title: 'Sync complete',
          description: `Pushed ${result.pushed} tasks, pulled ${result.pulled} events`,
        });
        await fetchStatus();
      } else {
        toast({ title: 'Sync failed', description: result.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Sync failed', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }, [fetchStatus]);

  return { status, loading, syncing, connect, disconnect, sync, refetch: fetchStatus };
}
