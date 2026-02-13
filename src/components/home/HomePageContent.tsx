'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FlaskConical } from 'lucide-react';
import { getCreatorId } from '@/lib/creatorId';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonDemoRow } from '@/components/ui/Skeleton';

interface DemoListItem {
  id: string;
  company_name: string | null;
  mission_profile: string | null;
  status: 'draft' | 'active' | 'expired' | 'blueprint';
  updated_at: string;
  expires_at: string | null;
}

const MISSION_LABELS: Record<string, string> = {
  reactivation: 'Database Reactivation',
  nurture: 'Inbound Nurture',
  service: 'Customer Service',
  review: 'Review Generation',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  active: 'Active',
  expired: 'Expired',
  blueprint: 'Blueprint',
};

const STATUS_BADGE_VARIANT: Record<string, 'draft' | 'live' | 'archived' | 'type'> = {
  draft: 'draft',
  active: 'live',
  expired: 'archived',
  blueprint: 'type',
};

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function RecentDemos() {
  const [demos, setDemos] = useState<DemoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDemos = useCallback(async () => {
    const creatorId = getCreatorId();
    if (!creatorId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetchWithRetry(`/api/demo?created_by=${creatorId}`);
      const data = await res.json();
      if (res.ok) setDemos((data.demos || []).slice(0, 5));
    } catch {
      setDemos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDemos();
  }, [loadDemos]);

  const getMagicLink = (id: string) =>
    typeof window !== 'undefined' ? `${window.location.origin}/demo/${id}` : '';

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <SkeletonDemoRow key={i} />
        ))}
      </div>
    );
  }

  if (demos.length === 0) {
    return (
      <EmptyState
        title="No demos yet"
        description="Create your first one in THE LAB."
        icon={<FlaskConical size={48} strokeWidth={1.5} className="text-foreground-muted" />}
        action={
          <Link href="/lab">
            <Button variant="primary">Create demo</Button>
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {demos.map((demo) => {
        const badgeVariant = STATUS_BADGE_VARIANT[demo.status] ?? 'draft';
        return (
          <li
            key={demo.id}
            className="flex items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:bg-border-subtle"
          >
            <Avatar
              name={demo.company_name || 'Demo'}
              size="sm"
              variant="user"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-medium text-foreground">
                  {demo.company_name || 'Untitled demo'}
                </span>
                <Badge variant={badgeVariant} size="sm">
                  {STATUS_LABELS[demo.status]}
                </Badge>
              </div>
              <div className="flex gap-2 text-xs font-normal text-foreground-muted">
                {demo.mission_profile && (
                  <span>{MISSION_LABELS[demo.mission_profile] ?? demo.mission_profile}</span>
                )}
                <span>Updated {formatRelativeTime(demo.updated_at)}</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              {demo.status === 'draft' && (
                <Link href={`/lab/${demo.id}`}>
                  <Button variant="secondary" size="sm">
                    Resume
                  </Button>
                </Link>
              )}
              {demo.status === 'active' && (
                <>
                  <a href={getMagicLink(demo.id)} target="_blank" rel="noopener noreferrer">
                    <Button variant="primary" size="sm">
                      Open
                    </Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(getMagicLink(demo.id))}
                  >
                    Copy link
                  </Button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
