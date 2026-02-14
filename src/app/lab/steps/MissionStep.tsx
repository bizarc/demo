'use client';

import { MISSION_PROFILES, MissionProfile, CHANNELS, Channel } from '@/lib/prompts';
import { RotateCcw, Sprout, Headset, Star, MessageSquare, Mail, Smartphone, Phone, Globe, LucideIcon } from 'lucide-react';

const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
    sms: Smartphone,
    messenger: MessageSquare,
    email: Mail,
    website: Globe,
    voice: Phone,
};

interface MissionStepProps {
    selected: MissionProfile | null;
    channel: Channel;
    onSelect: (profile: MissionProfile) => void;
    onChannelSelect: (channel: Channel) => void;
    onNext: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
    RotateCcw,
    Sprout,
    Headset,
    Star,
};

export function MissionStep({ selected, channel, onSelect, onChannelSelect, onNext }: MissionStepProps) {
    const profiles = Object.values(MISSION_PROFILES);

    return (
        <div>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Choose a mission profile
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                Select the type of AI agent you want to create
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
                {profiles.map((profile) => {
                    const isSelected = selected === profile.id;
                    const IconComponent = ICON_MAP[profile.icon];
                    return (
                        <button
                            key={profile.id}
                            onClick={() => onSelect(profile.id)}
                            style={{
                                background: 'var(--color-surface)',
                                border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                borderRadius: '8px',
                                padding: '20px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'border-color 150ms, box-shadow 150ms',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    background: isSelected ? '#EFF6FF' : 'var(--color-border-subtle)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    {IconComponent && (
                                        <IconComponent
                                            size={20}
                                            strokeWidth={1.75}
                                            color={isSelected ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                                        />
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        color: 'var(--color-text-primary)',
                                        marginBottom: '4px',
                                    }}>
                                        {profile.name}
                                    </h3>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--color-text-secondary)',
                                        lineHeight: 1.5,
                                        margin: 0,
                                    }}>
                                        {profile.description}
                                    </p>
                                </div>
                            </div>
                            {isSelected && (
                                <div style={{
                                    marginTop: '12px',
                                    display: 'inline-block',
                                    padding: '2px 10px',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    borderRadius: '9999px',
                                    background: '#DBEAFE',
                                    color: '#1E40AF',
                                }}>
                                    Selected
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    Channel
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Where will this demo run? (Affects prompt tone and length)
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {CHANNELS.map((c) => {
                        const isSelected = channel === c.id;
                        const IconComp = CHANNEL_ICONS[c.id];
                        return (
                            <button
                                key={c.id}
                                onClick={() => onChannelSelect(c.id)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 14px',
                                    fontSize: '13px',
                                    fontWeight: 500,
                                    background: isSelected ? '#EFF6FF' : 'var(--color-surface)',
                                    border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                }}
                            >
                                {IconComp && <IconComp size={16} strokeWidth={1.75} />}
                                {c.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={onNext}
                    disabled={!selected}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        fontSize: '14px',
                        fontWeight: 500,
                        background: selected ? 'var(--color-primary)' : '#93B4F0',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: selected ? 'pointer' : 'not-allowed',
                        opacity: selected ? 1 : 0.5,
                        transition: 'background 150ms',
                    }}
                >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
