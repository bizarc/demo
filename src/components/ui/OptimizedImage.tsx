'use client';

import Image from 'next/image';

export interface OptimizedImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Uses next/image for external URLs. External logos use unoptimized to avoid
 * remotePatterns whitelist. Data URLs (e.g. QR codes) render as img.
 */
export function OptimizedImage({
    src,
    alt,
    width = 40,
    height = 40,
    className = '',
    style,
}: OptimizedImageProps) {
    if (src.startsWith('data:')) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} width={width} height={height} className={className} style={style} />
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={className}
            style={style}
            unoptimized
        />
    );
}
