import { ReactNode } from 'react';
import Link from 'next/link';
import { Badge } from './Badge';

export interface TopNavProps {
    title: string;
    subtitle?: string;
    backHref?: string;
    backLabel?: string;
    onBack?: () => void;
    status?: 'live' | 'draft' | 'archived';
    avatar?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

function BackArrow() {
    return (
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}

export function TopNav({
    title,
    subtitle,
    backHref,
    backLabel = 'Back',
    onBack,
    status,
    avatar,
    actions,
    className = '',
}: TopNavProps) {
    return (
        <header className={`bg-surface border-b border-border-subtle ${className}`}>
            <div className="px-4 py-3">
                {/* Back navigation */}
                {(backHref || onBack) && (
                    <div className="mb-2">
                        {backHref ? (
                            backHref.startsWith('/') && !backHref.startsWith('//') ? (
                                <Link
                                    href={backHref}
                                    className="flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors"
                                >
                                    <BackArrow />
                                    {backLabel}
                                </Link>
                            ) : (
                                <a
                                    href={backHref}
                                    className="flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors"
                                    rel={backHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                                    target={backHref.startsWith('http') ? '_blank' : undefined}
                                >
                                    <BackArrow />
                                    {backLabel}
                                </a>
                            )
                        ) : (
                            <button
                                onClick={onBack}
                                className="flex items-center text-sm text-foreground-secondary hover:text-foreground transition-colors"
                            >
                                <BackArrow />
                                {backLabel}
                            </button>
                        )}
                    </div>
                )}

                {/* Main content */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {avatar}
                        <div>
                            <div className="flex items-center space-x-2">
                                <h1 className="text-lg font-semibold text-foreground">{title}</h1>
                                {status && <Badge variant={status}>{status}</Badge>}
                            </div>
                            {subtitle && (
                                <p className="text-sm text-foreground-secondary">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    {actions && (
                        <div className="flex items-center space-x-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
