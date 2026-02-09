'use client';

import { createContext, useContext, ReactNode } from 'react';

interface TabsContextValue {
    value: string;
    onChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps {
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
    className?: string;
}

export function Tabs({ value, onChange, children, className = '' }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onChange }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export interface TabListProps {
    children: ReactNode;
    className?: string;
}

export function TabList({ children, className = '' }: TabListProps) {
    return (
        <div role="tablist" className={`flex border-b border-gray-200 ${className}`}>
            {children}
        </div>
    );
}

export interface TabProps {
    value: string;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}

export function Tab({ value, children, disabled, className = '' }: TabProps) {
    const context = useContext(TabsContext);
    const isActive = context?.value === value;

    return (
        <button
            role="tab"
            aria-selected={isActive}
            aria-disabled={disabled}
            onClick={() => !disabled && context?.onChange(value)}
            disabled={disabled}
            className={`
        px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
        focus:outline-none focus:ring-2 focus:ring-inset focus:ring-foundry-blue
        disabled:opacity-50 disabled:cursor-not-allowed
        ${isActive
                    ? 'border-foundry-blue text-foundry-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
        ${className}
      `}
        >
            {children}
        </button>
    );
}

export interface TabPanelProps {
    value: string;
    children: ReactNode;
    className?: string;
}

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
    const context = useContext(TabsContext);
    if (context?.value !== value) return null;

    return (
        <div role="tabpanel" className={`py-4 ${className}`}>
            {children}
        </div>
    );
}
