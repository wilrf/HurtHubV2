# Core Architecture Principles - Hurt Hub V2

## 🎯 Foundational Principles

These principles are **NON-NEGOTIABLE**. They represent decades of hard-won lessons in enterprise software development. Violating these principles leads to unmaintainable code, endless bugs, and eventual project failure.

---

## 1️⃣ Data Persistence: ORM-First, Always

### **The Principle**
All database access MUST go through an ORM (Object-Relational Mapper). Direct SQL queries and stored procedures are **FORBIDDEN**.

### **Why This Matters**
- **90-95% of data access code is repetitive** - ORMs automate this
- **Type safety** - ORMs provide compile-time checking
- **Database agnostic** - Switch databases without rewriting code
- **Automatic migrations** - Schema changes are versioned and tracked
- **Security** - Built-in SQL injection prevention

### **Implementation**

```typescript
// ✅ CORRECT - Using Supabase ORM
const { data: companies } = await supabase
  .from('companies')
  .select('*')
  .eq('industry', 'Technology')
  .order('revenue', { ascending: false });

// ❌ WRONG - Direct SQL (NEVER DO THIS)
const result = await db.query(
  'SELECT * FROM companies WHERE industry = $1 ORDER BY revenue DESC',
  ['Technology']
);

// ❌ CATASTROPHICALLY WRONG - Stored procedures
CREATE PROCEDURE GetTechCompanies AS
BEGIN
  SELECT * FROM companies WHERE industry = 'Technology'
END
```

### **The Rule**
**Any developer who prefers hand-written SQL to ORMs should be removed from the project.** This is not hyperbole - it's a fundamental misunderstanding of modern software development.

---

## 2️⃣ Business Logic: Domain-Driven Design

### **The Principle**
Business logic belongs in the **Service Layer**, never in UI components, never in database queries, never scattered throughout the codebase.

### **The Layers**

```
┌─────────────────────────────────────┐
│         Presentation Layer          │  ← React Components, Pages
│          (UI Logic Only)            │  ← NO business logic here
├─────────────────────────────────────┤
│        Application Service Layer    │  ← Use cases, orchestration
│         (Workflow Logic)            │  ← Coordinates domain services
├─────────────────────────────────────┤
│          Domain Layer               │  ← Business rules, entities
│       (Core Business Logic)         │  ← The heart of your application
├─────────────────────────────────────┤
│       Infrastructure Layer          │  ← Repositories, external services
│        (Data Persistence)           │  ← NO business logic here
└─────────────────────────────────────┘
```

### **Implementation**

```typescript
// ✅ CORRECT - Business logic in service
// src/core/services/CompanyAnalysisService.ts
export class CompanyAnalysisService {
  constructor(private companyRepo: ICompanyRepository) {}
  
  async analyzeCompanyHealth(companyId: string): Promise<HealthScore> {
    const company = await this.companyRepo.findById(companyId);
    
    // Business logic belongs here
    const revenueScore = this.calculateRevenueScore(company.revenue);
    const growthScore = this.calculateGrowthScore(company.yearOverYear);
    const marketScore = this.calculateMarketPosition(company);
    
    return new HealthScore(revenueScore, growthScore, marketScore);
  }
}

// ❌ WRONG - Business logic in React component
function CompanyCard({ company }) {
  // This calculation should be in a service!
  const healthScore = 
    (company.revenue / 1000000) * 0.3 +
    (company.employees / 100) * 0.3 +
    (company.yearFounded > 2015 ? 0.4 : 0.2);
    
  return <div>Health: {healthScore}</div>;
}

// ❌ WRONG - Business logic in SQL
SELECT 
  *,
  CASE 
    WHEN revenue > 1000000 THEN 'Large'
    WHEN revenue > 100000 THEN 'Medium'
    ELSE 'Small'
  END as company_size  -- Business logic in database!
FROM companies;
```

---

## 3️⃣ Repository Pattern: Single Responsibility for Data Access

### **The Principle**
Data persistence logic belongs in **Repositories** and nowhere else. Each repository has one responsibility: managing persistence for one aggregate root.

### **Implementation**

