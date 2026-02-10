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
