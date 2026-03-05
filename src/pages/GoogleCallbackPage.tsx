import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(error);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('No authorization code received');
      return;
    }

    const exchangeCode = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('error');
          setErrorMsg('Not authenticated');
          return;
        }

        const redirectUri = `${window.location.origin}/google-callback`;

        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-auth?action=exchange-code`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          }
        );

        const result = await res.json();
        if (result.success) {
          setStatus('success');
          setTimeout(() => navigate('/planner'), 1500);
        } else {
          setStatus('error');
          setErrorMsg(result.error || 'Failed to connect');
        }
      } catch (err) {
        setStatus('error');
        setErrorMsg((err as Error).message);
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Connecting Google Calendar...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="font-medium">Google Calendar connected!</p>
            <p className="text-sm text-muted-foreground">Redirecting to planner...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="font-medium">Connection failed</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => navigate('/planner')}
              className="text-sm text-primary underline mt-2"
            >
              Back to Planner
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