```typescript
// ✅ CORRECT - Repository pattern
// src/core/repositories/ICompanyRepository.ts
export interface ICompanyRepository {
  findById(id: string): Promise<Company>;
  findByIndustry(industry: string): Promise<Company[]>;
  save(company: Company): Promise<void>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/repositories/SupabaseCompanyRepository.ts
export class SupabaseCompanyRepository implements ICompanyRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Company> {
    const { data } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
      
    return Company.fromDatabase(data);
  }
  
  // Data access logic ONLY - no business logic
}

// ❌ WRONG - Data access scattered everywhere
// In a React component (NEVER DO THIS)
function CompanyList() {
  useEffect(() => {
    // Direct database access in component!
    const { data } = await supabase
      .from('companies')
      .select('*');
  }, []);
}
```

---

## 4️⃣ Exception Handling: Let It Fail

### **The Principle**
**DO NOT HANDLE EXCEPTIONS.** Let them bubble up to a global exception handler. Exceptions mean something is WRONG and needs to be fixed, not hidden.

### **Why Try-Catch is Usually Wrong**
- **Exceptions occur because**: A) Code is bad, or B) System is down
- **Either way**: The exception needs attention, not "handling"
- **Good code rarely uses try-catch** - Exceptions should cause alerts

### **Implementation**

```typescript
// ✅ CORRECT - Global exception handler
// src/core/exceptions/GlobalExceptionHandler.ts
export class GlobalExceptionHandler {
  static handle(error: Error, context: string) {
    // Log to monitoring service
    logger.error({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      user: getCurrentUser(),
    });
    
    // Alert ops team for critical errors
    if (error instanceof CriticalSystemError) {
      alertingService.triggerPagerDuty(error);
    }
    
    // Show user-friendly message
    return new ErrorResponse(
      "An unexpected error occurred. Our team has been notified.",
      error.id
    );
  }
}

// ✅ CORRECT - Let exceptions bubble up
export class CompanyService {
  async getCompany(id: string): Promise<Company> {
    // No try-catch! Let exceptions bubble up
    const company = await this.repository.findById(id);
    
    if (!company) {
      throw new CompanyNotFoundError(id);
    }
    
    return company;
  }
}

// ❌ WRONG - Swallowing exceptions
async function getCompany(id: string) {
  try {
    const company = await fetchCompany(id);
    return company;
  } catch (error) {
    // Hiding the problem!
    console.log('Error fetching company');
    return null;  // Now caller has to handle null
  }
}

// ❌ WRONG - Try-catch for flow control
async function processPayment(amount: number) {
  try {
    await chargeCard(amount);
    return { success: true };
  } catch (error) {
    // Using exceptions for business logic!
    return { success: false, reason: 'insufficient_funds' };
  }
}
```

### **When Try-Catch IS Appropriate**
Only use try-catch at system boundaries:
1. **API endpoints** - Convert exceptions to HTTP responses
2. **UI error boundaries** - Prevent entire app crash
3. **Background jobs** - Log and retry
4. **External service calls** - Handle network failures

---

## 5️⃣ Separation of Concerns: Everything Has Its Place

### **The Structure**

```
src/
├── core/                      # Domain layer (business logic)
│   ├── domain/               # Entities, value objects
│   │   ├── entities/        # Business entities
│   │   ├── valueObjects/    # Immutable values
│   │   └── aggregates/      # Aggregate roots
│   ├── services/            # Domain services (business logic)
│   ├── repositories/        # Repository interfaces (NOT implementations)
│   └── exceptions/          # Domain-specific exceptions
│
├── application/             # Application layer
│   ├── services/           # Application services (use cases)
│   ├── dto/               # Data transfer objects
│   └── mappers/           # DTO ↔ Domain mappers
│
├── infrastructure/         # Infrastructure layer
│   ├── repositories/      # Repository implementations
│   ├── external/         # External service integrations
│   ├── persistence/      # Database configuration
│   └── logging/         # Logging implementation
│
├── presentation/          # Presentation layer
│   ├── components/       # React components (UI only)
│   ├── pages/           # Page components
│   ├── hooks/           # React hooks (UI state only)
│   └── utils/           # UI utilities
│
└── api/                  # API layer
    ├── routes/          # API routes
    ├── middleware/      # Express/Fastify middleware
    └── handlers/        # Request handlers
```

### **What Goes Where**

