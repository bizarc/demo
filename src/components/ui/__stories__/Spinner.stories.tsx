import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spinner } from '../Spinner';

const meta = {
    title: 'Design System/Feedback/Spinner',
    component: Spinner,
    tags: ['autodocs'],
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg'] },
        color: { control: 'select', options: ['primary', 'white', 'gray'] },
    },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
    args: { size: 'sm' },
};

export const Large: Story = {
    args: { size: 'lg' },
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
        </div>
    ),
};

export const OnDarkBackground: Story = {
    render: () => (
        <div style={{ background: 'var(--color-primary)', padding: 24, borderRadius: 8 }}>
            <Spinner color="white" />
        </div>
    ),
};
