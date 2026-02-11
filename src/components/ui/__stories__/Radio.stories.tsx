import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { RadioGroup, Radio } from '../Radio';

const meta = {
    title: 'Design System/Form Controls/Radio',
    component: RadioGroup,
    tags: ['autodocs'],
    args: {
        name: 'radio-group',
        children: null,
    },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    render: function DefaultRadio() {
        const [value, setValue] = useState('reactivation');
        return (
            <RadioGroup name="mission" value={value} onChange={setValue}>
                <Radio value="reactivation" label="Database Reactivation" description="Re-engage lapsed customers" />
                <Radio value="nurture" label="Inbound Nurture" description="Convert incoming leads" />
                <Radio value="service" label="Customer Service" description="Handle support inquiries" />
                <Radio value="review" label="Review Generation" description="Collect customer reviews" />
            </RadioGroup>
        );
    },
};

export const Disabled: Story = {
    render: () => (
        <RadioGroup name="disabled" value="a" disabled>
            <Radio value="a" label="Option A" />
            <Radio value="b" label="Option B" />
        </RadioGroup>
    ),
};
