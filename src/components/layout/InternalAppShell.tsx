'use client';

import { ReactNode, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Radar,
  Satellite,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Sidebar, SidebarItem } from '@/components/ui/Sidebar';
import { TopNav } from '@/components/ui/TopNav';
import { IconButton } from '@/components/ui/IconButton';
import { trackUxEvent } from '@/lib/uxMetrics';

interface InternalAppShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const MODULES: SidebarItem[] = [
  { id: 'recon', label: 'Recon', icon: <Satellite size={18} />, href: '/recon', badge: 'Soon', disabled: true },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={18} />, href: '/lab' },
  { id: 'radar', label: 'Radar', icon: <Radar size={18} />, href: '/radar', badge: 'Soon', disabled: true },
  { id: 'blueprint', label: 'Blueprint', icon: <BookOpen size={18} />, href: '/blueprint', badge: 'Soon', disabled: true },
  { id: 'mission-control', label: 'Mission Control', icon: <ShieldCheck size={18} />, href: '/mission-control', badge: 'Soon', disabled: true },
  { id: 'portals', label: 'Portals', icon: <LayoutDashboard size={18} />, href: '/portals', badge: 'Soon', disabled: true },
];

function getActiveModule(pathname: string): string {
  if (pathname.startsWith('/lab')) return 'lab';
  if (pathname.startsWith('/recon')) return 'recon';
  if (pathname.startsWith('/radar')) return 'radar';
  if (pathname.startsWith('/blueprint')) return 'blueprint';
  if (pathname.startsWith('/mission-control')) return 'mission-control';
  if (pathname.startsWith('/portals')) return 'portals';
  return 'lab';
}

export function InternalAppShell({ children, title, subtitle, actions }: InternalAppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeId = useMemo(() => getActiveModule(pathname), [pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="hidden md:flex min-h-screen">
        <Sidebar
          items={MODULES}
          activeId={activeId}
          collapsed={collapsed}
          onCollapsedChange={setCollapsed}
          onItemSelect={(item) => {
            trackUxEvent('nav_item_selected', { module: item.id, route: item.href ?? null });
          }}
          header={
            <div>
              <p className="text-xs text-foreground-secondary">Funnel Finished</p>
              <h2 className="text-sm font-medium text-foreground">Command Deck</h2>
            </div>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopNav
            title={title}
            subtitle={subtitle}
            actions={actions}
            className="border-border-subtle"
          />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <div className="md:hidden">
        <TopNav
          title={title}
          subtitle={subtitle}
          actions={
            <div className="flex items-center gap-2">
              {actions}
              <IconButton
                icon={mobileOpen ? <X size={18} /> : <Menu size={18} />}
                onClick={() => setMobileOpen((prev) => !prev)}
                label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              />
            </div>
          }
        />
        {mobileOpen && (
          <div className="border-b border-border bg-surface">
            <Sidebar
              items={MODULES}
              activeId={activeId}
              className="w-full border-r-0"
              showCollapseToggle={false}
              onItemSelect={(item) => {
                setMobileOpen(false);
                trackUxEvent('nav_item_selected_mobile', { module: item.id, route: item.href ?? null });
              }}
            />
          </div>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}
