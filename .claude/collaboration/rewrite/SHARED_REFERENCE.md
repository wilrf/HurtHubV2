# Shared Reference - Architecture Patterns & Field Mappings

## 🏛️ Architecture Patterns

### Clean Architecture Layers
```
UI (React Components)
    ↓
API Layer (Vercel Functions) - Thin HTTP controllers
    ↓
Service Layer - ALL business logic here
    ↓
Repository Layer - Data access interfaces
    ↓
Domain Layer - Business entities
    ↓
Database (Supabase/PostgreSQL)
```

### Key Principles
1. **No direct database access in APIs** - Use services
2. **No business logic in repositories** - Only data access
3. **No business logic in APIs** - Only HTTP handling
4. **Let errors bubble** - No unnecessary try-catch
5. **Domain entities transform data** - Business.fromDatabase()

## 🗺️ Critical Field Mappings

### Direct Renamings (Simple)
| OLD (Expected) | NEW (Actual in businesses) | Notes |
|----------------|---------------------------|--------|
| `employees_count` | `employees` | Direct rename |
| `founded_year` | `year_established` | Direct rename |
| Table: `companies` | Table: `businesses` | Table renamed |

### Missing Fields (Need Defaults/Synthesis)
| Expected Field | Solution | Default Value |
|----------------|----------|---------------|
| `sector` | Use `cluster` or `industry` | `industry` value |
| `description` | Generate from other fields | `"[name] is a [industry] company in [neighborhood/city]"` |
| `headquarters` | Concatenate city + state | `"${city}, ${state}"` |
| `website` | Doesn't exist | `null` |
| `logo_url` | Doesn't exist | `null` |
| `status` | Doesn't exist | `"active"` (assume all active) |
| `features` | Doesn't exist | `null` or `{}` |
| `metrics` | Doesn't exist | `null` or `{}` |
| `ext_financials` | Doesn't exist | `null` or `{}` |
| `address_id` | No foreign key | Remove JOINs |

### Fields with Different Structure
| Old Structure | New Structure | Transformation |
|---------------|---------------|----------------|
| Single `headquarters` string | Separate `address_line1`, `address_line2`, `city`, `state` | Concatenate for display |
| `addresses` JOIN | Direct fields in businesses table | No JOIN needed |
| `reviews` JOIN | No foreign key relationship | Remove JOIN |

---

## 📊 Complete Businesses Table Schema

```sql
businesses table columns (47 total):
1. id (varchar) - Primary key
2. name (varchar)
3. naics (varchar, nullable) - Industry code
4. industry (varchar, nullable)
5. employee_size_category (varchar, nullable)
6. address_line1 (varchar, nullable)
7. address_line2 (varchar, nullable)
8. city (varchar, nullable, default: 'CHARLOTTE')
9. state (varchar, nullable, default: 'NC')
10. naics2 (varchar, nullable)
11. naics3 (varchar, nullable)
12. naics4 (varchar, nullable)
13. business_type (varchar, nullable)
14. cluster (varchar, nullable)
15. year_established (integer, nullable)
16. owner (varchar, nullable)
17. phone (varchar, nullable)
18. employees (integer, nullable)
19. revenue (numeric, nullable)
20. revenue_per_employee (numeric, nullable)
21. neighborhood (varchar, nullable)
22. square_footage (integer, nullable)
23. rent_per_month (numeric, nullable)
24. utilities_per_month (numeric, nullable)
25. payroll_per_month (numeric, nullable)
26. operating_margin (numeric, nullable)
27. hours_monday (varchar, nullable)
28. hours_tuesday (varchar, nullable)
29. hours_wednesday (varchar, nullable)
30. hours_thursday (varchar, nullable)
31. hours_friday (varchar, nullable)
32. hours_saturday (varchar, nullable)
33. hours_sunday (varchar, nullable)
34. avg_customer_spend (numeric, nullable)
35. monthly_customers (integer, nullable)
36. customer_rating (numeric, nullable)
37. review_count (integer, nullable)
38. peak_season (varchar, nullable)
39. q1_revenue_pct (numeric, nullable)
40. q2_revenue_pct (numeric, nullable)
41. q3_revenue_pct (numeric, nullable)
42. q4_revenue_pct (numeric, nullable)
43. created_at (timestamptz, nullable, default: now())
44. updated_at (timestamptz, nullable, default: now())
45. embedding (vector, nullable) - For semantic search!
46. source_id (text, nullable)
47. parent_company_id (text, nullable)
```

---

## 🔍 Query Pattern Changes

### Remove These Patterns
```typescript
// ❌ NO status filter - field doesn't exist
.eq("status", "active")

// ❌ NO JOINs - no foreign keys
.select(`
  ...,
  addresses:address_id (...),
  reviews:reviews (...)
`)

// ❌ NO description searches - field doesn't exist
`description.ilike.%${search}%`
```

### Use These Instead
```typescript
// ✅ Get all fields
.select('*')

// ✅ Location search on actual fields
`city.ilike.%${search}%,state.ilike.%${search}%,neighborhood.ilike.%${search}%`

// ✅ Search on available fields
`name.ilike.%${search}%,industry.ilike.%${search}%,business_type.ilike.%${search}%`
```

---

## 🎯 Domain Entity Pattern

**ALL AGENTS: Use Domain Entities, NOT BusinessAdapter**

```typescript
import { Business } from '../core/domain/entities/Business';

// Transform database record to domain entity
const business = Business.fromDatabase(dbRecord);

// Transform array
const businesses = dbRecords.map(Business.fromDatabase);

// Convert to API response
const response = business.toJSON();
```

The domain entity handles:
- Field mapping (DB `employees` → Domain `employeeCount`)
- Business logic (methods like `getAgeInYears()`)
- Type safety (proper TypeScript classes)
- Clean separation (no database concerns in domain)

---

## 💡 Architecture Decision Rules

1. **Need data?** → Use repository through service
2. **Business logic?** → Put in service layer
3. **Data transformation?** → Use domain entity
4. **HTTP handling?** → Keep in API layer only
5. **Error occurred?** → Let it bubble up

---

## 🚨 Architecture Anti-Patterns to Avoid

1. ❌ Direct Supabase queries in APIs
2. ❌ Business logic in repositories
3. ❌ Business logic in API handlers
4. ❌ Try-catch for flow control
5. ❌ BusinessAdapter pattern (use domain entities)
6. ❌ Mixing concerns between layers

---

## ✅ Architecture Validation Checklist

For each file you update:
- [ ] APIs use services (not repositories directly)
- [ ] Services use repositories (not Supabase directly)
- [ ] Repositories return domain entities
- [ ] No business logic in APIs
- [ ] No business logic in repositories
- [ ] Errors bubble up (no unnecessary try-catch)
- [ ] Domain entities handle transformations
- [ ] Type check passes

---

## 📚 Resources

- **Businesses table**: 294 rows, has embeddings
- **Companies table**: DOES NOT EXIST
- **Addresses table**: Exists but no foreign key to businesses
- **Reviews table**: Exists but incompatible ID types

---

## 🔧 Testing Queries

Use these to verify your changes work:

```typescript
// Test basic query
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .limit(5);

// Test with filters
const { data, error } = await supabase
  .from('businesses')
  .select('*')
  .gte('employees', 10)
  .ilike('industry', '%technology%');

// Test semantic search RPC (after SQL migration)
const { data, error } = await supabase.rpc('semantic_business_search', {
  query_embedding: [/* 1536 dimension vector */],
  limit_count: 10
});
```