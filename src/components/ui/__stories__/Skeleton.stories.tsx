import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton, SkeletonCard, SkeletonAvatar } from '../Skeleton';

const meta = {
    title: 'Design System/Feedback/Skeleton',
    component: Skeleton,
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['text', 'circular', 'rectangular'] },
        lines: { control: 'number' },
    },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
    args: { variant: 'text', width: '200px' },
};

export const MultiLine: Story = {
    args: { variant: 'text', lines: 3, width: '300px' },
};

export const Circular: Story = {
    args: { variant: 'circular', width: 48, height: 48 },
};

export const Rectangular: Story = {
    args: { variant: 'rectangular', width: '300px', height: '120px' },
};

export const CardSkeleton: Story = {
    render: () => <SkeletonCard />,
};

export const AvatarSkeletons: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SkeletonAvatar size="sm" />
            <SkeletonAvatar size="md" />
            <SkeletonAvatar size="lg" />
        </div>
    ),
};
