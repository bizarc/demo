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
                    agent_context: string | null
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
                    version: number
                    channel: string | null
                    sms_short_code: string | null
                    whatsapp_short_code: string | null
                    email_short_code: string | null
                    voice_short_code: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    expires_at?: string | null
                    company_name?: string | null
                    industry?: string | null
                    website_url?: string | null
                    agent_context?: string | null
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
                    version?: number
                    channel?: string | null
                    sms_short_code?: string | null
                    whatsapp_short_code?: string | null
                    email_short_code?: string | null
                    voice_short_code?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    expires_at?: string | null
                    company_name?: string | null
                    industry?: string | null
                    website_url?: string | null
                    agent_context?: string | null
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
                    version?: number
                    channel?: string | null
                    sms_short_code?: string | null
                    whatsapp_short_code?: string | null
                    email_short_code?: string | null
                    voice_short_code?: string | null
                }
                Relationships: []
            }
            demo_knowledge_bases: {
                Row: {
                    demo_id: string
                    kb_id: string
                    created_at: string
                }
                Insert: {
                    demo_id: string
                    kb_id: string
                    created_at?: string
                }
                Update: {
                    demo_id?: string
                    kb_id?: string
                    created_at?: string
                }
                Relationships: []
            }
            knowledge_bases: {
                Row: {
                    id: string
                    name: string
                    type: string
                    description: string | null
                    status: string
                    version: number
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name?: string
                    type?: string
                    description?: string | null
                    status?: string
                    version?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: string
                    description?: string | null
                    status?: string
                    version?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
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
                    identifier_type: 'email' | 'phone' | 'anonymous' | 'whatsapp'
                    display_name: string | null
                    created_at: string
                    last_seen_at: string
                    metadata: Json
                }
                Insert: {
                    id?: string
                    demo_id: string
                    identifier: string
                    identifier_type: 'email' | 'phone' | 'anonymous' | 'whatsapp'
                    display_name?: string | null
                    created_at?: string
                    last_seen_at?: string
                    metadata?: Json
                }
                Update: {
                    id?: string
                    demo_id?: string
                    identifier?: string
                    identifier_type?: 'email' | 'phone' | 'anonymous' | 'whatsapp'
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
                    channel: 'chat' | 'voice' | 'sms' | 'messenger' | 'email'
                    created_at: string
                    ended_at: string | null
                    metadata: Json
                }
                Insert: {
                    id?: string
                    lead_id: string
                    demo_id: string
                    channel?: 'chat' | 'voice' | 'sms' | 'messenger' | 'email'
                    created_at?: string
                    ended_at?: string | null
                    metadata?: Json
                }
                Update: {
                    id?: string
                    lead_id?: string
                    demo_id?: string
                    channel?: 'chat' | 'voice' | 'sms' | 'messenger' | 'email'
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
            workspaces: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: { id?: string; name: string; created_at?: string }
                Update: { id?: string; name?: string; created_at?: string }
                Relationships: []
            }
            profiles: {
                Row: {
                    id: string
                    role: string
                    workspace_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: { id: string; role: string; workspace_id?: string | null; created_at?: string; updated_at?: string }
                Update: { role?: string; workspace_id?: string | null; updated_at?: string }
                Relationships: []
            }
            research_records: {
                Row: {
                    id: string
                    workspace_id: string
                    target_id: string | null
                    source: string
                    title: string
                    summary: string
                    competitors: string[]
                    market_position: string | null
                    offerings: string[]
                    tech_stack: string[]
                    evidence: Json
                    confidence_score: number | null
                    status: string
                    version: number
                    created_by: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    workspace_id: string
                    target_id?: string | null
                    source?: string
                    title: string
                    summary?: string
                    competitors?: string[]
                    market_position?: string | null
                    offerings?: string[]
                    tech_stack?: string[]
                    evidence?: Json
                    confidence_score?: number | null
                    status?: string
                    version?: number
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            research_links: {
                Row: {
                    id: string
                    research_id: string
                    link_type: string
                    target_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    research_id: string
                    link_type: string
                    target_id: string
                    created_at?: string
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            // RADAR tables
            prospects: {
                Row: {
                    id: string
                    email: string | null
                    phone: string | null
                    linkedin_url: string | null
                    instagram_handle: string | null
                    first_name: string | null
                    last_name: string | null
                    company_name: string | null
                    title: string | null
                    industry: string | null
                    company_size: string | null
                    website_url: string | null
                    location: string | null
                    // Discovery columns (migration 007)
                    address: string | null
                    city: string | null
                    state: string | null
                    google_place_id: string | null
                    google_rating: number | null
                    google_review_count: number | null
                    enriched_at: string | null
                    enrichment_source: string | null
                    enrichment_data: Json | null
                    tags: string[]
                    score: number
                    score_signals: Json | null
                    status: 'active' | 'new' | 'unsubscribed' | 'bounced' | 'archived'
                    unsubscribed_at: string | null
                    bounced_at: string | null
                    bounce_type: 'hard' | 'soft' | null
                    lead_id: string | null
                    imported_by: string | null
                    created_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    id?: string
                    email?: string | null
                    phone?: string | null
                    linkedin_url?: string | null
                    instagram_handle?: string | null
                    first_name?: string | null
                    last_name?: string | null
                    company_name?: string | null
                    title?: string | null
                    industry?: string | null
                    company_size?: string | null
                    website_url?: string | null
                    location?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    google_place_id?: string | null
                    google_rating?: number | null
                    google_review_count?: number | null
                    enriched_at?: string | null
                    enrichment_source?: string | null
                    enrichment_data?: Json | null
                    tags?: string[]
                    score?: number
                    score_signals?: Json | null
                    status?: 'active' | 'new' | 'unsubscribed' | 'bounced' | 'archived'
                    unsubscribed_at?: string | null
                    bounced_at?: string | null
                    bounce_type?: 'hard' | 'soft' | null
                    lead_id?: string | null
                    imported_by?: string | null
                    created_at?: string
                    updated_at?: string
                    version?: number
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            discovery_sessions: {
                Row: {
                    id: string
                    query: string
                    niche: string | null
                    location: string | null
                    result_count: number
                    imported_count: number
                    raw_results: Json | null
                    created_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    query: string
                    niche?: string | null
                    location?: string | null
                    result_count?: number
                    imported_count?: number
                    raw_results?: Json | null
                    created_by?: string | null
                    created_at?: string
                }
                Update: {
                    query?: string
                    niche?: string | null
                    location?: string | null
                    result_count?: number
                    imported_count?: number
                    raw_results?: Json | null
                }
                Relationships: []
            }
            campaigns: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    outreach_goal: string | null
                    target_niche: string | null
                    channel: 'email' | 'instagram' | 'linkedin'
                    from_name: string | null
                    from_email: string | null
                    reply_to_email: string | null
                    research_record_id: string | null
                    knowledge_base_id: string | null
                    openrouter_model: string | null
                    send_time_hour: number
                    send_days: string[]
                    timezone: string
                    daily_send_limit: number
                    status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
                    created_by: string | null
                    created_at: string
                    updated_at: string
                    version: number
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    outreach_goal?: string | null
                    target_niche?: string | null
                    channel?: 'email' | 'instagram' | 'linkedin'
                    from_name?: string | null
                    from_email?: string | null
                    reply_to_email?: string | null
                    research_record_id?: string | null
                    knowledge_base_id?: string | null
                    openrouter_model?: string | null
                    send_time_hour?: number
                    send_days?: string[]
                    timezone?: string
                    daily_send_limit?: number
                    status?: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
                    created_by?: string | null
                    created_at?: string
                    updated_at?: string
                    version?: number
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            campaign_steps: {
                Row: {
                    id: string
                    campaign_id: string
                    step_number: number
                    name: string | null
                    subject_template: string | null
                    body_template: string | null
                    delay_days: number
                    use_ai: boolean
                    ai_instructions: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    campaign_id: string
                    step_number: number
                    name?: string | null
                    subject_template?: string | null
                    body_template?: string | null
                    delay_days?: number
                    use_ai?: boolean
                    ai_instructions?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            campaign_enrollments: {
                Row: {
                    id: string
                    campaign_id: string
                    prospect_id: string
                    current_step: number
                    status: 'active' | 'completed' | 'replied' | 'unsubscribed' | 'bounced' | 'paused'
                    enrolled_at: string
                    next_send_at: string | null
                    completed_at: string | null
                    sending_at: string | null
                    personalization_context: Json | null
                    enrolled_by: string | null
                }
                Insert: {
                    id?: string
                    campaign_id: string
                    prospect_id: string
                    current_step?: number
                    status?: 'active' | 'completed' | 'replied' | 'unsubscribed' | 'bounced' | 'paused'
                    enrolled_at?: string
                    next_send_at?: string | null
                    completed_at?: string | null
                    sending_at?: string | null
                    personalization_context?: Json | null
                    enrolled_by?: string | null
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
            outreach_events: {
                Row: {
                    id: string
                    campaign_id: string | null
                    prospect_id: string | null
                    enrollment_id: string | null
                    step_number: number | null
                    event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'converted'
                    channel: string
                    message_id: string | null
                    subject: string | null
                    body_preview: string | null
                    tracking_id: string | null
                    ip_address: string | null
                    user_agent: string | null
                    metadata: Json | null
                    occurred_at: string
                }
                Insert: {
                    id?: string
                    campaign_id?: string | null
                    prospect_id?: string | null
                    enrollment_id?: string | null
                    step_number?: number | null
                    event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'converted'
                    channel?: string
                    message_id?: string | null
                    subject?: string | null
                    body_preview?: string | null
                    tracking_id?: string | null
                    ip_address?: string | null
                    user_agent?: string | null
                    metadata?: Json | null
                    occurred_at?: string
                }
                Update: { [k: string]: unknown }
                Relationships: []
            }
        }
        Views: {
            campaign_analytics: {
                Row: {
                    campaign_id: string
                    campaign_name: string
                    campaign_status: string
                    channel: string
                    outreach_goal: string | null
                    total_enrollments: number
                    active_enrollments: number
                    completed_enrollments: number
                    replied_enrollments: number
                    total_sent: number
                    total_delivered: number
                    unique_opens: number
                    total_opens: number
                    unique_clicks: number
                    total_clicks: number
                    unique_replies: number
                    total_bounced: number
                    total_unsubscribed: number
                    total_converted: number
                    open_rate: number
                    reply_rate: number
                    click_rate: number
                    created_at: string
                    updated_at: string
                }
            }
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
export type KnowledgeBase = Database['public']['Tables']['knowledge_bases']['Row'];
export type KnowledgeBaseInsert = Database['public']['Tables']['knowledge_bases']['Insert'];
export type KnowledgeBaseUpdate = Database['public']['Tables']['knowledge_bases']['Update'];
export type ResearchRecord = Database['public']['Tables']['research_records']['Row'];
export type ResearchRecordInsert = Database['public']['Tables']['research_records']['Insert'];

// RADAR convenience types
export type Prospect = Database['public']['Tables']['prospects']['Row'];
export type ProspectInsert = Database['public']['Tables']['prospects']['Insert'];
export type ProspectUpdate = Database['public']['Tables']['prospects']['Update'];
export type Campaign = Database['public']['Tables']['campaigns']['Row'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];
export type CampaignStep = Database['public']['Tables']['campaign_steps']['Row'];
export type CampaignStepInsert = Database['public']['Tables']['campaign_steps']['Insert'];
export type CampaignEnrollment = Database['public']['Tables']['campaign_enrollments']['Row'];
export type CampaignEnrollmentInsert = Database['public']['Tables']['campaign_enrollments']['Insert'];
export type OutreachEvent = Database['public']['Tables']['outreach_events']['Row'];
export type OutreachEventInsert = Database['public']['Tables']['outreach_events']['Insert'];
export type CampaignAnalytics = Database['public']['Views']['campaign_analytics']['Row'];
