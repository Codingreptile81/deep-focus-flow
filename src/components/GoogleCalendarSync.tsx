import React from 'react';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RefreshCw, Unlink, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const GoogleCalendarSync: React.FC = () => {
  const { status, loading, syncing, connect, disconnect, sync } = useGoogleCalendar();

  if (loading) {
    return (
      <Card className="p-4 flex items-center gap-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking Google Calendar...</span>
      </Card>
    );
  }

  if (!status.connected) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground">Sync tasks with your calendar</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={connect} className="gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" /> Connect
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
            <CalendarIcon className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium">Google Calendar</p>
            <p className="text-xs text-muted-foreground">
              {status.last_sync_at
                ? `Last synced ${formatDistanceToNow(new Date(status.last_sync_at))} ago`
                : 'Connected — not yet synced'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={sync}
            disabled={syncing}
            className="gap-1.5"
          >
            {syncing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button size="sm" variant="ghost" onClick={disconnect} className="gap-1.5 text-muted-foreground">
            <Unlink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default GoogleCalendarSync;
