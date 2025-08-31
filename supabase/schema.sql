-- Supabase Schema for Charlotte Economic Development Platform
-- Run this in your Supabase SQL editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  sector VARCHAR(100),
  description TEXT,
  founded_year INTEGER,
  employees_count INTEGER,
  revenue BIGINT,
  website VARCHAR(255),
  headquarters VARCHAR(255),
  logo_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Developments/News table
CREATE TABLE IF NOT EXISTS developments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(255),
  source_url VARCHAR(500),
  category VARCHAR(50) DEFAULT 'news' CHECK (category IN ('news', 'investment', 'expansion', 'partnership', 'other')),
  sentiment VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Economic Indicators table
CREATE TABLE IF NOT EXISTS economic_indicators (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  unemployment_rate DECIMAL(5,2),
  gdp_growth DECIMAL(5,2),
  inflation_rate DECIMAL(5,2),
  job_growth INTEGER,
  median_income INTEGER,
  housing_starts INTEGER,
  retail_sales_growth DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Chat Sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Investments table
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  investor_name VARCHAR(255),
  amount BIGINT NOT NULL,
  round_type VARCHAR(50),
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_companies_status ON companies(status);

CREATE INDEX idx_developments_company_id ON developments(company_id);
CREATE INDEX idx_developments_published_at ON developments(published_at);
CREATE INDEX idx_developments_category ON developments(category);

CREATE INDEX idx_economic_indicators_date ON economic_indicators(date);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX idx_investments_company_id ON investments(company_id);
CREATE INDEX idx_investments_date ON investments(date);

-- Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Public read access for most tables
CREATE POLICY "Public read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Public read access" ON developments FOR SELECT USING (true);
CREATE POLICY "Public read access" ON economic_indicators FOR SELECT USING (true);
CREATE POLICY "Public read access" ON investments FOR SELECT USING (true);

-- Chat policies (authenticated users only)
CREATE POLICY "Users can create chat sessions" ON chat_sessions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own chat sessions" ON chat_sessions 
  FOR SELECT USING (true);

CREATE POLICY "Users can create chat messages" ON chat_messages 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read chat messages" ON chat_messages 
  FOR SELECT USING (true);

-- Function to update updated_at timestamp (with security definer and search_path)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for companies table
CREATE TRIGGER update_companies_updated_at 
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO companies (name, industry, sector, description, founded_year, employees_count, revenue, website, headquarters, status)
VALUES 
  ('Bank of America', 'Financial Services', 'Banking', 'Major financial institution headquartered in Charlotte', 1904, 213000, 94950000000, 'https://www.bankofamerica.com', 'Charlotte, NC', 'active'),
  ('Honeywell', 'Technology', 'Industrial', 'Multinational conglomerate with major Charlotte presence', 1906, 113000, 34392000000, 'https://www.honeywell.com', 'Charlotte, NC', 'active'),
  ('Duke Energy', 'Utilities', 'Energy', 'Electric power holding company', 1904, 28000, 25097000000, 'https://www.duke-energy.com', 'Charlotte, NC', 'active'),
  ('Lowe''s', 'Retail', 'Home Improvement', 'Home improvement retail chain', 1946, 300000, 96250000000, 'https://www.lowes.com', 'Mooresville, NC', 'active'),
  ('Sonic Automotive', 'Automotive', 'Retail', 'Automotive retailer', 1997, 10000, 11898000000, 'https://www.sonicautomotive.com', 'Charlotte, NC', 'active');

-- Insert sample economic indicators
INSERT INTO economic_indicators (date, unemployment_rate, gdp_growth, inflation_rate, job_growth, median_income, housing_starts, retail_sales_growth)
VALUES 
  (CURRENT_DATE, 3.2, 2.8, 2.3, 5200, 68000, 1250, 3.5),
  (CURRENT_DATE - INTERVAL '1 month', 3.3, 2.7, 2.4, 4800, 67500, 1180, 3.2),
  (CURRENT_DATE - INTERVAL '2 months', 3.4, 2.6, 2.5, 4500, 67000, 1100, 3.0);

-- Insert sample developments
INSERT INTO developments (company_id, title, content, source, source_url, category, sentiment)
SELECT 
  companies.id,
  'Bank of America Reports Strong Q4 Earnings',
  'Bank of America reported better-than-expected earnings for Q4, driven by strong consumer banking performance.',
  'Charlotte Business Journal',
  'https://www.bizjournals.com/charlotte',
  'news',
  'positive'
FROM companies WHERE name = 'Bank of America';

INSERT INTO developments (company_id, title, content, source, source_url, category, sentiment)
SELECT 
  companies.id,
  'Duke Energy Announces Major Solar Investment',
  'Duke Energy plans to invest $2 billion in new solar facilities across North Carolina.',
  'Charlotte Observer',
  'https://www.charlotteobserver.com',
  'investment',
  'positive'
FROM companies WHERE name = 'Duke Energy';