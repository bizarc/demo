import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Checkbox } from '../Checkbox';

const meta = {
    title: 'Design System/Form Controls/Checkbox',
    component: Checkbox,
    tags: ['autodocs'],
    argTypes: {
        label: { control: 'text' },
        description: { control: 'text' },
        indeterminate: { control: 'boolean' },
        disabled: { control: 'boolean' },
    },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: { label: 'Accept terms and conditions' },
};

export const WithDescription: Story = {
    args: { label: 'Email notifications', description: 'Receive weekly digest emails' },
};

export const Checked: Story = {
    args: { label: 'Checked', defaultChecked: true },
};

export const Indeterminate: Story = {
    args: { label: 'Select all', indeterminate: true },
};

export const Disabled: Story = {
    args: { label: 'Disabled option', disabled: true },
};

export const CheckboxGroup: Story = {
    render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Checkbox label="Database Reactivation" defaultChecked />
            <Checkbox label="Inbound Nurture" />
            <Checkbox label="Customer Service" defaultChecked />
            <Checkbox label="Review Generation" disabled />
        </div>
    ),
};
