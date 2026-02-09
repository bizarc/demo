'use client';

import { createContext, useContext, forwardRef, InputHTMLAttributes } from 'react';

interface RadioGroupContextValue {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
    name: string;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    className?: string;
    children: React.ReactNode;
}

export function RadioGroup({ name, value, onChange, disabled, className = '', children }: RadioGroupProps) {
    return (
        <RadioGroupContext.Provider value={{ name, value, onChange, disabled }}>
            <div role="radiogroup" className={`space-y-2 ${className}`}>
                {children}
            </div>
        </RadioGroupContext.Provider>
    );
}

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'name'> {
    label?: string;
    description?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
    ({ className = '', label, description, value, id, disabled: itemDisabled, ...props }, ref) => {
        const context = useContext(RadioGroupContext);
        const radioId = id || `radio-${value}`;
        const isDisabled = itemDisabled || context?.disabled;
        const isChecked = context?.value === value;

        return (
            <div className={`flex items-start ${className}`}>
                <div className="flex items-center h-5">
                    <input
                        ref={ref}
                        type="radio"
                        id={radioId}
                        name={context?.name}
                        value={value}
                        checked={isChecked}
                        onChange={(e) => context?.onChange?.(e.target.value)}
                        disabled={isDisabled}
                        className="
              w-4 h-4 border-gray-300 text-foundry-blue
              focus:ring-2 focus:ring-foundry-blue focus:ring-offset-0
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer
            "
                        {...props}
                    />
                </div>
                {(label || description) && (
                    <div className="ml-3">
                        {label && (
                            <label htmlFor={radioId} className="text-sm font-medium text-gray-900 cursor-pointer">
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-sm text-gray-500">{description}</p>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

Radio.displayName = 'Radio';
export { Radio };
