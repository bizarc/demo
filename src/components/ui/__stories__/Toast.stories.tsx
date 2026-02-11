import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToastItem } from '../Toast';

const meta = {
    title: 'Design System/Feedback/Toast',
    component: ToastItem,
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['default', 'success', 'error', 'warning'] },
    },
} satisfies Meta<typeof ToastItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { title: 'Notification', description: 'Something happened.' },
};

export const Success: Story = {
    args: { title: 'Demo created!', description: 'Your magic link is ready.', variant: 'success' },
};

export const Error: Story = {
    args: { title: 'Failed to save', description: 'Please try again.', variant: 'error' },
};

export const Warning: Story = {
    args: { title: 'Token limit approaching', description: '8,500 of 10,000 tokens used.', variant: 'warning' },
};

export const WithClose: Story = {
    args: { title: 'Dismissible', description: 'Click the X to close.', variant: 'success', onClose: () => {} },
};

export const AllVariants: Story = {
    args: { title: 'All Variants' },
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: 400 }}>
            <ToastItem title="Default" description="Plain notification" />
            <ToastItem title="Success" description="Demo created" variant="success" />
            <ToastItem title="Error" description="Something failed" variant="error" />
            <ToastItem title="Warning" description="Token limit near" variant="warning" />
        </div>
    ),
};
