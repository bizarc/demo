import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Textarea } from '../Textarea';

const meta = {
    title: 'Design System/Form Controls/Textarea',
    component: Textarea,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        error: { control: 'text' },
        helperText: { control: 'text' },
        resize: { control: 'select', options: ['none', 'vertical', 'horizontal', 'both'] },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { placeholder: 'Enter your message...' },
};

export const WithLabel: Story = {
    args: { label: 'System prompt', placeholder: 'You are a helpful assistant...' },
};

export const WithHelperText: Story = {
    args: { label: 'Description', helperText: 'Max 500 characters', placeholder: 'Describe your use case...' },
};

export const WithError: Story = {
    args: { label: 'Required field', error: 'This field is required' },
};

export const NoResize: Story = {
    args: { label: 'Fixed size', resize: 'none', placeholder: 'Cannot resize' },
};

export const Disabled: Story = {
    args: { label: 'Disabled', placeholder: 'Read-only content', disabled: true },
};
