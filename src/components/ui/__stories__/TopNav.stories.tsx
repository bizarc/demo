import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TopNav } from '../TopNav';
import { Avatar } from '../Avatar';
import { Button } from '../Button';

const meta = {
    title: 'Design System/Navigation/TopNav',
    component: TopNav,
    tags: ['autodocs'],
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        title: 'Demo Builder',
        subtitle: 'Step 3 of 5',
        backLabel: 'Back to LAB',
    },
};

export const WithStatus: Story = {
    args: {
        title: 'Acme Corp Demo',
        status: 'live',
        avatar: <Avatar name="AC" variant="agent" size="sm" />,
    },
};

export const WithActions: Story = {
    args: {
        title: 'THE LAB',
        subtitle: 'AI Demo Builder',
        actions: (
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="sm">Help</Button>
                <Button variant="primary" size="sm">New Demo</Button>
            </div>
        ),
    },
};
