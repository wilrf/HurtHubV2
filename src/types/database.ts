// Database types for Supabase tables
export interface ChatSession {
  id?: string;
  user_id?: string;
  started_at?: string;
  ended_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id?: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: ChatSession;
        Insert: ChatSession;
        Update: Partial<ChatSession>;
      };
      chat_messages: {
        Row: ChatMessage;
        Insert: ChatMessage;
        Update: Partial<ChatMessage>;
      };
      businesses: {
        Row: any;
        Insert: any;
        Update: any;
      };
      developments: {
        Row: any;
        Insert: any;
        Update: any;
      };
      economic_indicators: {
        Row: any;
        Insert: any;
        Update: any;
      };
    };
  };
}
