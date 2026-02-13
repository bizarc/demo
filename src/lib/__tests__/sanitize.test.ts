import { describe, it, expect } from 'vitest';
import {
    sanitizeScrapedText,
    sanitizeTextField,
    sanitizeScrapedUrl,
    sanitizeStringArray,
} from '../sanitize';

describe('sanitize', () => {
    describe('sanitizeScrapedText', () => {
        it('strips HTML tags', () => {
            const input = '<script>alert(1)</script>Hello <b>world</b>';
            expect(sanitizeScrapedText(input)).toBe('Hello world');
        });
        it('strips script tags', () => {
            const input = 'Safe text <script>evil()</script> after';
            expect(sanitizeScrapedText(input)).not.toContain('script');
        });
    });

    describe('sanitizeTextField', () => {
        it('trims and limits length', () => {
            expect(sanitizeTextField('  hi  ', 5)).toBe('hi');
            expect(sanitizeTextField('x'.repeat(100), 10)).toHaveLength(10);
        });
    });

    describe('sanitizeScrapedUrl', () => {
        it('rejects javascript: URLs', () => {
            expect(sanitizeScrapedUrl('javascript:alert(1)')).toBeNull();
        });
        it('accepts https URLs', () => {
            expect(sanitizeScrapedUrl('https://example.com/logo.png')).toBe('https://example.com/logo.png');
        });
    });

    describe('sanitizeStringArray', () => {
        it('limits and sanitizes array', () => {
            const result = sanitizeStringArray(['a', '<b>b</b>', 'c'], 5, 50);
            expect(result).toHaveLength(3);
            expect(result[1]).toBe('b');
        });
    });
});
