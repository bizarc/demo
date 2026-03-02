import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { FilterTab } from '../FilterTab';

const meta = {
    title: 'Design System/Data Display/FilterTab',
    component: FilterTab,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        count: { control: 'number' },
        active: { control: 'boolean' },
        onClick: { action: 'clicked' },
    },
} satisfies Meta<typeof FilterTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveWithCount: Story = {
    args: {
        label: 'All',
        count: 1,
        active: true,
        onClick: fn(),
    },
};

export const InactiveWithCount: Story = {
    args: {
        label: 'Active',
        count: 1,
        active: false,
        onClick: fn(),
    },
};

export const ZeroCount: Story = {
    args: {
        label: 'Draft',
        count: 0,
        active: false,
        onClick: fn(),
    },
};

export const LabFilterRow: Story = {
    render: () => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <FilterTab label="All" count={1} active onClick={() => {}} />
            <FilterTab label="Draft" count={0} active={false} onClick={() => {}} />
            <FilterTab label="Active" count={1} active={false} onClick={() => {}} />
            <FilterTab label="Expired" count={0} active={false} onClick={() => {}} />
            <FilterTab label="Blueprint" count={0} active={false} onClick={() => {}} />
        </div>
    ),
};
