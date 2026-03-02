/**
 * Returns a text color (hex or CSS variable) that contrasts with the given background.
 * Uses relative luminance: dark backgrounds get white text, light backgrounds get primary text.
 * Design system: --color-text-inverse (white) on dark, --color-text-primary on light.
 */
export function getTextColorForBackground(hex: string): string {
    const normalized = hex.replace(/^#/, '');
    let r: number, g: number, b: number;

    if (normalized.length === 3) {
        r = parseInt(normalized[0] + normalized[0], 16);
        g = parseInt(normalized[1] + normalized[1], 16);
        b = parseInt(normalized[2] + normalized[2], 16);
    } else if (normalized.length === 6) {
        r = parseInt(normalized.slice(0, 2), 16);
        g = parseInt(normalized.slice(2, 4), 16);
        b = parseInt(normalized.slice(4, 6), 16);
    } else {
        return '#FFFFFF';
    }

    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
        return '#FFFFFF';
    }

    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? 'var(--color-text-primary)' : '#FFFFFF';
}
