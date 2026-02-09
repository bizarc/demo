import { TextareaHTMLAttributes, forwardRef } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
    helperText?: string;
    resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, helperText, resize = 'vertical', id, rows = 4, ...props }, ref) => {
        const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

        const resizeClasses = {
            none: 'resize-none',
            vertical: 'resize-y',
            horizontal: 'resize-x',
            both: 'resize',
        };

        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={textareaId} className="block text-sm font-medium text-gray-900 mb-1.5">
                        {label}
                    </label>
                )}
                <textarea
                    ref={ref}
                    id={textareaId}
                    rows={rows}
                    className={`
            block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-gray-900
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            ${resizeClasses[resize]}
            ${error
                            ? 'border-error-red focus:border-error-red focus:ring-red-100'
                            : 'border-gray-300 focus:border-foundry-blue focus:ring-blue-100'
                        }
            ${className}
          `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
                    {...props}
                />
                {error && (
                    <p id={`${textareaId}-error`} className="mt-1.5 text-sm text-error-red">
                        {error}
                    </p>
                )}
                {helperText && !error && (
                    <p id={`${textareaId}-helper`} className="mt-1.5 text-sm text-gray-500">
                        {helperText}
                    </p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';
export { Textarea };
