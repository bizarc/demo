'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    label?: string;
    description?: string;
    size?: 'sm' | 'md';
}

const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
    ({ className = '', checked = false, onChange, label, description, size = 'md', disabled, id, ...props }, ref) => {
        const toggleId = id || label?.toLowerCase().replace(/\s/g, '-');

        const sizes = {
            sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
            md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
        };

        const s = sizes[size];

        return (
            <div className={`flex items-start ${className}`}>
                <button
                    ref={ref}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-labelledby={label ? `${toggleId}-label` : undefined}
                    onClick={() => !disabled && onChange?.(!checked)}
                    disabled={disabled}
                    className={`
            relative inline-flex flex-shrink-0 ${s.track} rounded-full
            transition-colors duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${checked ? 'bg-primary' : 'bg-border'}
          `}
                    {...props}
                >
                    <span
                        className={`
              pointer-events-none inline-block ${s.thumb} rounded-full bg-surface shadow
              transform transition-transform duration-200 ease-in-out
              ${checked ? s.translate : 'translate-x-0.5'}
            `}
                        style={{ marginTop: size === 'sm' ? '2px' : '2px' }}
                    />
                </button>
                {(label || description) && (
                    <div className="ml-3">
                        {label && (
                            <span id={`${toggleId}-label`} className="text-sm font-medium text-foreground">
                                {label}
                            </span>
                        )}
                        {description && (
                            <p className="text-sm text-foreground-secondary">{description}</p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Toggle.displayName = 'Toggle';
export { Toggle };
