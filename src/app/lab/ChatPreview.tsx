'use client';

import { useState, useEffect, useRef } from 'react';
import { DemoFormData } from './DemoBuilder';
import { MISSION_PROFILES, MissionProfile } from '@/lib/prompts';

interface ChatPreviewProps {
    /** The real draft UUID from the database */
    demoId: string;
    /** Form data for display (company name, brand color, etc.) */
    formData: DemoFormData;
}

interface Message {
    role: 'assistant' | 'user';
    content: string;
}

function getInitialMessages(profile: MissionProfile | null): Message[] {
    if (!profile) return [];
    const config = MISSION_PROFILES[profile];
    return [{ role: 'assistant', content: config.suggestedPrompts[0] }];
}

export function ChatPreview({ demoId, formData }: ChatPreviewProps) {
    const [messages, setMessages] = useState<Message[]>(() =>
        getInitialMessages(formData.missionProfile)
    );
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const missionProfile = formData.missionProfile
        ? MISSION_PROFILES[formData.missionProfile]
        : null;

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;
        const userMessage = input.trim();
        setInput('');

        const updatedMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
        setMessages(updatedMessages);
        setLoading(true);

        try {
            // Build history from previous messages (exclude the initial greeting)
            const history = updatedMessages
                .filter((_, i) => i > 0)
                .slice(0, -1)
                .map(m => ({ role: m.role, content: m.content }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    demoId, // real draft UUID — API loads from DB
                    message: userMessage,
                    history,
                    // No leadIdentifier — preview mode (no persistence)
                }),
            });

            if (!res.ok || !res.body) {
                const err = await res.json().catch(() => ({ error: 'Unknown error' }));
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.error}` }]);
                setLoading(false);
                return;
            }

            // Stream the response
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

                for (const line of lines) {
                    const data = line.replace('data: ', '');
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.token) {
                            assistantContent += parsed.token;
                            setMessages(prev => {
                                const updated = [...prev];
                                updated[updated.length - 1] = { role: 'assistant', content: assistantContent };
                                return updated;
                            });
                        }
                    } catch {
                        // skip malformed SSE lines
                    }
                }
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
        }

        setLoading(false);
    };

    if (!missionProfile) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Live preview</h3>
                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Configuration incomplete</p>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        <p style={{ fontSize: '14px' }}>Save your configuration to enable preview.</p>
                    </div>
                </div>
            </div>
        );
    }

    const brandColor = formData.primaryColor || '#2563EB';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header */}
            <div style={{
                padding: '16px',
                borderBottom: `2px solid ${brandColor}`,
                background: `${brandColor}08`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: brandColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: '14px',
                        fontWeight: 600,
                    }}>
                        {formData.companyName?.charAt(0)?.toUpperCase() || 'A'}
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                            {formData.companyName || 'AI Assistant'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {missionProfile.name} &middot; Preview
                        </div>
                    </div>
                    <div style={{
                        marginLeft: 'auto',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--color-success)',
                    }} />
                </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        style={{
                            display: 'flex',
                            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                    >
                        <div style={{
                            maxWidth: '80%',
                            padding: '10px 14px',
                            borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                            background: msg.role === 'user' ? brandColor : 'var(--color-border-subtle)',
                            color: msg.role === 'user' ? '#FFFFFF' : 'var(--color-text-primary)',
                            fontSize: '14px',
                            lineHeight: 1.5,
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '12px 12px 12px 2px',
                            background: 'var(--color-border-subtle)',
                            color: 'var(--color-text-muted)',
                            fontSize: '14px',
                        }}>
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts */}
            {messages.length === 1 && (
                <div style={{ padding: '0 16px 8px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>Try asking:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {missionProfile.suggestedPrompts.slice(1, 4).map((prompt, idx) => (
                            <button
                                key={idx}
                                onClick={() => setInput(prompt)}
                                style={{
                                    fontSize: '12px',
                                    padding: '4px 12px',
                                    background: 'var(--color-border-subtle)',
                                    color: 'var(--color-text-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '9999px',
                                    cursor: 'pointer',
                                    transition: 'background 150ms',
                                }}
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            color: 'var(--color-text-primary)',
                        }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        style={{
                            padding: '10px 14px',
                            background: brandColor,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                            opacity: (!input.trim() || loading) ? 0.5 : 1,
                            transition: 'opacity 150ms',
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
