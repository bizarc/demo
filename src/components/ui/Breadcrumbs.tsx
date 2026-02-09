import { ReactNode } from 'react';

export interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: ReactNode;
}

export interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    separator?: ReactNode;
    className?: string;
}

export function Breadcrumbs({ items, separator, className = '' }: BreadcrumbsProps) {
    const defaultSeparator = (
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center space-x-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center">
                            {index > 0 && (
                                <span className="mx-2 flex-shrink-0">
                                    {separator || defaultSeparator}
                                </span>
                            )}
                            {item.href && !isLast ? (
                                <a
                                    href={item.href}
                                    className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {item.icon && <span className="mr-1.5">{item.icon}</span>}
                                    {item.label}
                                </a>
                            ) : (
                                <span
                                    className={`flex items-center text-sm ${isLast ? 'text-gray-900 font-medium' : 'text-gray-500'
                                        }`}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {item.icon && <span className="mr-1.5">{item.icon}</span>}
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
