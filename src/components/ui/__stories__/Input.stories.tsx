import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '../Input';
import { Search, Mail } from 'lucide-react';

const meta = {
    title: 'Design System/Core/Input',
    component: Input,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        error: { control: 'text' },
        helperText: { control: 'text' },
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { placeholder: 'Enter text...' },
};

export const WithLabel: Story = {
    args: { label: 'Email address', placeholder: 'you@example.com' },
};

export const WithHelperText: Story = {
    args: { label: 'Username', placeholder: 'johndoe', helperText: 'This will be visible to other users' },
};

export const WithError: Story = {
    args: { label: 'Email', placeholder: 'you@example.com', error: 'Please enter a valid email address', defaultValue: 'invalid' },
};

export const WithLeftIcon: Story = {
    args: { placeholder: 'Search...', leftIcon: <Search size={16} /> },
};

export const WithRightIcon: Story = {
    args: { label: 'Email', placeholder: 'you@example.com', rightIcon: <Mail size={16} /> },
};

export const Disabled: Story = {
    args: { label: 'Disabled field', placeholder: 'Cannot edit', disabled: true },
};
