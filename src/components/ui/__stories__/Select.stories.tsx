import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect } from 'storybook/test';
import { useState } from 'react';
import { Select } from '../Select';

const sampleOptions = [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'solid', label: 'SolidJS', disabled: true },
];

const meta = {
    title: 'Design System/Form Controls/Select',
    component: Select,
    tags: ['autodocs'],
    args: {
        options: sampleOptions,
        placeholder: 'Choose a framework...',
    },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: { label: 'Framework', placeholder: 'Select a framework' },
};

export const WithError: Story = {
    args: { label: 'Framework', error: 'This field is required' },
};

export const Searchable: Story = {
    args: { label: 'Framework', searchable: true, placeholder: 'Search and select...' },
};

export const Disabled: Story = {
    args: { label: 'Framework', disabled: true },
};

export const Controlled: Story = {
    render: function ControlledSelect() {
        const [value, setValue] = useState('react');
        return (
            <div style={{ maxWidth: 300 }}>
                <Select
                    label="Framework"
                    options={sampleOptions}
                    value={value}
                    onChange={setValue}
                />
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    Selected: {value}
                </p>
            </div>
        );
    },
    play: async ({ canvas, userEvent }) => {
        // Initially shows React selected
        await expect(canvas.getByText('React')).toBeInTheDocument();
        await expect(canvas.getByText('Selected: react')).toBeInTheDocument();

        // Open dropdown
        await userEvent.click(canvas.getByText('React'));

        // Select Vue
        await userEvent.click(canvas.getByText('Vue'));

        // Verify selection changed
        await expect(canvas.getByText('Selected: vue')).toBeInTheDocument();
    },
};
