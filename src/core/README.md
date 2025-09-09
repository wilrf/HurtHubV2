# Core Domain Layer - Hurt Hub V2

## 📂 Directory Structure

This directory contains the **core business logic** of the application. It follows Domain-Driven Design (DDD) principles and has **zero dependencies on frameworks or external libraries**.

```
src/core/
├── domain/                  # Business entities and rules
│   ├── entities/           # Core business objects with behavior
│   │   ├── Company.ts
│   │   ├── User.ts
│   │   ├── Investment.ts
│   │   └── index.ts
│   ├── valueObjects/       # Immutable value objects
│   │   ├── Money.ts
│   │   ├── Email.ts
│   │   ├── CompanyId.ts
│   │   ├── Industry.ts
│   │   └── index.ts
│   ├── aggregates/         # Aggregate roots
│   │   ├── CompanyAggregate.ts
│   │   └── UserAggregate.ts
│   └── events/            # Domain events
│       ├── CompanyCreatedEvent.ts
│       ├── InvestmentMadeEvent.ts
│       └── index.ts
│
├── services/               # Domain services (business logic)
│   ├── CompanyAnalysisService.ts
│   ├── ValuationService.ts
│   ├── InvestmentService.ts
│   ├── AcquisitionService.ts
│   └── index.ts
│
├── repositories/           # Repository interfaces (NOT implementations)
│   ├── ICompanyRepository.ts
│   ├── IUserRepository.ts
│   ├── IInvestmentRepository.ts
│   └── index.ts
│
└── exceptions/            # Domain-specific exceptions
    ├── CompanyNotFoundError.ts
    ├── InvalidInvestmentError.ts
    ├── InsufficientFundsError.ts
    └── index.ts
```

## 🎯 Core Principles

### 1. **No Framework Dependencies**
The core domain has ZERO dependencies on React, Supabase, or any other framework. This ensures business logic is portable and testable.

```typescript
// ✅ GOOD - Pure domain logic
export class Company {
  canAcquire(target: Company): boolean {
    return this.valuation.isGreaterThan(target.valuation);
  }
}

// ❌ BAD - Framework dependency
import { supabase } from '@/lib/supabase'; // NO!
export class Company {
  async save() {
    await supabase.from('companies').insert(this); // NEVER!
  }
}
```

### 2. **Rich Domain Models**
Entities contain both data AND behavior. They are not just data containers.

```typescript
// ✅ GOOD - Entity with behavior
export class Company {
  constructor(
    private id: CompanyId,
    private name: CompanyName,
    private revenue: Money
  ) {}
  
  // Business behavior
  calculateValuation(): Money {
    return this.revenue.multiply(this.getIndustryMultiplier());
  }
  
  merge(other: Company): Company {
    // Business logic for merging
  }
}

// ❌ BAD - Anemic domain model
export interface Company {
  id: string;
  name: string;
  revenue: number;
  // Just data, no behavior!
}
```

### 3. **Value Objects for Type Safety**
Use value objects instead of primitives for domain concepts.

```typescript
// ✅ GOOD - Value objects
export class Money {
  constructor(
    private amount: number,
    private currency: string
  ) {
    if (amount < 0) throw new InvalidMoneyError();
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError();
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

// ❌ BAD - Primitives
function calculateTotal(price: number, tax: number): number {
  return price + tax; // What currency? What precision?
}
```

### 4. **Repository Interfaces Only**
The core defines repository interfaces. Implementations belong in the infrastructure layer.

```typescript
// src/core/repositories/ICompanyRepository.ts
export interface ICompanyRepository {
  findById(id: CompanyId): Promise<Company | null>;
  save(company: Company): Promise<void>;
  delete(id: CompanyId): Promise<void>;
}

// src/infrastructure/repositories/SupabaseCompanyRepository.ts
import { supabase } from '@/lib/supabase';

export class SupabaseCompanyRepository implements ICompanyRepository {
  async findById(id: CompanyId): Promise<Company | null> {
    // Supabase-specific implementation
  }
}
```

### 5. **Domain Services for Complex Logic**
When business logic doesn't naturally fit in an entity, use a domain service.

