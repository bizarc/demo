import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EmptyState } from '../EmptyState';
import { Button } from '../Button';
import { FlaskConical, Inbox, Search } from 'lucide-react';

const meta = {
    title: 'Design System/Feedback/EmptyState',
    component: EmptyState,
    tags: ['autodocs'],
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'No demos yet',
        description: 'Create your first AI demo agent to get started.',
        icon: <FlaskConical size={48} strokeWidth={1.5} />,
        action: <Button>Create Demo</Button>,
    },
};

export const NoResults: Story = {
    args: {
        title: 'No results found',
        description: 'Try adjusting your search or filter criteria.',
        icon: <Search size={48} strokeWidth={1.5} />,
    },
};

export const EmptyInbox: Story = {
    args: {
        title: 'All caught up!',
        description: 'No new notifications.',
        icon: <Inbox size={48} strokeWidth={1.5} />,
    },
};
