import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Avatar } from '../Avatar';

const meta = {
    title: 'Design System/Core/Avatar',
    component: Avatar,
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
        variant: { control: 'select', options: ['user', 'agent'] },
        status: { control: 'select', options: [undefined, 'online', 'offline', 'busy'] },
        name: { control: 'text' },
    },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserInitials: Story = {
    args: { name: 'John Doe', variant: 'user' },
};

export const Agent: Story = {
    args: { variant: 'agent' },
};

export const WithStatus: Story = {
    args: { name: 'Jane Smith', status: 'online' },
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Avatar name="JD" size="sm" status="online" />
            <Avatar name="JD" size="md" status="online" />
            <Avatar name="JD" size="lg" status="online" />
        </div>
    ),
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Avatar name="User" variant="user" status="online" />
            <Avatar variant="agent" status="online" />
            <Avatar name="Busy" status="busy" />
            <Avatar name="Off" status="offline" />
        </div>
    ),
};
