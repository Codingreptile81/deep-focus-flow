import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/hooks/useTheme';
import { LogIn, UserPlus, Loader2, Sun, Moon } from 'lucide-react';

type View = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    if (view === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setLoading(false);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email sent', description: 'Check your inbox for a password reset link.' });
        setView('login');
      }
      return;
    }

    if (!password) { setLoading(false); return; }

    const { error } = view === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="absolute top-4 right-4 h-9 w-9"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground text-lg font-bold">D</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">DeepTrack</h1>
          <p className="text-sm text-muted-foreground">
            {view === 'login' && 'Welcome back! Sign in to continue.'}
            {view === 'signup' && 'Create an account to get started.'}
            {view === 'forgot' && 'Enter your email to reset your password.'}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            {view !== 'forgot' && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}
            {view === 'login' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="keep-signed-in"
                    checked={keepSignedIn}
                    onCheckedChange={(checked) => setKeepSignedIn(checked === true)}
                  />
                  <Label htmlFor="keep-signed-in" className="text-sm font-normal cursor-pointer">
                    Keep me signed in
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => setView('forgot')}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : view === 'login' ? (
                <LogIn className="h-4 w-4" />
              ) : view === 'signup' ? (
                <UserPlus className="h-4 w-4" />
              ) : null}
              {view === 'login' && 'Sign In'}
              {view === 'signup' && 'Sign Up'}
              {view === 'forgot' && 'Send Reset Link'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {view === 'login' && (
            <>Don't have an account?{' '}
              <button onClick={() => setView('signup')} className="text-primary font-medium hover:underline">Sign Up</button>
            </>
          )}
          {view === 'signup' && (
            <>Already have an account?{' '}
              <button onClick={() => setView('login')} className="text-primary font-medium hover:underline">Sign In</button>
            </>
          )}
          {view === 'forgot' && (
            <>Remember your password?{' '}
              <button onClick={() => setView('login')} className="text-primary font-medium hover:underline">Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
