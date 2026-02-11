import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Divider } from '../Divider';

const meta = {
    title: 'Design System/Data Display/Divider',
    component: Divider,
    tags: ['autodocs'],
    argTypes: {
        orientation: { control: 'select', options: ['horizontal', 'vertical'] },
        label: { control: 'text' },
    },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};

export const WithLabel: Story = {
    args: { label: 'or' },
};

export const Vertical: Story = {
    args: { orientation: 'vertical' },
    decorators: [
        (Story) => (
            <div style={{ display: 'flex', alignItems: 'center', height: 80, gap: 16 }}>
                <span>Left</span>
                <Story />
                <span>Right</span>
            </div>
        ),
    ],
};
