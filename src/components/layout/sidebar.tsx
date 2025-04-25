'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Server,
  Image as ImageIcon,
  Settings,
  HelpCircle,
  Activity,
  FileBarChart,
} from 'lucide-react';

// Navigation items
const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Machines',
    href: '/machines',
    icon: Server,
  },
  {
    title: 'Images',
    href: '/images',
    icon: ImageIcon,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: FileBarChart,
  },
  {
    title: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help',
    href: '/help',
    icon: HelpCircle,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className={cn(
        "fixed inset-y-0 z-50 hidden h-full flex-col border-r bg-background md:flex",
        collapsed ? "w-16" : "w-64"
      )}>
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                {collapsed ? "PD" : "P"}
              </span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold">
                Particle Detect
              </span>
            )}
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid gap-1 px-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href || pathname?.startsWith(`${item.href}/`)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t p-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground"
          >
            {collapsed ? (
              <span>→</span>
            ) : (
              <>
                <span>←</span>
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer (hidden by default) */}
      <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity">
        <div className="fixed inset-y-0 left-0 z-50 w-3/4 max-w-sm border-r bg-background">
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
                <span className="text-xs font-bold text-primary-foreground">PD</span>
              </div>
              <span className="text-sm font-bold">Particle Detect</span>
            </Link>
          </div>
          <nav className="grid gap-1 p-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}