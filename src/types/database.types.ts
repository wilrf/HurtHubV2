export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          sector: string | null;
          description: string | null;
          founded_year: number | null;
          employees_count: number | null;
          revenue: number | null;
          website: string | null;
          headquarters: string | null;
          logo_url: string | null;
          status: "active" | "inactive" | "pending";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          sector?: string | null;
          description?: string | null;
          founded_year?: number | null;
          employees_count?: number | null;
          revenue?: number | null;
          website?: string | null;
          headquarters?: string | null;
          logo_url?: string | null;
          status?: "active" | "inactive" | "pending";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          sector?: string | null;
          description?: string | null;
          founded_year?: number | null;
          employees_count?: number | null;
          revenue?: number | null;
          website?: string | null;
          headquarters?: string | null;
          logo_url?: string | null;
          status?: "active" | "inactive" | "pending";
          created_at?: string;
          updated_at?: string;
        };
      };
      developments: {
        Row: {
          id: string;
          company_id: string | null;
          title: string;
          content: string;
          source: string | null;
          source_url: string | null;
          category:
            | "news"
            | "investment"
            | "expansion"
            | "partnership"
            | "other";
          sentiment: "positive" | "negative" | "neutral" | null;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          title: string;
          content: string;
          source?: string | null;
          source_url?: string | null;
          category?:
            | "news"
            | "investment"
            | "expansion"
            | "partnership"
            | "other";
          sentiment?: "positive" | "negative" | "neutral" | null;
          published_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          title?: string;
          content?: string;
          source?: string | null;
          source_url?: string | null;
          category?:
            | "news"
            | "investment"
            | "expansion"
            | "partnership"
            | "other";
          sentiment?: "positive" | "negative" | "neutral" | null;
          published_at?: string;
          created_at?: string;
        };
      };
      economic_indicators: {
        Row: {
          id: string;
          date: string;
          unemployment_rate: number | null;
          gdp_growth: number | null;
          inflation_rate: number | null;
          job_growth: number | null;
          median_income: number | null;
          housing_starts: number | null;
          retail_sales_growth: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          unemployment_rate?: number | null;
          gdp_growth?: number | null;
          inflation_rate?: number | null;
          job_growth?: number | null;
          median_income?: number | null;
          housing_starts?: number | null;
          retail_sales_growth?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          unemployment_rate?: number | null;
          gdp_growth?: number | null;
          inflation_rate?: number | null;
          job_growth?: number | null;
          median_income?: number | null;
          housing_starts?: number | null;
          retail_sales_growth?: number | null;
          created_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          started_at: string;
          ended_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          metadata?: Json | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: "user" | "assistant" | "system";
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: "user" | "assistant" | "system";
          content?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      investments: {
        Row: {
          id: string;
          company_id: string;
          investor_name: string | null;
          amount: number;
          round_type: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          investor_name?: string | null;
          amount: number;
          round_type?: string | null;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string;
          investor_name?: string | null;
          amount?: number;
          round_type?: string | null;
          date?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