| Logic Type | Location | Example |
|------------|----------|---------|
| Business rules | Domain services | `CompanyValuationService.calculateValue()` |
| Data validation | Domain entities | `Company.validateRevenue()` |
| Use case orchestration | Application services | `CreateCompanyUseCase.execute()` |
| Data persistence | Repositories | `CompanyRepository.save()` |
| External API calls | Infrastructure services | `OpenAIService.generateResponse()` |
| UI state management | React hooks | `useCompanySearch()` |
| API request handling | API handlers | `CompanyController.create()` |

---

## 6️⃣ Dependency Injection: Loose Coupling

### **The Principle**
High-level modules should not depend on low-level modules. Both should depend on abstractions.

```typescript
// ✅ CORRECT - Dependency injection
export class CompanyAnalysisService {
  constructor(
    private companyRepo: ICompanyRepository,  // Interface, not implementation
    private aiService: IAIService,            // Interface, not implementation
    private logger: ILogger                   // Interface, not implementation
  ) {}
  
  async analyzeCompany(id: string) {
    const company = await this.companyRepo.findById(id);
    const insights = await this.aiService.analyze(company);
    this.logger.info(`Analyzed company ${id}`);
    return insights;
  }
}

// ❌ WRONG - Direct instantiation
export class CompanyAnalysisService {
  private companyRepo = new SupabaseCompanyRepository();  // Tight coupling!
  private aiService = new OpenAIService();               // Can't test!
  private logger = new ConsoleLogger();                   // Can't mock!
}
```

---

## 7️⃣ Testing: Behavior, Not Implementation

### **The Principle**
Test behavior through public interfaces, not implementation details.

```typescript
// ✅ CORRECT - Testing behavior
describe('CompanyAnalysisService', () => {
  it('should return health score for profitable companies', async () => {
    // Arrange
    const mockRepo = createMockRepository();
    const service = new CompanyAnalysisService(mockRepo);
    
    // Act
    const score = await service.analyzeHealth('company-123');
    
    // Assert
    expect(score.rating).toBe('Healthy');
  });
});

// ❌ WRONG - Testing implementation
it('should call calculateRevenueScore with revenue / 1000000', () => {
  // Testing private methods or internal calculations
  const spy = jest.spyOn(service, 'calculateRevenueScore');
  // This test breaks when implementation changes!
});
```

---

## 🚨 Common Anti-Patterns to Avoid

### **1. Anemic Domain Model**
```typescript
// ❌ WRONG - Just a data bag
class Company {
  id: string;
  name: string;
  revenue: number;
  // No behavior!
}

// ✅ CORRECT - Rich domain model
class Company {
  constructor(private data: CompanyData) {}
  
  calculateValuation(): Money {
    // Business logic here
  }
  
  canAcquire(target: Company): boolean {
    // Business rules here
  }
}
```

### **2. Service Locator Pattern**
```typescript
// ❌ WRONG - Hidden dependencies
class CompanyService {
  analyze() {
    const repo = ServiceLocator.get('CompanyRepository');  // Hidden dependency!
  }
}
```

### **3. God Objects**
```typescript
// ❌ WRONG - Does everything
class CompanyManager {
  createCompany() { }
  deleteCompany() { }
  sendEmail() { }
  generateReport() { }
  calculateTaxes() { }
  // 500 more methods...
}
```

---

## 📋 Architecture Checklist

Before committing code, verify:

- [ ] **No SQL outside repositories**
- [ ] **No business logic in UI components**
- [ ] **No business logic in database**
- [ ] **No try-catch for flow control**
- [ ] **Dependencies injected, not instantiated**
- [ ] **Each class has single responsibility**
- [ ] **Exceptions bubble up to global handler**
- [ ] **Domain models contain behavior, not just data**
- [ ] **Tests verify behavior, not implementation**
- [ ] **Clear separation between layers**

---

## 🎓 Summary

These principles are not suggestions - they are **requirements**. Following them will result in:

1. **Maintainable code** that can evolve with requirements
2. **Testable code** that can be verified automatically
3. **Scalable architecture** that can grow with the business
4. **Fewer bugs** because concerns are properly separated
5. **Faster development** because patterns are consistent

Violating these principles leads to:
- Technical debt that compounds daily
- Bugs that are impossible to track down
- Code that no one wants to work on
- Projects that fail or require complete rewrites

**Choose wisely. The architecture decisions you make today will affect every developer who touches this code for years to come.**