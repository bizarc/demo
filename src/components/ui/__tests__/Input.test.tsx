import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
    it('renders with placeholder', () => {
        render(<Input placeholder="Enter text..." />);
        expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
    });

    it('renders a label when provided', () => {
        render(<Input label="Email" />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('shows error message', () => {
        render(<Input label="Email" error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('sets aria-invalid when error is present', () => {
        render(<Input label="Email" error="Required" />);
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows helper text when no error', () => {
        render(<Input label="Name" helperText="Enter your full name" />);
        expect(screen.getByText('Enter your full name')).toBeInTheDocument();
    });

    it('hides helper text when error is present', () => {
        render(<Input label="Name" helperText="Enter your full name" error="Required" />);
        expect(screen.queryByText('Enter your full name')).not.toBeInTheDocument();
        expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('handles user input', async () => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(<Input placeholder="Type here" onChange={handleChange} />);
        await user.type(screen.getByPlaceholderText('Type here'), 'hello');

        expect(handleChange).toHaveBeenCalled();
    });

    it('renders disabled state', () => {
        render(<Input label="Disabled" disabled />);
        expect(screen.getByLabelText('Disabled')).toBeDisabled();
    });

    it('renders left icon', () => {
        render(<Input leftIcon={<span data-testid="left-icon">L</span>} />);
        expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });
});
