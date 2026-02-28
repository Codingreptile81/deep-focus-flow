import React from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Timer, CheckSquare, BarChart3 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timer', label: 'Timer', icon: Timer },
  { to: '/habits', label: 'Habits', icon: CheckSquare },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">D</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">DeepTrack</span>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <RouterNavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </RouterNavLink>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
};

export default AppLayout;
