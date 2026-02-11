import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from '../Card';

const meta = {
    title: 'Design System/Core/Card',
    component: Card,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'interactive', 'selected'],
        },
        padding: {
            control: 'select',
            options: ['none', 'sm', 'md', 'lg'],
        },
    },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        children: (
            <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Card Title</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Card description goes here.</p>
            </div>
        ),
    },
};

export const Interactive: Story = {
    args: {
        variant: 'interactive',
        children: (
            <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Clickable Card</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Hover to see the interaction effect.</p>
            </div>
        ),
    },
};

export const Selected: Story = {
    args: {
        variant: 'selected',
        children: (
            <div>
                <h3 style={{ fontWeight: 600, marginBottom: 4 }}>Selected Card</h3>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>This card is in the selected state.</p>
            </div>
        ),
    },
};

export const AllVariants: Story = {
    render: () => (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {(['default', 'interactive', 'selected'] as const).map(variant => (
                <Card key={variant} variant={variant} style={{ width: 220 }}>
                    <h3 style={{ fontWeight: 600, marginBottom: 4, textTransform: 'capitalize' }}>{variant}</h3>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Card content</p>
                </Card>
            ))}
        </div>
    ),
};
