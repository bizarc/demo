'use client';

import { ReactNode, useEffect, useRef } from 'react';

export interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
}

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
}: ModalProps) {
    const dialogRef = useRef<HTMLDivElement>(null);

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (closeOnEscape && e.key === 'Escape') onClose();
        };

        if (open) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [open, closeOnEscape, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 transition-opacity"
                onClick={closeOnBackdrop ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-describedby={description ? 'modal-description' : undefined}
                className={`
          relative bg-white rounded-lg shadow-xl w-full mx-4
          ${sizes[size]}
        `}
            >
                {/* Header */}
                {(title || description) && (
                    <div className="px-6 pt-6 pb-4">
                        {title && (
                            <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p id="modal-description" className="mt-1 text-sm text-gray-500">
                                {description}
                            </p>
                        )}
                    </div>
                )}

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-500 transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <div className="px-6 py-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
