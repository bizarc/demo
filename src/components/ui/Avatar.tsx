import { HTMLAttributes, forwardRef } from 'react';
import Image from 'next/image';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
    name?: string;
    src?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'user' | 'agent';
    status?: 'online' | 'offline' | 'busy';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
    ({ className = '', name, src, size = 'md', variant = 'user', status, ...props }, ref) => {
        const sizes = {
            sm: 'w-8 h-8 text-xs',
            md: 'w-10 h-10 text-sm',
            lg: 'w-12 h-12 text-base',
        };

        const statusColors = {
            online: 'bg-success',
            offline: 'bg-foreground-muted',
            busy: 'bg-warning',
        };

        const statusSizes = {
            sm: 'w-2 h-2',
            md: 'w-2.5 h-2.5',
            lg: 'w-3 h-3',
        };

        // Get initials from name
        const initials = name
            ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
            : '?';

        return (
            <div ref={ref} className={`relative inline-flex ${className}`} {...props}>
                <div
                    className={`
            ${sizes[size]} 
            rounded-full flex items-center justify-center font-medium overflow-hidden
            ${src ? 'relative' : ''}
            ${!src && variant === 'agent'
                            ? 'bg-primary text-white'
                            : !src
                                ? 'bg-border text-foreground-secondary'
                                : ''
                        }
          `}
                >
                    {src ? (
                        <Image src={src} alt={name || 'Avatar'} fill className="object-cover" unoptimized sizes="32px" />
                    ) : variant === 'agent' ? (
                        <svg className="w-1/2 h-1/2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                        </svg>
                    ) : (
                        initials
                    )}
                </div>
                {status && (
                    <span
                        className={`
              absolute bottom-0 right-0 block rounded-full ring-2 ring-surface
              ${statusColors[status]} ${statusSizes[size]}
            `}
                    />
                )}
            </div>
        );
    }
);

Avatar.displayName = 'Avatar';
export { Avatar };
