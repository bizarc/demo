'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { InternalAppShell } from '@/components/layout/InternalAppShell';
import { Button } from '@/components/ui/Button';
import { SignOutButton } from '@/components/auth/SignOutButton';

function getLabHeader(pathname: string): { title: string; subtitle: string } {
  if (pathname === '/lab') {
    return {
      title: 'Lab',
      subtitle: 'Create and manage AI demo agents',
    };
  }

  if (pathname === '/lab/success') {
    return {
      title: 'Deployment success',
      subtitle: 'Your demo is ready to share',
    };
  }

  return {
    title: 'Demo builder',
    subtitle: 'Configure your AI agent',
  };
}

export default function LabLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const header = getLabHeader(pathname);
  const showNewDemoAction = pathname === '/lab';

  return (
    <InternalAppShell
      title={header.title}
      subtitle={header.subtitle}
      actions={
        <div className="flex items-center gap-2">
          <SignOutButton />
          {showNewDemoAction && (
            <Link href="/lab/new">
              <Button variant="primary" size="md" className="gap-2">
                <Plus size={16} />
                New demo
              </Button>
            </Link>
          )}
        </div>
      }
    >
      {children}
    </InternalAppShell>
  );
}
