import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Sidebar } from '../Sidebar';
import { LayoutDashboard, FlaskConical, Radar, BookOpen, Settings } from 'lucide-react';

const items = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'lab', label: 'THE LAB', icon: <FlaskConical size={18} />, badge: 3 },
    { id: 'radar', label: 'RADAR', icon: <Radar size={18} /> },
    { id: 'blueprint', label: 'BLUEPRINT', icon: <BookOpen size={18} />, disabled: true },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

const meta = {
    title: 'Design System/Navigation/Sidebar',
    component: Sidebar,
    tags: ['autodocs'],
    args: { items },
    decorators: [
        (Story) => (
            <div style={{ height: 400, display: 'flex' }}>
                <Story />
                <div style={{ flex: 1, background: 'var(--color-canvas)' }} />
            </div>
        ),
    ],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { activeId: 'lab' },
};

export const Collapsed: Story = {
    args: { activeId: 'lab', collapsed: true },
};

export const WithHeader: Story = {
    args: {
        activeId: 'lab',
        header: (
            <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 18, color: 'var(--color-primary)' }}>
                Funnel Finished
            </div>
        ),
    },
};
