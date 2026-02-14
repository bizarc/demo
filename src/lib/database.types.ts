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
export type DemoStatus = 'draft' | 'active' | 'expired' | 'blueprint';

export interface Database {
    public: {
        Tables: {
            demos: {
                Row: {
                    id: string
                    created_at: string
                    expires_at: string | null
                    company_name: string | null
                    industry: string | null
                    website_url: string | null
                    products_services: string[]
                    offers: string[]
                    qualification_criteria: string[]
                    logo_url: string | null
                    primary_color: string
                    secondary_color: string
                    mission_profile: MissionProfile | null
                    openrouter_model: string | null
                    system_prompt: string | null
                    status: DemoStatus
                    created_by: string | null
                    updated_at: string
                    deleted_at: string | null
                    current_step: string | null
                    knowledge_base_id: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    expires_at?: string | null
                    company_name?: string | null
                    industry?: string | null
                    website_url?: string | null
                    products_services?: string[]
                    offers?: string[]
                    qualification_criteria?: string[]
                    logo_url?: string | null
                    primary_color?: string
                    secondary_color?: string
                    mission_profile?: MissionProfile | null
                    openrouter_model?: string | null
                    system_prompt?: string | null
                    status?: DemoStatus
                    created_by?: string | null
                    updated_at?: string
                    deleted_at?: string | null
                    current_step?: string | null
                    knowledge_base_id?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    expires_at?: string | null
                    company_name?: string | null
                    industry?: string | null
                    website_url?: string | null
                    products_services?: string[]
                    offers?: string[]
                    qualification_criteria?: string[]
                    logo_url?: string | null
                    primary_color?: string
                    secondary_color?: string
                    mission_profile?: MissionProfile | null
                    openrouter_model?: string | null
                    system_prompt?: string | null
                    status?: DemoStatus
                    created_by?: string | null
                    updated_at?: string
                    deleted_at?: string | null
                    current_step?: string | null
                    knowledge_base_id?: string | null
                }
                Relationships: []
            }
            knowledge_bases: {
                Row: {
                    id: string
                    demo_id: string
                    name: string
                    type: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    demo_id: string
                    name?: string
                    type?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    demo_id?: string
                    name?: string
                    type?: string
                    created_at?: string
                }
                Relationships: []
            }
            documents: {
                Row: {
                    id: string
                    kb_id: string
                    filename: string
                    content: string
                    chunk_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    kb_id: string
                    filename: string
                    content: string
                    chunk_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    kb_id?: string
                    filename?: string
                    content?: string
                    chunk_count?: number
                    created_at?: string
                }
                Relationships: []
            }
            chunks: {
                Row: {
                    id: string
                    kb_id: string
                    document_id: string
                    content: string
                    embedding: number[]
                    chunk_index: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    kb_id: string
                    document_id: string
                    content: string
                    embedding: number[]
                    chunk_index: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    kb_id?: string
                    document_id?: string
                    content?: string
                    embedding?: number[]
                    chunk_index?: number
                    created_at?: string
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
            match_chunks: {
                Args: {
                    p_kb_id: string
                    p_query_embedding: number[]
                    p_match_threshold?: number
                    p_match_count?: number
                }
                Returns: { id: string; content: string; similarity: number }[]
            }
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
export type DemoUpdate = Database['public']['Tables']['demos']['Update'];
export type RateLimit = Database['public']['Tables']['rate_limits']['Row'];
export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];
