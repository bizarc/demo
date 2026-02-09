import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'live' | 'draft' | 'archived' | 'type' | 'default';
    size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center font-medium rounded-full';

        const variants = {
            live: 'bg-green-100 text-green-800',
            draft: 'bg-gray-100 text-gray-600',
            archived: 'bg-red-100 text-red-800',
            type: 'bg-blue-100 text-blue-800',
            default: 'bg-gray-100 text-gray-700',
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
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                )}
                {children}
            </span>
        );
    }
);

Badge.displayName = 'Badge';
export { Badge };
