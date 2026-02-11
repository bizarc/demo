import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Badge } from '../Badge';

const meta = {
    title: 'Design System/Core/Badge',
    component: Badge,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['live', 'draft', 'archived', 'type', 'default'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md'],
        },
    },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Live: Story = {
    args: { children: 'Live', variant: 'live' },
};

export const Draft: Story = {
    args: { children: 'Draft', variant: 'draft' },
};

export const Archived: Story = {
    args: { children: 'Archived', variant: 'archived' },
};

export const Type: Story = {
    args: { children: 'Reactivation', variant: 'type' },
};

export const Small: Story = {
    args: { children: 'SM Badge', variant: 'live', size: 'sm' },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Badge variant="live">Live</Badge>
            <Badge variant="draft">Draft</Badge>
            <Badge variant="archived">Archived</Badge>
            <Badge variant="type">Reactivation</Badge>
            <Badge variant="default">Default</Badge>
        </div>
    ),
};
