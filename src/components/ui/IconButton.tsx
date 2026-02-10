import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: ReactNode;
    variant?: 'default' | 'ghost' | 'primary';
    size?: 'sm' | 'md' | 'lg';
    label: string; // Required for accessibility
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className = '', icon, variant = 'default', size = 'md', label, disabled, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            default: 'bg-surface text-foreground border border-border hover:bg-border-subtle focus:ring-foreground-muted',
            ghost: 'bg-transparent text-foreground-secondary hover:bg-border-subtle hover:text-foreground focus:ring-foreground-muted',
            primary: 'bg-primary text-white hover:opacity-90 focus:ring-primary',
        };

        const sizes = {
            sm: 'w-8 h-8',
            md: 'w-10 h-10',
            lg: 'w-12 h-12',
        };

        const iconSizes = {
            sm: '[&>svg]:w-4 [&>svg]:h-4',
            md: '[&>svg]:w-5 [&>svg]:h-5',
            lg: '[&>svg]:w-6 [&>svg]:h-6',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${iconSizes[size]} ${className}`}
                disabled={disabled}
                aria-label={label}
                title={label}
                {...props}
            >
                {icon}
            </button>
        );
    }
);

IconButton.displayName = 'IconButton';
export { IconButton };
