import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StepIndicator } from '../StepIndicator';

const steps = [
    { id: 'mission', label: 'Mission Profile', description: 'Choose mission type' },
    { id: 'website', label: 'Target Website', description: 'Scrape company data' },
    { id: 'context', label: 'Context', description: 'Review and edit' },
    { id: 'model', label: 'Model', description: 'Select AI model' },
    { id: 'summary', label: 'Create', description: 'Review and deploy' },
];

const meta = {
    title: 'Design System/Navigation/StepIndicator',
    component: StepIndicator,
    tags: ['autodocs'],
    args: { steps },
} satisfies Meta<typeof StepIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstStep: Story = {
    args: { currentStep: 'mission', completedSteps: [] },
};

export const MidWay: Story = {
    args: { currentStep: 'context', completedSteps: ['mission', 'website'] },
};

export const AllComplete: Story = {
    args: { currentStep: 'summary', completedSteps: ['mission', 'website', 'context', 'model'] },
};

export const Horizontal: Story = {
    args: { currentStep: 'context', completedSteps: ['mission', 'website'], orientation: 'horizontal' },
};
