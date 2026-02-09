'use client';

import { forwardRef, useState, useRef, useEffect, KeyboardEvent } from 'react';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectProps {
    options: SelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    disabled?: boolean;
    searchable?: boolean;
    className?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
    ({ options, value, onChange, placeholder = 'Select...', label, error, disabled, searchable, className = '' }, ref) => {
        const [isOpen, setIsOpen] = useState(false);
        const [search, setSearch] = useState('');
        const containerRef = useRef<HTMLDivElement>(null);

        const selectedOption = options.find(opt => opt.value === value);

        const filteredOptions = searchable && search
            ? options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
            : options;

        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'Enter' && !isOpen) setIsOpen(true);
        };

        return (
            <div ref={ref} className={`w-full ${className}`}>
                {label && (
                    <label className="block text-sm font-medium text-gray-900 mb-1.5">{label}</label>
                )}
                <div ref={containerRef} className="relative">
                    <button
                        type="button"
                        onClick={() => !disabled && setIsOpen(!isOpen)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        className={`
              w-full flex items-center justify-between px-3 py-2.5 text-sm text-left
              bg-white border rounded-md transition-colors
              disabled:bg-gray-50 disabled:cursor-not-allowed
              ${error ? 'border-error-red' : isOpen ? 'border-foundry-blue ring-2 ring-blue-100' : 'border-gray-300'}
            `}
                    >
                        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
                            {selectedOption?.label || placeholder}
                        </span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {isOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                            {searchable && (
                                <div className="p-2 border-b border-gray-100">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:border-foundry-blue"
                                        autoFocus
                                    />
                                </div>
                            )}
                            {filteredOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        if (!option.disabled) {
                                            onChange?.(option.value);
                                            setIsOpen(false);
                                            setSearch('');
                                        }
                                    }}
                                    disabled={option.disabled}
                                    className={`
                    w-full px-3 py-2 text-sm text-left transition-colors
                    ${option.value === value ? 'bg-blue-50 text-foundry-blue' : 'text-gray-900 hover:bg-gray-50'}
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                                >
                                    {option.label}
                                </button>
                            ))}
                            {filteredOptions.length === 0 && (
                                <p className="px-3 py-2 text-sm text-gray-500">No options found</p>
                            )}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1.5 text-sm text-error-red">{error}</p>}
            </div>
        );
    }
);

Select.displayName = 'Select';
export { Select };
export type { SelectOption as SelectOptionType };
