import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatBubble, TypingIndicator } from '../ChatBubble';
import { Avatar } from '../Avatar';

const meta = {
    title: 'Design System/Data Display/ChatBubble',
    component: ChatBubble,
    tags: ['autodocs'],
    argTypes: {
        variant: { control: 'select', options: ['agent', 'user'] },
    },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AgentMessage: Story = {
    args: {
        variant: 'agent',
        children: 'Hello! How can I help you today?',
        timestamp: '2:30 PM',
    },
};

export const UserMessage: Story = {
    args: {
        variant: 'user',
        children: 'I\'d like to learn more about your services.',
        timestamp: '2:31 PM',
    },
};

export const WithAvatar: Story = {
    args: {
        variant: 'agent',
        children: 'Welcome! I\'m your AI assistant.',
        avatar: <Avatar variant="agent" size="sm" />,
    },
};

export const Typing: Story = {
    args: { variant: 'agent', children: '' },
    render: () => <TypingIndicator avatar={<Avatar variant="agent" size="sm" />} />,
};

export const Conversation: Story = {
    args: { variant: 'agent', children: '' },
    render: () => (
        <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ChatBubble variant="agent" avatar={<Avatar variant="agent" size="sm" />} timestamp="2:30 PM">
                Hi there! Welcome to Acme Corp. How can I assist you today?
            </ChatBubble>
            <ChatBubble variant="user" timestamp="2:31 PM">
                I&apos;m interested in your enterprise plan. Can you tell me more?
            </ChatBubble>
            <ChatBubble variant="agent" avatar={<Avatar variant="agent" size="sm" />} timestamp="2:31 PM">
                Absolutely! Our enterprise plan includes unlimited API access, dedicated support,
                and custom integrations. Would you like me to schedule a demo?
            </ChatBubble>
            <TypingIndicator avatar={<Avatar variant="agent" size="sm" />} />
        </div>
    ),
};
