import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumbs } from '../Breadcrumbs';
import { Home } from 'lucide-react';

const meta = {
    title: 'Design System/Navigation/Breadcrumbs',
    component: Breadcrumbs,
    tags: ['autodocs'],
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        items: [
            { label: 'Home', href: '/' },
            { label: 'THE LAB', href: '/lab' },
            { label: 'New Demo' },
        ],
    },
};

export const WithIcons: Story = {
    args: {
        items: [
            { label: 'Home', href: '/', icon: <Home size={14} /> },
            { label: 'THE LAB', href: '/lab' },
            { label: 'Demo: Acme Corp' },
        ],
    },
};

export const SingleItem: Story = {
    args: {
        items: [{ label: 'Dashboard' }],
    },
};
