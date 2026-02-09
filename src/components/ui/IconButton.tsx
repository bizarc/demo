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
            default: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
            ghost: 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:ring-gray-500',
            primary: 'bg-foundry-blue text-white hover:bg-blue-700 focus:ring-foundry-blue',
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
