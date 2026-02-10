import { ReactNode } from 'react';

export interface ChatBubbleProps {
    variant: 'agent' | 'user';
    children: ReactNode;
    timestamp?: string;
    avatar?: ReactNode;
    isTyping?: boolean;
    className?: string;
}

export function ChatBubble({
    variant,
    children,
    timestamp,
    avatar,
    isTyping,
    className = '',
}: ChatBubbleProps) {
    const isAgent = variant === 'agent';

    return (
        <div className={`flex ${isAgent ? 'justify-start' : 'justify-end'} ${className}`}>
            <div className={`flex max-w-[80%] ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                {avatar && (
                    <div className={`flex-shrink-0 ${isAgent ? 'mr-2' : 'ml-2'}`}>
                        {avatar}
                    </div>
                )}
                <div>
                    <div
                        className={`
              px-4 py-2.5 rounded-2xl text-sm
              ${isAgent
                                ? 'bg-surface border border-border text-foreground rounded-bl-md'
                                : 'bg-primary text-white rounded-br-md'
                            }
            `}
                    >
                        {isTyping ? (
                            <div className="flex space-x-1">
                                <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-foreground-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                    {timestamp && (
                        <p className={`mt-1 text-xs text-foreground-muted ${isAgent ? 'text-left' : 'text-right'}`}>
                            {timestamp}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Typing indicator shorthand
export function TypingIndicator({ avatar }: { avatar?: ReactNode }) {
    return <ChatBubble variant="agent" avatar={avatar} isTyping>{null}</ChatBubble>;
}
