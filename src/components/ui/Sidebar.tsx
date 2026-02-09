'use client';

import { ReactNode, useState } from 'react';

export interface SidebarItem {
    id: string;
    label: string;
    icon: ReactNode;
    href?: string;
    onClick?: () => void;
    badge?: string | number;
    disabled?: boolean;
}

export interface SidebarProps {
    items: SidebarItem[];
    activeId?: string;
    collapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function Sidebar({
    items,
    activeId,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    header,
    footer,
    className = '',
}: SidebarProps) {
    const [internalCollapsed, setInternalCollapsed] = useState(false);
    const collapsed = controlledCollapsed ?? internalCollapsed;

    const toggleCollapsed = () => {
        const newValue = !collapsed;
        setInternalCollapsed(newValue);
        onCollapsedChange?.(newValue);
    };

    return (
        <aside
            className={`
        flex flex-col bg-white border-r border-gray-200 h-full transition-all duration-200
        ${collapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
        >
            {/* Header */}
            {header && !collapsed && (
                <div className="p-4 border-b border-gray-100">
                    {header}
                </div>
            )}

            {/* Collapse toggle */}
            <button
                onClick={toggleCollapsed}
                className="flex items-center justify-center p-2 mx-2 mt-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
                <svg
                    className={`w-5 h-5 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>

            {/* Navigation items */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = item.id === activeId;
                    const Component = item.href ? 'a' : 'button';

                    return (
                        <Component
                            key={item.id}
                            href={item.href}
                            onClick={item.onClick}
                            disabled={item.disabled}
                            className={`
                w-full flex items-center rounded-md transition-colors
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive
                                    ? 'bg-blue-50 text-foundry-blue'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }
              `}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                                <>
                                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                        </Component>
                    );
                })}
            </nav>

            {/* Footer */}
            {footer && !collapsed && (
                <div className="p-4 border-t border-gray-100">
                    {footer}
                </div>
            )}
        </aside>
    );
}
