# Agent 1 - Business Core & Adapter Implementation

## 🎯 Your Mission
You are responsible for creating the BusinessAdapter service and updating the main businesses API endpoint. This is the most complex task as you're establishing the pattern all other APIs will follow.

## 📁 Files You Own
1. **CREATE:** `src/services/BusinessAdapter.ts` (New file)
2. **UPDATE:** `api/businesses.ts` (Heavy modifications)

---

## 📝 Task 1: Create BusinessAdapter Service

### File: `src/services/BusinessAdapter.ts` (CREATE NEW)

Create this complete file:

```typescript
// src/services/BusinessAdapter.ts
/**
 * BusinessAdapter - Transforms businesses table data to maintain API compatibility
 * while exposing new rich data from the businesses table
 */

export class BusinessAdapter {
  /**
   * Transform a single business record from businesses table to API format
   */
  static toCompatibleFormat(business: any) {
    if (!business) return null;
    
    return {
      // === Core Identity Fields ===
      id: business.id,
      name: business.name,
      
      // === Industry/Classification ===
      industry: business.industry || 'Other',
      sector: business.cluster || business.industry || 'General', // Synthesized
      businessType: business.business_type,
      naics: business.naics,
      naicsClassification: {
        primary: business.naics,
        level2: business.naics2,
        level3: business.naics3,
        level4: business.naics4
      },
      
      // === Basic Business Info (with field mapping) ===
      employees: business.employees || 0,
      employees_count: business.employees || 0, // Backward compatibility
      revenue: business.revenue || 0,
      yearEstablished: business.year_established,
      founded_year: business.year_established, // Backward compatibility
      owner: business.owner,
      phone: business.phone,
      
      // === Location Data ===
      headquarters: business.city && business.state 
        ? `${business.city}, ${business.state}`
        : 'Charlotte, NC',
      address: {
        line1: business.address_line1 || '',
        line2: business.address_line2 || '',
        city: business.city || 'Charlotte',
        state: business.state || 'NC',
        neighborhood: business.neighborhood || ''
      },
      
      // === Synthesized/Default Fields (for compatibility) ===
      description: business.description || 
        `${business.name} is a ${business.industry || 'business'} company` +
        (business.neighborhood ? ` located in ${business.neighborhood}` : '') +
        (business.year_established ? `, established in ${business.year_established}` : ''),
      status: 'active', // All records assumed active
      website: business.website || null,
      logo_url: business.logo_url || null,
      
      // === Customer & Ratings ===
      rating: business.customer_rating || 0,
      reviewCount: business.review_count || 0,
      customerMetrics: {
        avgSpend: business.avg_customer_spend,
        monthlyCustomers: business.monthly_customers,
        rating: business.customer_rating,
        reviewCount: business.review_count
      },
      
      // === Financial Metrics ===
      financialMetrics: {
        revenue: business.revenue,
        revenuePerEmployee: business.revenue_per_employee,
        operatingMargin: business.operating_margin,
        monthlyRent: business.rent_per_month,
        monthlyUtilities: business.utilities_per_month,
        monthlyPayroll: business.payroll_per_month,
        squareFootage: business.square_footage
      },
      
      // === Operational Hours ===
      hours: {
        monday: business.hours_monday,
        tuesday: business.hours_tuesday,
        wednesday: business.hours_wednesday,
        thursday: business.hours_thursday,
        friday: business.hours_friday,
        saturday: business.hours_saturday,
        sunday: business.hours_sunday
      },
      
      // === Seasonal Data ===
      seasonalData: {
        peakSeason: business.peak_season,
        q1RevenuePct: business.q1_revenue_pct,
        q2RevenuePct: business.q2_revenue_pct,
        q3RevenuePct: business.q3_revenue_pct,
        q4RevenuePct: business.q4_revenue_pct
      },
      
      // === Metadata ===
      created_at: business.created_at,
      updated_at: business.updated_at,
      
      // === Keep original fields that don't map ===
      employeeSizeCategory: business.employee_size_category,
      sourceId: business.source_id,
      parentCompanyId: business.parent_company_id
    };
  }
  
  /**
   * Transform array of businesses
   */
  static toCompatibleFormatArray(businesses: any[]) {
    if (!businesses || !Array.isArray(businesses)) return [];
    return businesses.map(b => this.toCompatibleFormat(b));
  }
  
  /**
   * Extract filter options from businesses for UI
   */
  static extractFilterOptions(businesses: any[]) {
    const industries = [...new Set(businesses.map(b => b.industry).filter(Boolean))];
    const neighborhoods = [...new Set(businesses.map(b => b.neighborhood).filter(Boolean))];
    const businessTypes = [...new Set(businesses.map(b => b.business_type).filter(Boolean))];
    
    return {
      industries: industries.sort(),
      neighborhoods: neighborhoods.sort(),
      businessTypes: businessTypes.sort(),
      sizeCategories: [
        '1-10 employees',
        '11-50 employees', 
        '51-200 employees',
        '201-500 employees',
        '500+ employees'
      ]
    };
  }
}

export default BusinessAdapter;
```

---

## 📝 Task 2: Update api/businesses.ts

### File: `api/businesses.ts` (UPDATE)

**IMPORTANT LINE-BY-LINE CHANGES:**

