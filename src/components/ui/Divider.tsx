import { HTMLAttributes, forwardRef } from 'react';

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
    orientation?: 'horizontal' | 'vertical';
    label?: string;
}

const Divider = forwardRef<HTMLHRElement, DividerProps>(
    ({ className = '', orientation = 'horizontal', label, ...props }, ref) => {
        if (label) {
            return (
                <div className={`flex items-center ${className}`}>
                    <hr ref={ref} className="flex-1 border-t border-border" {...props} />
                    <span className="px-3 text-sm text-foreground-secondary">{label}</span>
                    <hr className="flex-1 border-t border-border" />
                </div>
            );
        }

        if (orientation === 'vertical') {
            return (
                <div
                    ref={ref as React.Ref<HTMLDivElement>}
                    className={`w-px bg-border self-stretch ${className}`}
                    role="separator"
                    aria-orientation="vertical"
                    {...(props as HTMLAttributes<HTMLDivElement>)}
                />
            );
        }

        return (
            <hr
                ref={ref}
                className={`border-t border-border ${className}`}
                role="separator"
                aria-orientation="horizontal"
                {...props}
            />
        );
    }
);

Divider.displayName = 'Divider';
export { Divider };
