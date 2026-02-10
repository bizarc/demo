import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'live' | 'draft' | 'archived' | 'type' | 'default';
    size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center font-medium rounded-full';

        const variants = {
            live: 'bg-success-bg text-success-text',
            draft: 'bg-border-subtle text-foreground-secondary',
            archived: 'bg-error-bg text-error-text',
            type: 'bg-primary-subtle text-primary-subtle-text',
            default: 'bg-border-subtle text-foreground-secondary',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-xs',
        };

        return (
            <span
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                {...props}
            >
                {variant === 'live' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
export { Badge };
