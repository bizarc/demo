import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from '../Button';

const meta = {
    title: 'Design System/Core/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['primary', 'secondary', 'ghost', 'destructive'],
        },
        size: {
            control: 'select',
            options: ['sm', 'md', 'lg'],
        },
        loading: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
    args: { children: 'Primary Button', variant: 'primary' },
};

export const Secondary: Story = {
    args: { children: 'Secondary Button', variant: 'secondary' },
};

export const Ghost: Story = {
    args: { children: 'Ghost Button', variant: 'ghost' },
};

export const Destructive: Story = {
    args: { children: 'Delete', variant: 'destructive' },
};

export const Small: Story = {
    args: { children: 'Small', size: 'sm' },
};

export const Large: Story = {
    args: { children: 'Large Button', size: 'lg' },
};

export const Loading: Story = {
    args: { children: 'Saving...', loading: true },
};

export const Disabled: Story = {
    args: { children: 'Disabled', disabled: true },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
        </div>
    ),
};

export const AllSizes: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
        </div>
    ),
};
