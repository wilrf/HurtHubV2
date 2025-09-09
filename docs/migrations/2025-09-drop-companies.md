# Database Migration: companies → businesses

**Date:** 2025-09-07  
**Type:** Schema Cleanup (Irreversible)

## Summary
Dropped `companies` table and switched to using `businesses` as primary table for all business data.

## Background
- **Problem:** Schema confusion - semantic search expected data in empty `businesses` table while all data (509 rows) was in `companies` table
- **Root Cause:** `companies` table had UUID-based schema that didn't match canonical data structure
- **Solution:** Clean slate approach using `businesses` table that matches `improvedDemoData.json` structure

## Changes Made
1. **Dropped:** `companies` table entirely (509 rows of invalid/incomplete data)
2. **Primary Table:** `businesses` table now contains all business data
3. **Source Data:** `improvedDemoData.json` (294 canonical businesses with rich data)
4. **Schema:** VARCHAR-based IDs, structured NAICS hierarchy, JSONB for complex data

## Data Flow
- **Before:** improvedDemoData.json → companies table (schema mismatch, data loss)
- **After:** improvedDemoData.json → businesses table (perfect match, all data preserved)

## Impact
- **Frontend:** All references changed from "companies" to "businesses"
- **API:** Endpoints updated to query businesses table
- **Semantic Search:** Now queries businesses table where data actually exists
- **AI Features:** Improved responses due to rich canonical data (hours, reviews, operating costs, etc.)

## Validation
- ✅ 294 businesses imported successfully
- ✅ All canonical data preserved (NAICS, addresses, hours, financial data)
- ✅ Semantic search functional
- ✅ AI chat working with proper business data
- ✅ No "companies" references remaining in runtime code

## Notes for Future Developers
This was a fresh start migration for a pre-launch application with no users. The `companies` table contained invalid test data from previous schema iterations and was safely removed.