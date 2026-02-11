import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
    it('renders children text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies primary variant by default', () => {
        render(<Button>Primary</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-primary');
    });

    it('applies the correct variant class', () => {
        render(<Button variant="destructive">Delete</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('bg-error');
    });

    it('applies the correct size class', () => {
        render(<Button size="lg">Large</Button>);
        const btn = screen.getByRole('button');
        expect(btn.className).toContain('h-12');
    });

    it('handles click events', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('disables the button when disabled prop is set', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('disables the button when loading', () => {
        render(<Button loading>Saving</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('shows a spinner SVG when loading', () => {
        render(<Button loading>Saving</Button>);
        const btn = screen.getByRole('button');
        expect(btn.querySelector('svg')).toBeInTheDocument();
    });

    it('does not fire click when disabled', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button disabled onClick={handleClick}>No click</Button>);
        await user.click(screen.getByRole('button'));

        expect(handleClick).not.toHaveBeenCalled();
    });

    it('forwards additional HTML attributes', () => {
        render(<Button data-testid="custom-btn" type="submit">Submit</Button>);
        expect(screen.getByTestId('custom-btn')).toBeInTheDocument();
        expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
    });
});
