-- Rich Company Schema Migration
-- Adds structured addresses, reviews, and JSONB columns for enhanced business data
-- Compatible with existing UUID-based companies table

-- Normalized address table
CREATE TABLE IF NOT EXISTS addresses (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  line1       TEXT NOT NULL,
  line2       TEXT,
  city        TEXT NOT NULL,
  state       TEXT NOT NULL,
  zip_code    TEXT,
  latitude    NUMERIC,
  longitude   NUMERIC,
  UNIQUE(line1, city, state, zip_code)
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  reviewer    TEXT,
  rating      NUMERIC,
  comment     TEXT,
  reviewed_at DATE
);

-- Extend companies table with rich data columns
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS external_id    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS address_id     BIGINT REFERENCES addresses(id),
  ADD COLUMN IF NOT EXISTS features       JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metrics        JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ext_financials JSONB DEFAULT '{}'::jsonb;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS companies_industry_idx   ON companies(industry);
CREATE INDEX IF NOT EXISTS addresses_city_state_idx ON addresses(city, state);
CREATE INDEX IF NOT EXISTS reviews_company_idx      ON reviews(company_id);

-- Enable RLS for new tables to match existing pattern
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read access" ON addresses FOR SELECT USING (true);
CREATE POLICY "Public read access" ON reviews FOR SELECT USING (true);