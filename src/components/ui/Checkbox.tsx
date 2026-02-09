import { InputHTMLAttributes, forwardRef } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    description?: string;
    indeterminate?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = '', label, description, indeterminate, id, ...props }, ref) => {
        const checkboxId = id || label?.toLowerCase().replace(/\s/g, '-');

        return (
            <div className={`flex items-start ${className}`}>
                <div className="flex items-center h-5">
                    <input
                        ref={(el) => {
                            if (el) el.indeterminate = indeterminate || false;
                            if (typeof ref === 'function') ref(el);
                            else if (ref) ref.current = el;
                        }}
                        type="checkbox"
                        id={checkboxId}
                        className="
              w-4 h-4 rounded border-gray-300 text-foundry-blue
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
                            <label htmlFor={checkboxId} className="text-sm font-medium text-gray-900 cursor-pointer">
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

Checkbox.displayName = 'Checkbox';
export { Checkbox };
