import { HTMLAttributes, forwardRef } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    lines?: number;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
    ({ className = '', variant = 'text', width, height, lines = 1, style, ...props }, ref) => {
        const baseStyles = 'animate-pulse bg-gray-200';

        const variants = {
            text: 'rounded h-4',
            circular: 'rounded-full',
            rectangular: 'rounded-md',
        };

        const computedStyle = {
            width: width ?? (variant === 'circular' ? '40px' : '100%'),
            height: height ?? (variant === 'circular' ? '40px' : variant === 'rectangular' ? '100px' : undefined),
            ...style,
        };

        if (variant === 'text' && lines > 1) {
            return (
                <div ref={ref} className={`space-y-2 ${className}`} {...props}>
                    {Array.from({ length: lines }).map((_, i) => (
                        <div
                            key={i}
                            className={`${baseStyles} ${variants.text}`}
                            style={{
                                width: i === lines - 1 ? '60%' : '100%', // Last line is shorter
                                ...style,
                            }}
                        />
                    ))}
                </div>
            );
        }

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${className}`}
                style={computedStyle}
                {...props}
            />
        );
    }
);

Skeleton.displayName = 'Skeleton';
export { Skeleton };

// Pre-built skeleton patterns
export function SkeletonCard({ className = '' }: { className?: string }) {
    return (
        <div className={`p-4 border border-gray-200 rounded-lg ${className}`}>
            <Skeleton variant="rectangular" height={120} className="mb-4" />
            <Skeleton width="60%" className="mb-2" />
            <Skeleton lines={2} />
        </div>
    );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 32, md: 40, lg: 48 };
    return <Skeleton variant="circular" width={sizes[size]} height={sizes[size]} />;
}

/** Skeleton for demo list row (LAB home) */
export function SkeletonDemoRow() {
    return (
        <div className="p-4 border border-gray-200 rounded-lg flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton width="40%" height={16} />
                <Skeleton width="60%" height={12} />
            </div>
            <div className="flex gap-2">
                <Skeleton width={60} height={32} className="rounded-md" />
                <Skeleton width={80} height={32} className="rounded-md" />
            </div>
        </div>
    );
}

/** Skeleton for chat header + messages (demo page) */
export function SkeletonChatPage() {
    return (
        <div className="flex flex-col h-screen bg-[var(--color-canvas)]">
            <div className="flex-shrink-0 p-4 border-b border-[var(--color-border)] flex items-center gap-3">
                <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
                <div className="flex-1 space-y-2">
                    <Skeleton width={120} height={16} />
                    <Skeleton width={60} height={12} />
                </div>
            </div>
            <div className="flex-1 p-5 space-y-4 overflow-hidden">
                <Skeleton width="70%" height={48} className="rounded-xl" />
                <Skeleton width="85%" height={64} className="rounded-xl ml-auto" />
                <Skeleton width="60%" height={56} className="rounded-xl" />
                <Skeleton width="75%" height={72} className="rounded-xl ml-auto" />
            </div>
        </div>
    );
}

/** Skeleton for success page card */
export function SkeletonSuccessCard() {
    return (
        <div className="max-w-[600px] w-full mx-auto p-10 rounded-2xl bg-white border border-gray-200 text-center">
            <Skeleton variant="circular" width={64} height={64} className="mx-auto mb-6" />
            <Skeleton width={180} height={28} className="mx-auto mb-2" />
            <Skeleton width="90%" height={20} className="mx-auto mb-8" />
            <Skeleton width="100%" height={48} className="rounded-xl mb-8" />
            <div className="flex justify-center gap-10">
                <div>
                    <Skeleton width={160} height={160} className="rounded-xl mb-3" />
                    <Skeleton width={120} height={14} className="mx-auto" />
                </div>
                <div className="space-y-3 pt-4">
                    <Skeleton width={140} height={44} className="rounded-lg" />
                    <Skeleton width={140} height={44} className="rounded-lg" />
                    <Skeleton width={100} height={36} className="rounded-lg" />
                </div>
            </div>
        </div>
    );
}
