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
