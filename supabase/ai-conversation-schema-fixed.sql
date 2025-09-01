-- AI Conversation Memory Schema for GPT-5 Integration
-- This schema stores conversation history, context, and enables semantic search

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Main conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  embeddings vector(3072)[], -- Array of embeddings for each message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_id ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_created_at ON ai_conversations(created_at DESC);

-- Session summaries table for quick context retrieval
CREATE TABLE IF NOT EXISTS ai_session_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  summary TEXT,
  last_summary TEXT,
  key_topics TEXT[],
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  total_messages INTEGER DEFAULT 0,
  first_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_summary_session ON ai_session_summaries(session_id);
CREATE INDEX IF NOT EXISTS idx_summary_user ON ai_session_summaries(user_id);

-- User preferences and learned patterns
CREATE TABLE IF NOT EXISTS ai_user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  preferences JSONB DEFAULT '{}',
  learned_patterns JSONB DEFAULT '{}',
  favorite_topics TEXT[],
  interaction_style VARCHAR(50),
  language_preference VARCHAR(10) DEFAULT 'en',
  model_preference VARCHAR(50) DEFAULT 'gpt-5',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and insights table
CREATE TABLE IF NOT EXISTS ai_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type VARCHAR(50) NOT NULL,
  input_data JSONB NOT NULL,
  analysis_result JSONB NOT NULL,
  insights JSONB,
  model_used VARCHAR(50),
  tokens_used INTEGER,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_session ON ai_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON ai_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON ai_analytics(analysis_type);

-- Feedback and ratings for continuous improvement
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(255),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id VARCHAR(255),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON ai_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON ai_feedback(rating);

-- Context cache for performance optimization
CREATE TABLE IF NOT EXISTS ai_context_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  context_data JSONB NOT NULL,
  embeddings vector(3072),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_count INTEGER DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON ai_context_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON ai_context_cache(expires_at);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_session_summaries_updated_at ON ai_session_summaries;
CREATE TRIGGER update_ai_session_summaries_updated_at
  BEFORE UPDATE ON ai_session_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_user_preferences_updated_at ON ai_user_preferences;
CREATE TRIGGER update_ai_user_preferences_updated_at
  BEFORE UPDATE ON ai_user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic search using vector similarity
CREATE OR REPLACE FUNCTION search_similar_conversations(
  query_embedding vector(3072),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  session_id VARCHAR(255),
  messages JSONB,
  similarity FLOAT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.session_id,
    c.messages,
    1 - (c.embeddings[1] <=> query_embedding) AS similarity,
    c.created_at
  FROM ai_conversations c
  WHERE 1 - (c.embeddings[1] <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM ai_context_cache
  WHERE expires_at < NOW();
END;
$$;

-- Row Level Security (RLS) Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_session_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for ai_conversations
CREATE POLICY "Users can view their own conversations"
  ON ai_conversations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own conversations"
  ON ai_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own conversations"
  ON ai_conversations FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies for ai_session_summaries
CREATE POLICY "Users can view their own summaries"
  ON ai_session_summaries FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage their own summaries"
  ON ai_session_summaries FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policies for ai_user_preferences
CREATE POLICY "Users can view their own preferences"
  ON ai_user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences"
  ON ai_user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Policies for ai_analytics
CREATE POLICY "Users can view their own analytics"
  ON ai_analytics FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own analytics"
  ON ai_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policies for ai_feedback
CREATE POLICY "Users can manage their own feedback"
  ON ai_feedback FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for vector similarity search (if extension supports it)
-- Note: These may need adjustment based on your Supabase plan and vector extension version
-- CREATE INDEX idx_conversation_embeddings ON ai_conversations 
--   USING ivfflat (embeddings[1] vector_cosine_ops)
--   WITH (lists = 100);

-- CREATE INDEX idx_cache_embeddings ON ai_context_cache 
--   USING ivfflat (embeddings vector_cosine_ops)
--   WITH (lists = 50);

-- Grant permissions
GRANT ALL ON ai_conversations TO authenticated;
GRANT ALL ON ai_session_summaries TO authenticated;
GRANT ALL ON ai_user_preferences TO authenticated;
GRANT ALL ON ai_analytics TO authenticated;
GRANT ALL ON ai_feedback TO authenticated;
GRANT SELECT ON ai_context_cache TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;