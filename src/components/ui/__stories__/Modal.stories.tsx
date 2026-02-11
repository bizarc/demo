import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { Modal } from '../Modal';
import { Button } from '../Button';

const meta = {
    title: 'Design System/Feedback/Modal',
    component: Modal,
    tags: ['autodocs'],
    args: {
        open: false,
        onClose: () => {},
        children: 'Modal content',
    },
    argTypes: {
        size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
    },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: function DefaultModal() {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Open Modal</Button>
                <Modal
                    open={open}
                    onClose={() => setOpen(false)}
                    title="Delete Demo"
                    description="Are you sure you want to delete this demo? This action cannot be undone."
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={() => setOpen(false)}>Delete</Button>
                        </>
                    }
                >
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                        All associated data including chat history and leads will be permanently removed.
                    </p>
                </Modal>
            </>
        );
    },
};

export const Small: Story = {
    render: function SmallModal() {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Small Modal</Button>
                <Modal open={open} onClose={() => setOpen(false)} title="Quick Action" size="sm">
                    <p>Small modal content.</p>
                </Modal>
            </>
        );
    },
};

export const Large: Story = {
    render: function LargeModal() {
        const [open, setOpen] = useState(false);
        return (
            <>
                <Button onClick={() => setOpen(true)}>Large Modal</Button>
                <Modal open={open} onClose={() => setOpen(false)} title="Demo Details" size="lg">
                    <p>Large modal with more space for content.</p>
                </Modal>
            </>
        );
    },
};
