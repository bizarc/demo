// Database types for Supabase
// Auto-generated structure - will be replaced by `npx supabase gen types`

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type MissionProfile = 'reactivation' | 'nurture' | 'service' | 'review';

export interface Database {
    public: {
        Tables: {
            demos: {
                Row: {
                    id: string
                    created_at: string
                    expires_at: string
                    company_name: string
                    industry: string | null
                    website_url: string
                    products_services: string[]
                    offers: string[]
                    qualification_criteria: string[]
                    logo_url: string | null
                    primary_color: string
                    secondary_color: string
                    mission_profile: MissionProfile
                    openrouter_model: string
                    system_prompt: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    expires_at: string
                    company_name: string
                    industry?: string | null
                    website_url: string
                    products_services?: string[]
                    offers?: string[]
                    qualification_criteria?: string[]
                    logo_url?: string | null
                    primary_color?: string
                    secondary_color?: string
                    mission_profile: MissionProfile
                    openrouter_model?: string
                    system_prompt: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    expires_at?: string
                    company_name?: string
                    industry?: string | null
                    website_url?: string
                    products_services?: string[]
                    offers?: string[]
                    qualification_criteria?: string[]
                    logo_url?: string | null
                    primary_color?: string
                    secondary_color?: string
                    mission_profile?: MissionProfile
                    openrouter_model?: string
                    system_prompt?: string
                }
                Relationships: []
            }
            rate_limits: {
                Row: {
                    key: string
                    value: number
                    description: string | null
                }
                Insert: {
                    key: string
                    value: number
                    description?: string | null
                }
                Update: {
                    key?: string
                    value?: number
                    description?: string | null
                }
                Relationships: []
            }
            leads: {
                Row: {
                    id: string
                    demo_id: string
                    identifier: string
                    identifier_type: 'email' | 'phone' | 'anonymous'
                    display_name: string | null
                    created_at: string
                    last_seen_at: string
                    metadata: Json
                }
                Insert: {
                    id?: string
                    demo_id: string
                    identifier: string
                    identifier_type: 'email' | 'phone' | 'anonymous'
                    display_name?: string | null
                    created_at?: string
                    last_seen_at?: string
                    metadata?: Json
                }
                Update: {
                    id?: string
                    demo_id?: string
                    identifier?: string
                    identifier_type?: 'email' | 'phone' | 'anonymous'
                    display_name?: string | null
                    created_at?: string
                    last_seen_at?: string
                    metadata?: Json
                }
                Relationships: []
            }
            sessions: {
                Row: {
                    id: string
                    lead_id: string
                    demo_id: string
                    channel: 'chat' | 'voice' | 'sms'
                    created_at: string
                    ended_at: string | null
                    metadata: Json
                }
                Insert: {
                    id?: string
                    lead_id: string
                    demo_id: string
                    channel?: 'chat' | 'voice' | 'sms'
                    created_at?: string
                    ended_at?: string | null
                    metadata?: Json
                }
                Update: {
                    id?: string
                    lead_id?: string
                    demo_id?: string
                    channel?: 'chat' | 'voice' | 'sms'
                    created_at?: string
                    ended_at?: string | null
                    metadata?: Json
                }
                Relationships: []
            }
            messages: {
                Row: {
                    id: string
                    session_id: string
                    role: 'system' | 'user' | 'assistant'
                    content: string
                    created_at: string
                    token_count: number
                    metadata: Json
                }
                Insert: {
                    id?: string
                    session_id: string
                    role: 'system' | 'user' | 'assistant'
                    content: string
                    created_at?: string
                    token_count?: number
                    metadata?: Json
                }
                Update: {
                    id?: string
                    session_id?: string
                    role?: 'system' | 'user' | 'assistant'
                    content?: string
                    created_at?: string
                    token_count?: number
                    metadata?: Json
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Convenience types
export type Demo = Database['public']['Tables']['demos']['Row'];
export type DemoInsert = Database['public']['Tables']['demos']['Insert'];
export type RateLimit = Database['public']['Tables']['rate_limits']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
