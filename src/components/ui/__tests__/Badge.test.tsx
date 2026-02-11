import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
    it('renders text content', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('applies live variant styles', () => {
        render(<Badge variant="live">Live</Badge>);
        const badge = screen.getByText('Live');
        expect(badge.className).toContain('bg-success-bg');
    });

    it('applies draft variant styles', () => {
        render(<Badge variant="draft">Draft</Badge>);
        const badge = screen.getByText('Draft');
        expect(badge.className).toContain('bg-border-subtle');
    });

    it('applies archived variant styles', () => {
        render(<Badge variant="archived">Archived</Badge>);
        const badge = screen.getByText('Archived');
        expect(badge.className).toContain('bg-error-bg');
    });

    it('applies type variant styles', () => {
        render(<Badge variant="type">Reactivation</Badge>);
        const badge = screen.getByText('Reactivation');
        expect(badge.className).toContain('bg-primary-subtle');
    });

    it('shows status dot for live variant', () => {
        render(<Badge variant="live">Live</Badge>);
        const badge = screen.getByText('Live');
        const dot = badge.querySelector('.bg-success');
        expect(dot).toBeInTheDocument();
    });

    it('applies small size', () => {
        render(<Badge size="sm">Small</Badge>);
        const badge = screen.getByText('Small');
        expect(badge.className).toContain('px-2');
    });
});
