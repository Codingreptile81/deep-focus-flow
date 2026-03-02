import React, { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, CheckSquare, BarChart3, ClipboardList, Sun, Moon, LogOut, Menu, X, PanelTop } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timer', label: 'Timer', icon: Timer },
  { to: '/habits', label: 'Habits', icon: CheckSquare },
  { to: '/planner', label: 'Planner', icon: ClipboardList },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopNavVisible, setDesktopNavVisible] = useState(false);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDesktopNavVisible(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('avatar_url, display_name').eq('user_id', user.id).single().then(({ data }) => {
      if (data) {
        setAvatarUrl((data as any).avatar_url || null);
        setDisplayName((data as any).display_name || null);
      }
    });
  }, [user]);

  const initials = displayName
    ? displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop floating toggle */}
      {!desktopNavVisible && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => setDesktopNavVisible(true)}
          className="hidden md:inline-flex fixed top-4 right-4 z-50 h-9 w-9 rounded-full shadow-lg border-border bg-background/95 backdrop-blur-md"
          title="Show navigation"
        >
          <PanelTop className="h-4 w-4" />
        </Button>
      )}

      {/* Desktop slide-down navbar */}
      {desktopNavVisible && (
        <header className="hidden md:block sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
          <div className="container flex h-12 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-[10px] font-bold">D</span>
              </div>
              <span className="font-semibold text-sm tracking-tight">DeepTrack</span>
            </div>

            <nav className="flex items-center gap-0.5">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </RouterNavLink>
                );
              })}
            </nav>

            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              <RouterNavLink to="/profile" className={({ isActive }) => `h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors ${isActive ? 'ring-2 ring-primary' : 'hover:opacity-80'}`} title="Profile">
                <Avatar className="h-7 w-7">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                  <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              </RouterNavLink>
              <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8" title="Sign out">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDesktopNavVisible(false)} className="h-8 w-8" title="Hide navigation">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile header - always visible */}
      <header className="md:hidden sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container flex h-12 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold">D</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">DeepTrack</span>
          </div>

          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </Button>
            <RouterNavLink to="/profile" className={({ isActive }) => `h-8 w-8 inline-flex items-center justify-center rounded-full transition-colors ${isActive ? 'ring-2 ring-primary' : 'hover:opacity-80'}`} title="Profile">
              <Avatar className="h-7 w-7">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Profile" /> : null}
                <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </RouterNavLink>
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(v => !v)} className="h-8 w-8" title="Menu">
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-border bg-background animate-in slide-in-from-top-2 duration-200">
            <nav className="container py-2 space-y-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <RouterNavLink
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </RouterNavLink>
                );
              })}
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
};

export default AppLayout;