### Lines 138-148: Update query and remove status filter
```typescript
// OLD (lines 138-148):
let query = supabase
  .from("companies")
  .select(`
    id, name, industry, sector, description, founded_year, 
    employees_count, revenue, website, headquarters, logo_url, 
    status, created_at, updated_at,
    features, metrics, ext_financials,
    addresses:address_id (id, line1, line2, city, state, zip_code, latitude, longitude),
    reviews:reviews (id, reviewer, rating, comment, reviewed_at)
  `)
  .eq("status", "active");

// NEW - REPLACE WITH:
let query = supabase
  .from("businesses")
  .select('*'); // Get all fields, we'll transform with adapter
  
// Remove the .eq("status", "active") - no status field exists
```

### Lines 151-156: Simplify industry filter
```typescript
// OLD:
if (filters.industry && filters.industry.length > 0) {
  const industryConditions = filters.industry
    .map((ind: string) => `industry.ilike.%${ind}%`)
    .join(",");
  query = query.or(industryConditions);
}

// NEW - KEEP SAME (it's already correct)
```

### Lines 158-166: Update location filter
```typescript
// OLD:
if (filters.location && filters.location.length > 0) {
  const locationConditions = filters.location
    .map((loc: string) => 
      `addresses.city.ilike.%${loc}%,addresses.state.ilike.%${loc}%,headquarters.ilike.%${loc}%`
    )
    .join(",");
  query = query.or(locationConditions);
}

// NEW - REPLACE WITH:
if (filters.location && filters.location.length > 0) {
  const locationConditions = filters.location
    .map((loc: string) => 
      `city.ilike.%${loc}%,state.ilike.%${loc}%,neighborhood.ilike.%${loc}%`
    )
    .join(",");
  query = query.or(locationConditions);
}
```

### Lines 168-173: Remove description from search
```typescript
// OLD:
if (filters.query) {
  const searchTerm = filters.query.trim();
  query = query.or(
    `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`,
  );
}

// NEW - REPLACE WITH:
if (filters.query) {
  const searchTerm = filters.query.trim();
  query = query.or(
    `name.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%,business_type.ilike.%${searchTerm}%`
  );
}
```

### Lines 183-187: Update employee field names
```typescript
// OLD:
if (filters.minEmployees) {
  query = query.gte("employees_count", filters.minEmployees);
}
if (filters.maxEmployees) {
  query = query.lte("employees_count", filters.maxEmployees);
}

// NEW - REPLACE WITH:
if (filters.minEmployees) {
  query = query.gte("employees", filters.minEmployees);
}
if (filters.maxEmployees) {
  query = query.lte("employees", filters.maxEmployees);
}
```

### Lines 190-197: Update sort fields
```typescript
// OLD:
const validSortFields = [
  "name",
  "industry",
  "revenue",
  "employees_count",
  "founded_year",
  "created_at",
];

// NEW - REPLACE WITH:
const validSortFields = [
  "name",
  "industry", 
  "revenue",
  "employees",  // Changed from employees_count
  "year_established",  // Changed from founded_year
  "created_at",
];
```

### Lines 222-230: Transform data with adapter
```typescript
// OLD:
return {
  businesses: (data || []).map(transformBusinessData),
  total: count || 0,
  page,
  limit,
  totalPages: Math.ceil((count || 0) / limit),
  filters: filterOptions,
  analytics,
  source: "database",
};

// NEW - REPLACE WITH:
// Import the adapter at the top of the file
import { BusinessAdapter } from '../src/services/BusinessAdapter';

return {
  businesses: BusinessAdapter.toCompatibleFormatArray(data || []),
  total: count || 0,
  page,
  limit,
  totalPages: Math.ceil((count || 0) / limit),
  filters: BusinessAdapter.extractFilterOptions(data || []),
  analytics,
  source: "database",
};
```

### Lines 233-329: Remove or simplify transform function
```typescript
// DELETE the entire transformBusinessData function (lines 233-329)
// We're using BusinessAdapter.toCompatibleFormat instead
```

### Lines 331-340: Update getFilterOptions function
```typescript
// Find the getFilterOptions function and update the table reference:

// OLD:
const { data: industries } = await supabase
  .from("companies")
  .select("industry")

// NEW:
const { data: industries } = await supabase
  .from("businesses")
  .select("industry")
```

### Lines 375-380: Update getBusinessAnalytics function
```typescript
// Find the getBusinessAnalytics function and update:

// OLD:
let analyticsQuery = supabase
  .from("companies")
  .select(`...

// NEW:
let analyticsQuery = supabase
  .from("businesses")
  .select('revenue, employees, industry, year_established, customer_rating')
```

---

## 🎯 Testing Your Changes

After making these changes, run:

```bash
# 1. Type check your changes
npm run typecheck

# 2. If errors, fix them before proceeding
# 3. Update EXECUTION_LOG.md with your status
```

---

## ⚠️ Common Issues to Watch For

1. **Import paths**: Make sure BusinessAdapter import path is correct
2. **Type errors**: The adapter handles all type conversions
3. **Missing fields**: Adapter provides defaults for non-existent fields
4. **Query syntax**: Supabase queries are sensitive to syntax

---

## 📊 Progress Tracking

Update EXECUTION_LOG.md after:
1. Creating BusinessAdapter.ts
2. Updating api/businesses.ts
3. Running type check
4. Completing all tasks

---

## 🚨 If You Get Stuck

1. Check SHARED_REFERENCE.md for field mappings
2. The adapter handles ALL transformations - don't transform in the API
3. If a field doesn't exist in businesses table, the adapter provides a default
4. Report blockers in EXECUTION_LOG.md immediately

---

## ✅ Definition of Done

- [ ] BusinessAdapter.ts created and exports properly
- [ ] api/businesses.ts updated with all changes above
- [ ] No TypeScript errors when running `npm run typecheck`
- [ ] Status updated in EXECUTION_LOG.md
- [ ] Ready for integration with other agents' work