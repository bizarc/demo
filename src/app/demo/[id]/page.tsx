'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import { Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './chat.module.css';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

interface DemoConfig {
    id: string;
    company_name: string;
    logo_url: string;
    primary_color: string;
    secondary_color: string;
    mission_profile: string;
    system_prompt: string;
    offers?: string[];
}

function DemoChat() {
    const params = useParams();
    const demoIdRaw = params.id;
    const demoId = Array.isArray(demoIdRaw) ? demoIdRaw[0] : demoIdRaw;

    // State
    const [config, setConfig] = useState<DemoConfig | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [leadId, setLeadId] = useState<string>('');

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Initialization
    useEffect(() => {
        if (!demoId) return;

        // 1. Get or create lead identifier
        let storedLeadId = localStorage.getItem(`lead_${demoId}`);
        if (!storedLeadId) {
            storedLeadId = nanoid();
            localStorage.setItem(`lead_${demoId}`, storedLeadId);
        }
        setLeadId(storedLeadId);

        // 2. Fetch Demo Config
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        supabase
            .from('demos')
            .select('*')
            .eq('id', demoId)
            .single()
            .then(async ({ data, error }) => {
                if (error || !data) {
                    setError('Demo not found or expired');
                    setIsLoading(false);
                    return;
                }
                setConfig(data);

                // 3. Fetch Chat History
                try {
                    const res = await fetch(`/api/chat?demoId=${demoId}&leadIdentifier=${storedLeadId}`);
                    if (res.ok) {
                        const history = await res.json();
                        if (history.messages) {
                            setMessages(history.messages);
                        }
                    }
                } catch (e) {
                    console.error('Failed to load history', e);
                }
                setIsLoading(false);
            });

    }, [demoId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    // Send Message
    const handleSend = async (text: string = input) => {
        if (!text.trim() || isSending || !config) return;

        const userMsg: Message = { role: 'user', content: text, created_at: new Date().toISOString() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    demoId,
                    message: text,
                    leadIdentifier: leadId,
                    // We don't verify history on client for security, but we could send it for fallback
                    // API handles loading history from DB now
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantMsg = { role: 'assistant', content: '', created_at: new Date().toISOString() } as Message;

            setMessages(prev => [...prev, assistantMsg]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                assistantMsg.content += parsed.content;
                                setMessages(prev => {
                                    const newMsgs = [...prev];
                                    newMsgs[newMsgs.length - 1] = { ...assistantMsg };
                                    return newMsgs;
                                });
                            }
                        } catch (e) {
                            console.error('Parse error', e);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
        } finally {
            setIsSending(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (error) {
        return <div className={styles.errorScreen}>
            <h2>Unable to load demo</h2>
            <p>{error}</p>
        </div>;
    }

    if (isLoading || !config) {
        return <div className={styles.loadingScreen}>
            <div className={styles.statusDot} style={{ width: 12, height: 12, animation: 'pulse 1s infinite' }} />
            Loading demo environment...
        </div>;
    }

    return (
        <div className={styles.container} style={{ '--brand-color': config.primary_color } as any}>
            {/* Header */}
            <div className={styles.header}>
                {config.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={config.logo_url} alt="Logo" className={styles.logo} />
                ) : (
                    <div className={styles.logo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Sparkles size={20} color={config.primary_color} />
                    </div>
                )}
                <div className={styles.headerInfo}>
                    <div className={styles.companyName}>{config.company_name}</div>
                    <div className={styles.status}>
                        <div className={styles.statusDot} />
                        Online
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatArea}>
                {/* Intro / Welcome */}
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', opacity: 0.7 }}>
                        <h3 style={{ marginBottom: 8 }}>Welcome to {config.company_name}</h3>
                        <p style={{ fontSize: 14 }}>How can we help you today?</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}
                    >
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                ))}

                {isSending && (
                    <div className={`${styles.message} ${styles.assistantMessage}`}>
                        <div className={styles.typingIndicator}>
                            <div className={styles.typingDot} />
                            <div className={styles.typingDot} />
                            <div className={styles.typingDot} />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Suggested Prompts (if empty history) */}
            {messages.length === 0 && config.offers && Array.isArray(config.offers) && config.offers.length > 0 && (
                <div className={styles.suggestions}>
                    {config.offers.slice(0, 3).map((offer, i) => (
                        <button
                            key={i}
                            className={styles.suggestionChip}
                            onClick={() => handleSend(`Tell me about: ${offer}`)}
                        >
                            {offer}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className={styles.inputArea}>
                <div className={styles.inputContainer}>
                    <textarea
                        ref={inputRef}
                        className={styles.textInput}
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isSending}
                        rows={1}
                    />
                    <button
                        className={styles.sendButton}
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isSending}
                    >
                        <Send size={20} />
                    </button>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#9CA3AF' }}>
                    Powered by The Lab
                </div>
            </div>
        </div>
    );
}

export default function DemoPage() {
    return <DemoChat />;
}
