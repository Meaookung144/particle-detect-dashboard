'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Bell,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
} from 'lucide-react';

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
      {/* Mobile menu button (visible on small screens) */}
      <button className="mr-2 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </button>

      {/* Logo (visible on desktop) */}
      <div className="hidden items-center md:flex">
        <span className="text-lg font-bold">Particle Detection</span>
      </div>

      {/* Search input */}
      <div className="ml-auto flex items-center gap-4">
        <div className="hidden md:flex md:gap-4">
          <button
            onClick={toggleTheme}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </button>

          <button className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </button>
        </div>

        {/* User profile */}
        <div className="relative">
          <button
            onClick={toggleUserMenu}
            className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent hover:text-accent-foreground"
          >
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium">{user?.fullName || user?.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          </button>

          {/* User dropdown menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">
              <div className="p-2">
                <Link
                  href="/profile"
                  className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex w-full items-center rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    signOut();
                  }}
                  className="flex w-full items-center rounded-md px-2 py-2 text-sm text-red-500 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900 dark:hover:text-red-300"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}