'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Badge } from './Badge';

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
    onItemSelect?: (item: SidebarItem) => void;
    showCollapseToggle?: boolean;
    header?: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function Sidebar({
    items,
    activeId,
    collapsed: controlledCollapsed,
    onCollapsedChange,
    onItemSelect,
    showCollapseToggle = true,
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
        flex flex-col bg-surface border-r border-border-subtle h-full transition-all duration-200
        ${collapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
        >
            {/* Top chrome aligns with TopNav height */}
            {(header || showCollapseToggle) && (
                <div className="flex h-16 items-center border-b border-border-subtle px-3">
                    {!collapsed && header && (
                        <div className="min-w-0 flex-1">
                            {header}
                        </div>
                    )}
                    {showCollapseToggle && (
                        <button
                            onClick={toggleCollapsed}
                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground-secondary transition-colors hover:bg-border-subtle hover:text-foreground ${collapsed ? 'mx-auto' : 'ml-auto'}`}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            type="button"
                        >
                            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    )}
                </div>
            )}

            {/* Navigation items */}
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {items.map((item) => {
                    const isActive = item.id === activeId;
                    const sharedClasses = `
                w-full flex items-center rounded-md transition-colors
                ${collapsed ? 'justify-center p-3' : 'px-3 py-2'}
                ${item.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                ${isActive
                            ? 'bg-primary-highlight text-primary'
                            : 'text-foreground hover:bg-border-subtle'
                        }
              `;
                    const sharedProps = {
                        title: collapsed ? item.label : undefined,
                        'aria-current': isActive ? ('page' as const) : undefined,
                        'aria-disabled': item.disabled ? true : undefined,
                    };

                    const itemContent = (
                        <>
                            <span className="flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                                <>
                                    <span className="ml-3 text-sm font-medium">{item.label}</span>
                                    {item.badge && (
                                        <Badge
                                            variant="draft"
                                            size="sm"
                                            className="ml-auto"
                                            aria-label={`${item.label} status: ${item.badge}`}
                                        >
                                            {item.badge}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </>
                    );

                    if (item.href && !item.disabled) {
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className={sharedClasses}
                                onClick={() => onItemSelect?.(item)}
                                {...sharedProps}
                            >
                                {itemContent}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                if (item.disabled) return;
                                item.onClick?.();
                                onItemSelect?.(item);
                            }}
                            disabled={item.disabled}
                            className={sharedClasses}
                            {...sharedProps}
                        >
                            {itemContent}
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            {footer && !collapsed && (
                <div className="p-4 border-t border-border-subtle">
                    {footer}
                </div>
            )}
        </aside>
    );
}
