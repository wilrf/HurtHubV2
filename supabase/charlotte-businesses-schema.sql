-- Charlotte Economic Development Platform - Business Database Schema
-- Based on improvedDemoData.json structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS business_metrics CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS economic_indicators CASCADE;
DROP TABLE IF EXISTS developments CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- Main businesses table matching improvedDemoData.json structure
CREATE TABLE businesses (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  naics VARCHAR(50),
  industry VARCHAR(255),
  employee_size_category VARCHAR(100),
  
  -- Address fields
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100) DEFAULT 'CHARLOTTE',
  state VARCHAR(2) DEFAULT 'NC',
  
  -- NAICS hierarchy
  naics2 VARCHAR(50),
  naics3 VARCHAR(50),
  naics4 VARCHAR(50),
  
  -- Business details
  business_type VARCHAR(100),
  cluster VARCHAR(255),
  year_established INTEGER,
  owner VARCHAR(255),
  phone VARCHAR(50),
  employees INTEGER,
  revenue DECIMAL(15,2),
  revenue_per_employee DECIMAL(15,2),
  neighborhood VARCHAR(255),
  
  -- Operating details
  square_footage INTEGER,
  rent_per_month DECIMAL(10,2),
  utilities_per_month DECIMAL(10,2),
  payroll_per_month DECIMAL(12,2),
  operating_margin DECIMAL(5,2),
  
  -- Business hours
  hours_monday VARCHAR(50),
  hours_tuesday VARCHAR(50),
  hours_wednesday VARCHAR(50),
  hours_thursday VARCHAR(50),
  hours_friday VARCHAR(50),
  hours_saturday VARCHAR(50),
  hours_sunday VARCHAR(50),
  
  -- Customer metrics
  avg_customer_spend DECIMAL(10,2),
  monthly_customers INTEGER,
  customer_rating DECIMAL(3,2),
  review_count INTEGER,
  
  -- Seasonal data
  peak_season VARCHAR(100),
  q1_revenue_pct DECIMAL(5,2),
  q2_revenue_pct DECIMAL(5,2),
  q3_revenue_pct DECIMAL(5,2),
  q4_revenue_pct DECIMAL(5,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Business metrics table for time-series data
CREATE TABLE business_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id VARCHAR(50) REFERENCES businesses(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  revenue DECIMAL(15,2),
  customers INTEGER,
  employees INTEGER,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Economic indicators table
CREATE TABLE economic_indicators (
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

-- Developments/News table
CREATE TABLE developments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_id VARCHAR(50) REFERENCES businesses(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  source VARCHAR(255),
  source_url VARCHAR(500),
  category VARCHAR(50) DEFAULT 'news',
  sentiment VARCHAR(20),
  published_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Chat sessions for AI assistant
CREATE TABLE chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_businesses_name ON businesses(name);
CREATE INDEX idx_businesses_industry ON businesses(industry);
CREATE INDEX idx_businesses_neighborhood ON businesses(neighborhood);
CREATE INDEX idx_businesses_cluster ON businesses(cluster);
CREATE INDEX idx_businesses_naics ON businesses(naics);
CREATE INDEX idx_businesses_year_established ON businesses(year_established);

CREATE INDEX idx_business_metrics_business_id ON business_metrics(business_id);
CREATE INDEX idx_business_metrics_date ON business_metrics(metric_date);

CREATE INDEX idx_developments_business_id ON developments(business_id);
CREATE INDEX idx_developments_published_at ON developments(published_at);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Enable Row Level Security
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON businesses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON business_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON economic_indicators FOR SELECT USING (true);
CREATE POLICY "Public read access" ON developments FOR SELECT USING (true);

-- Chat policies
CREATE POLICY "Users can create chat sessions" ON chat_sessions 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read chat sessions" ON chat_sessions 
  FOR SELECT USING (true);
CREATE POLICY "Users can create chat messages" ON chat_messages 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can read chat messages" ON chat_messages 
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for businesses table
CREATE TRIGGER update_businesses_updated_at 
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample economic indicators for Charlotte
INSERT INTO economic_indicators (date, unemployment_rate, gdp_growth, inflation_rate, job_growth, median_income, housing_starts, retail_sales_growth)
VALUES 
  (CURRENT_DATE, 3.2, 2.8, 2.3, 5200, 68000, 1250, 3.5),
  (CURRENT_DATE - INTERVAL '1 month', 3.3, 2.7, 2.4, 4800, 67500, 1180, 3.2),
  (CURRENT_DATE - INTERVAL '2 months', 3.4, 2.6, 2.5, 4500, 67000, 1100, 3.0);

-- Sample news for Charlotte businesses
INSERT INTO developments (title, content, source, category, sentiment)
VALUES 
  ('Charlotte Ranks #2 for Business Growth in Southeast', 'Charlotte continues to attract major corporations and startups, ranking second in the Southeast for business growth...', 'Charlotte Business Journal', 'news', 'positive'),
  ('New Tech Hub Opens in South End', 'A new 50,000 square foot tech hub has opened in South End, expected to bring 500+ jobs...', 'Charlotte Observer', 'expansion', 'positive'),
  ('Local Restaurants See Record Sales', 'Charlotte restaurants report record sales as downtown foot traffic increases...', 'WBTV', 'news', 'positive');