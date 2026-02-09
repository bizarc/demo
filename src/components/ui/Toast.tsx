'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).slice(2);
        const duration = toast.duration ?? 5000;

        setToasts(prev => [...prev, { ...toast, id }]);

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

function ToastContainer() {
    const { toasts, removeToast } = useToast();

    const variants = {
        default: 'bg-white border-gray-200',
        success: 'bg-white border-l-4 border-l-success-green border-gray-200',
        error: 'bg-white border-l-4 border-l-error-red border-gray-200',
        warning: 'bg-white border-l-4 border-l-warning-amber border-gray-200',
    };

    const icons = {
        success: (
            <svg className="w-5 h-5 text-success-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        ),
        error: (
            <svg className="w-5 h-5 text-error-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        ),
        warning: (
            <svg className="w-5 h-5 text-warning-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
        default: null,
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`
            flex items-start p-4 rounded-lg shadow-lg border min-w-[300px] max-w-md
            animate-in slide-in-from-right-5
            ${variants[toast.variant || 'default']}
          `}
                    role="alert"
                >
                    {icons[toast.variant || 'default'] && (
                        <span className="flex-shrink-0 mr-3">{icons[toast.variant || 'default']}</span>
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                        {toast.description && (
                            <p className="mt-1 text-sm text-gray-500">{toast.description}</p>
                        )}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

// Standalone toast component for direct use
export interface ToastItemProps {
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    onClose?: () => void;
}

export function ToastItem({ title, description, variant = 'default', onClose }: ToastItemProps) {
    const variants = {
        default: 'bg-white border-gray-200',
        success: 'bg-white border-l-4 border-l-success-green border-gray-200',
        error: 'bg-white border-l-4 border-l-error-red border-gray-200',
        warning: 'bg-white border-l-4 border-l-warning-amber border-gray-200',
    };

    return (
        <div className={`flex items-start p-4 rounded-lg shadow-lg border ${variants[variant]}`} role="alert">
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{title}</p>
                {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
            </div>
            {onClose && (
                <button onClick={onClose} className="ml-3 text-gray-400 hover:text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}
