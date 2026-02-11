import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Toggle } from '../Toggle';

const meta = {
    title: 'Design System/Form Controls/Toggle',
    component: Toggle,
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['sm', 'md'] },
        checked: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { label: 'Dark mode' },
};

export const WithDescription: Story = {
    args: { label: 'Notifications', description: 'Receive push notifications' },
};

export const Checked: Story = {
    args: { label: 'Enabled', checked: true },
};

export const Small: Story = {
    args: { label: 'Small toggle', size: 'sm' },
};

export const Disabled: Story = {
    args: { label: 'Disabled', disabled: true },
};

export const Controlled: Story = {
    render: function ControlledToggle() {
        const [checked, setChecked] = useState(false);
        return (
            <Toggle
                label="Auto-save"
                description={checked ? 'Drafts are saved automatically' : 'Manual saving only'}
                checked={checked}
                onChange={setChecked}
            />
        );
    },
};