```typescript
export class CompanyValuationService {
  constructor(
    private marketDataProvider: IMarketDataProvider,
    private industryAnalyzer: IIndustryAnalyzer
  ) {}
  
  calculateValuation(company: Company): Money {
    const baseValue = company.revenue.multiply(this.getMultiplier(company));
    const marketAdjustment = this.marketDataProvider.getAdjustment(company.industry);
    const industryFactor = this.industryAnalyzer.getFactor(company);
    
    return baseValue
      .multiply(marketAdjustment)
      .multiply(industryFactor);
  }
}
```

## 🔄 Usage Examples

### Creating a Company Entity

```typescript
// Create value objects
const companyId = new CompanyId('comp-123');
const name = new CompanyName('Acme Corp');
const revenue = new Money(1000000, 'USD');
const industry = new Industry('Technology');

// Create entity
const company = Company.create({
  id: companyId,
  name: name,
  revenue: revenue,
  industry: industry,
  foundedDate: new Date('2020-01-01')
});

// Use business methods
const valuation = company.calculateValuation();
const canAcquire = company.canAcquire(targetCompany);
```

### Using Domain Services

```typescript
// In application layer
class CreateCompanyUseCase {
  constructor(
    private companyRepo: ICompanyRepository,
    private valuationService: CompanyValuationService
  ) {}
  
  async execute(request: CreateCompanyRequest) {
    // Create domain entity
    const company = Company.create(request);
    
    // Use domain service
    const valuation = this.valuationService.calculateValuation(company);
    company.setInitialValuation(valuation);
    
    // Save via repository
    await this.companyRepo.save(company);
    
    return new CreateCompanyResponse(company.id);
  }
}
```

### Handling Domain Events

```typescript
// Domain entity raises events
export class Company {
  acquire(target: Company): DomainEvent[] {
    if (!this.canAcquire(target)) {
      throw new InvalidAcquisitionError();
    }
    
    // Perform acquisition logic
    this.revenue = this.revenue.add(target.revenue);
    
    // Raise domain events
    return [
      new CompanyAcquiredEvent(this.id, target.id),
      new RevenueUpdatedEvent(this.id, this.revenue)
    ];
  }
}

// Application layer handles events
class AcquireCompanyUseCase {
  async execute(acquirerId: string, targetId: string) {
    const acquirer = await this.companyRepo.findById(acquirerId);
    const target = await this.companyRepo.findById(targetId);
    
    // Domain logic returns events
    const events = acquirer.acquire(target);
    
    // Save state
    await this.companyRepo.save(acquirer);
    
    // Publish events
    for (const event of events) {
      await this.eventBus.publish(event);
    }
  }
}
```

## ⚠️ What NOT to Put Here

### ❌ **No UI Logic**
```typescript
// This belongs in presentation layer, not core
function formatCurrency(amount: Money): string {
  return `$${amount.toNumber().toLocaleString()}`;
}
```

### ❌ **No Framework Code**
```typescript
// This belongs in infrastructure layer, not core
import { useQuery } from 'react-query'; // NO React!
import { supabase } from '@/lib/supabase'; // NO Supabase!
```

### ❌ **No HTTP/API Logic**
```typescript
// This belongs in infrastructure layer, not core
async function fetchCompanyFromAPI(id: string) {
  const response = await fetch(`/api/companies/${id}`);
  return response.json();
}
```

### ❌ **No Database Queries**
```typescript
// This belongs in infrastructure layer, not core
async function getTopCompanies() {
  return await supabase
    .from('companies')
    .select('*')
    .order('revenue', { ascending: false })
    .limit(10);
}
```

## 🧪 Testing the Core

The core domain is the easiest part to test because it has no external dependencies.

```typescript
describe('Company', () => {
  it('should calculate valuation based on industry', () => {
    const company = Company.create({
      name: 'Tech Corp',
      revenue: new Money(1000000, 'USD'),
      industry: new Industry('Technology')
    });
    
    const valuation = company.calculateValuation();
    
    expect(valuation.toNumber()).toBe(3500000); // 3.5x multiplier for tech
  });
  
  it('should not allow acquisition of larger company', () => {
    const small = Company.create({ revenue: new Money(100, 'USD') });
    const large = Company.create({ revenue: new Money(1000000, 'USD') });
    
    expect(small.canAcquire(large)).toBe(false);
  });
});
```

## 📚 Further Reading

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://www.amazon.com/Implementing-Domain-Driven-Design-Vaughn-Vernon/dp/0321834577)

---

**Remember**: The core domain is the heart of your application. Keep it pure, keep it tested, and keep it free from external dependencies.