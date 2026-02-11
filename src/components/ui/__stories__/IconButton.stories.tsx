import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IconButton } from '../IconButton';
import { Settings, Trash2, Copy, ExternalLink, Plus } from 'lucide-react';

const meta = {
    title: 'Design System/Data Display/IconButton',
    component: IconButton,
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['default', 'ghost', 'primary'] },
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { icon: <Settings size={16} />, label: 'Settings' },
};

export const Ghost: Story = {
    args: { icon: <Copy size={16} />, label: 'Copy', variant: 'ghost' },
};

export const Primary: Story = {
    args: { icon: <Plus size={16} />, label: 'Add', variant: 'primary' },
};

export const AllSizes: Story = {
    args: { icon: <Settings size={16} />, label: 'Settings' },
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <IconButton icon={<Settings size={14} />} label="Settings" size="sm" />
            <IconButton icon={<Settings size={16} />} label="Settings" size="md" />
            <IconButton icon={<Settings size={18} />} label="Settings" size="lg" />
        </div>
    ),
};

export const AllVariants: Story = {
    args: { icon: <Settings size={16} />, label: 'Settings' },
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <IconButton icon={<Settings size={16} />} label="Default" variant="default" />
            <IconButton icon={<Copy size={16} />} label="Ghost" variant="ghost" />
            <IconButton icon={<Plus size={16} />} label="Primary" variant="primary" />
            <IconButton icon={<Trash2 size={16} />} label="Disabled" disabled />
            <IconButton icon={<ExternalLink size={16} />} label="External" variant="ghost" />
        </div>
    ),
};
