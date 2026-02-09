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
                    <hr ref={ref} className="flex-1 border-t border-gray-200" {...props} />
                    <span className="px-3 text-sm text-gray-500">{label}</span>
                    <hr className="flex-1 border-t border-gray-200" />
                </div>
            );
        }

        if (orientation === 'vertical') {
            return (
                <div
                    ref={ref as React.Ref<HTMLDivElement>}
                    className={`w-px bg-gray-200 self-stretch ${className}`}
                    role="separator"
                    aria-orientation="vertical"
                    {...(props as HTMLAttributes<HTMLDivElement>)}
                />
            );
        }

        return (
            <hr
                ref={ref}
                className={`border-t border-gray-200 ${className}`}
                role="separator"
                aria-orientation="horizontal"
                {...props}
            />
        );
    }
);

Divider.displayName = 'Divider';
export { Divider };
