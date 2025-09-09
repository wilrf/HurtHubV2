# Patterns & Anti-Patterns Guide - Hurt Hub V2

## 🚫 ANTI-PATTERNS (Never Do These)

These are common mistakes that lead to unmaintainable code. Each example shows what NOT to do and how to fix it.

---

### ❌ ANTI-PATTERN: Direct SQL in Components/Pages

**The Problem**: Mixing data access with UI logic creates tight coupling and untestable code.

```typescript
// ❌ NEVER DO THIS - SQL in React component
function CompanyList() {
  const [companies, setCompanies] = useState([]);
  
  useEffect(() => {
    // Direct database access in component!
    const fetchData = async () => {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('active', true)
        .order('revenue', { ascending: false });
      setCompanies(data);
    };
    fetchData();
  }, []);
  
  return <div>{/* render companies */}</div>;
}
```

**✅ THE FIX: Use Repository Pattern**

```typescript
// src/core/repositories/ICompanyRepository.ts
export interface ICompanyRepository {
  findActive(): Promise<Company[]>;
}

// src/infrastructure/repositories/SupabaseCompanyRepository.ts
export class SupabaseCompanyRepository implements ICompanyRepository {
  async findActive(): Promise<Company[]> {
    const { data } = await this.supabase
      .from('companies')
      .select('*')
      .eq('active', true)
      .order('revenue', { ascending: false });
    return data.map(Company.fromDatabase);
  }
}

// src/hooks/useCompanies.ts
export function useCompanies() {
  const repository = useCompanyRepository(); // Dependency injection
  return useQuery(['companies', 'active'], () => repository.findActive());
}

// src/pages/CompanyList.tsx
function CompanyList() {
  const { data: companies, isLoading } = useCompanies();
  return <div>{/* render companies */}</div>;
}
```

---

### ❌ ANTI-PATTERN: Business Logic in UI Components

**The Problem**: Business rules scattered across components make changes difficult and testing impossible.

```typescript
// ❌ NEVER DO THIS - Business logic in React component
function InvestmentCalculator({ company }) {
  const calculateROI = () => {
    // Complex business logic in component!
    const adjustedRevenue = company.revenue * 1.15;
    const marketMultiplier = company.industry === 'Tech' ? 3.5 : 2.1;
    const riskFactor = company.yearsInBusiness > 5 ? 0.8 : 1.2;
    const baseValuation = adjustedRevenue * marketMultiplier;
    const finalValuation = baseValuation * riskFactor;
    
    if (company.hasPatents) {
      finalValuation *= 1.25;
    }
    
    return {
      valuation: finalValuation,
      roi: (finalValuation - company.currentValue) / company.currentValue,
      recommendation: finalValuation > company.askingPrice ? 'BUY' : 'PASS'
    };
  };
  
  const result = calculateROI();
  
  return (
    <div>
      <h3>Valuation: ${result.valuation}</h3>
      <p>ROI: {result.roi}%</p>
      <p>Recommendation: {result.recommendation}</p>
    </div>
  );
}
```

**✅ THE FIX: Move to Domain Service**

```typescript
// src/core/domain/valueObjects/Money.ts
export class Money {
  constructor(private amount: number, private currency: string = 'USD') {}
  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }
}

// src/core/domain/entities/Company.ts
export class Company {
  constructor(private data: CompanyData) {}
  
  get revenue(): Money { return new Money(this.data.revenue); }
  get industry(): Industry { return this.data.industry; }
  get yearsInBusiness(): number { return this.data.yearsInBusiness; }
  get hasPatents(): boolean { return this.data.patentCount > 0; }
}

// src/core/services/InvestmentAnalysisService.ts
export class InvestmentAnalysisService {
  private readonly TECH_MULTIPLIER = 3.5;
  private readonly DEFAULT_MULTIPLIER = 2.1;
  private readonly PATENT_BONUS = 1.25;
  private readonly MATURE_COMPANY_YEARS = 5;
  
  calculateValuation(company: Company): InvestmentAnalysis {
    const adjustedRevenue = this.applyGrowthProjection(company.revenue);
    const marketMultiplier = this.getMarketMultiplier(company.industry);
    const riskFactor = this.calculateRiskFactor(company);
    
    let valuation = adjustedRevenue
      .multiply(marketMultiplier)
      .multiply(riskFactor);
    
    if (company.hasPatents) {
      valuation = valuation.multiply(this.PATENT_BONUS);
    }
    
    return new InvestmentAnalysis(valuation, company);
  }
  
  private applyGrowthProjection(revenue: Money): Money {
    return revenue.multiply(1.15);
  }
  
  private getMarketMultiplier(industry: Industry): number {
    return industry.isTech() ? this.TECH_MULTIPLIER : this.DEFAULT_MULTIPLIER;
  }
  
  private calculateRiskFactor(company: Company): number {
    return company.yearsInBusiness > this.MATURE_COMPANY_YEARS ? 0.8 : 1.2;
  }
}

// src/components/InvestmentCalculator.tsx
function InvestmentCalculator({ company }) {
  const analysisService = useInvestmentAnalysisService();
  const analysis = analysisService.calculateValuation(company);
  
  return (
    <div>
      <h3>Valuation: {analysis.valuation.format()}</h3>
      <p>ROI: {analysis.roi.toPercentage()}</p>
      <p>Recommendation: {analysis.recommendation}</p>
    </div>
  );
}
```

---

### ❌ ANTI-PATTERN: Try-Catch for Flow Control

**The Problem**: Using exceptions for business logic makes code unpredictable and hides real errors.

```typescript
// ❌ NEVER DO THIS - Try-catch for business logic
async function processPayment(orderId: string, cardToken: string) {
  try {
    const order = await orderRepository.findById(orderId);
    
    try {
      await paymentGateway.charge(cardToken, order.total);
      order.status = 'paid';
      await orderRepository.save(order);
      return { success: true };
    } catch (error) {
      // Using exception for business logic!
      if (error.message.includes('insufficient_funds')) {
        return { success: false, reason: 'insufficient_funds' };
      }
      if (error.message.includes('card_declined')) {
        return { success: false, reason: 'card_declined' };
      }
      // Swallowing unknown errors!
      return { success: false, reason: 'unknown' };
    }
  } catch (error) {
    // Order not found - using exception for control flow!
    return { success: false, reason: 'order_not_found' };
  }
}
```

**✅ THE FIX: Explicit Business Logic & Global Handler**

```typescript
// src/core/domain/valueObjects/PaymentResult.ts
export class PaymentResult {
  private constructor(
    public readonly success: boolean,
    public readonly failureReason?: PaymentFailureReason
  ) {}
  
  static success(): PaymentResult {
    return new PaymentResult(true);
  }
  
  static insufficientFunds(): PaymentResult {
    return new PaymentResult(false, PaymentFailureReason.INSUFFICIENT_FUNDS);
  }
  
  static cardDeclined(): PaymentResult {
    return new PaymentResult(false, PaymentFailureReason.CARD_DECLINED);
  }
}

// src/core/services/PaymentService.ts
export class PaymentService {
  async processPayment(orderId: string, cardToken: string): Promise<PaymentResult> {
    const order = await this.orderRepository.findById(orderId);
    
    if (!order) {
      throw new OrderNotFoundError(orderId); // Let it bubble up!
    }
    
    const chargeResult = await this.paymentGateway.attemptCharge(
      cardToken, 
      order.total
    );
    
    if (chargeResult.wasSuccessful()) {
      await this.markOrderAsPaid(order);
      return PaymentResult.success();
    }
    
    // Explicit business logic, not exception handling
    switch (chargeResult.failureCode) {
      case 'INSUFFICIENT_FUNDS':
        return PaymentResult.insufficientFunds();
      case 'CARD_DECLINED':
        return PaymentResult.cardDeclined();
      default:
        // Unknown failure - this is exceptional!
        throw new UnexpectedPaymentError(chargeResult);
    }
  }
}

// src/api/handlers/PaymentHandler.ts
export class PaymentHandler {
  async handlePaymentRequest(req: Request, res: Response) {
    // Only catch at the system boundary
    try {
      const result = await this.paymentService.processPayment(
        req.body.orderId,
        req.body.cardToken
      );
      
      return res.json(result);
    } catch (error) {
      // Global exception handler
      return GlobalExceptionHandler.handle(error, req, res);
    }
  }
}
```

---

### ❌ ANTI-PATTERN: Mixed Data Access Patterns

**The Problem**: Inconsistent data access makes caching, testing, and maintenance difficult.

```typescript
// ❌ NEVER DO THIS - Mixed data access
class CompanyService {
  async getCompanyData(id: string) {
    // Direct Supabase call
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    // Raw SQL query
    const revenues = await db.query(
      'SELECT * FROM revenues WHERE company_id = $1',
      [id]
    );
    
    // REST API call
    const stockData = await fetch(`/api/stocks/${company.ticker}`);
    
    // GraphQL query
    const news = await graphqlClient.query({
      query: GET_COMPANY_NEWS,
      variables: { companyId: id }
    });
    
    return { company, revenues, stockData, news };
  }
}
```

**✅ THE FIX: Consistent Repository Pattern**

```typescript
// src/core/repositories/ICompanyRepository.ts
export interface ICompanyRepository {
  findById(id: string): Promise<Company>;
  findRevenues(companyId: string): Promise<Revenue[]>;
}

// src/core/repositories/IStockRepository.ts
export interface IStockRepository {
  findByTicker(ticker: string): Promise<StockData>;
}

// src/core/repositories/INewsRepository.ts
export interface INewsRepository {
  findByCompany(companyId: string): Promise<NewsArticle[]>;
}

// src/core/services/CompanyDataAggregator.ts
export class CompanyDataAggregator {
  constructor(
    private companyRepo: ICompanyRepository,
    private stockRepo: IStockRepository,
    private newsRepo: INewsRepository
  ) {}
  
  async getCompleteCompanyData(id: string): Promise<CompanyDataPackage> {
    // All data access through repositories
    const company = await this.companyRepo.findById(id);
    
    if (!company) {
      throw new CompanyNotFoundError(id);
    }
    
    // Parallel fetching through consistent interfaces
    const [revenues, stockData, news] = await Promise.all([
      this.companyRepo.findRevenues(id),
      this.stockRepo.findByTicker(company.ticker),
      this.newsRepo.findByCompany(id)
    ]);
    
    return new CompanyDataPackage(company, revenues, stockData, news);
  }
}
```

---

## ✅ PATTERNS (Always Do These)

### ✅ PATTERN: Repository Pattern for Data Access

**Purpose**: Encapsulate all data access logic in a single place.

```typescript
// src/core/repositories/IRepository.ts
export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<void>;
  delete(id: ID): Promise<void>;
}

// src/core/repositories/ICompanyRepository.ts
export interface ICompanyRepository extends IRepository<Company, string> {
  findByIndustry(industry: string): Promise<Company[]>;
  findTopPerformers(limit: number): Promise<Company[]>;
  search(criteria: SearchCriteria): Promise<Company[]>;
}

// src/infrastructure/repositories/SupabaseCompanyRepository.ts
export class SupabaseCompanyRepository implements ICompanyRepository {
  constructor(private supabase: SupabaseClient) {}
  
  async findById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new DatabaseError(error);
    if (!data) return null;
    
    return Company.fromDatabase(data);
  }
  
  async save(company: Company): Promise<void> {
    const data = company.toDatabaseFormat();
    
    const { error } = await this.supabase
      .from('companies')
      .upsert(data);
    
    if (error) throw new DatabaseError(error);
  }
}
```

---

### ✅ PATTERN: Service Layer for Business Logic

**Purpose**: Encapsulate business rules in reusable, testable services.

```typescript
// src/core/services/CompanyAcquisitionService.ts
export class CompanyAcquisitionService {
  constructor(
    private companyRepo: ICompanyRepository,
    private valuationService: ValuationService,
    private notificationService: INotificationService
  ) {}
  
  async evaluateAcquisition(
    acquirerId: string, 
    targetId: string
  ): Promise<AcquisitionAnalysis> {
    // Load entities
    const [acquirer, target] = await Promise.all([
      this.companyRepo.findById(acquirerId),
      this.companyRepo.findById(targetId)
    ]);
    
    if (!acquirer || !target) {
      throw new CompanyNotFoundError();
    }
    
    // Business rule: Company can't acquire itself
    if (acquirer.id === target.id) {
      throw new InvalidAcquisitionError('Cannot acquire self');
    }
    
    // Business rule: Must have sufficient capital
    const targetValuation = await this.valuationService.calculate(target);
    if (acquirer.availableCapital.isLessThan(targetValuation)) {
      return AcquisitionAnalysis.insufficientFunds();
    }
    
    // Business rule: Industry compatibility check
    const synergyScore = this.calculateSynergy(acquirer, target);
    if (synergyScore < 0.3) {
      return AcquisitionAnalysis.poorFit();
    }
    
    // All checks passed
    const analysis = new AcquisitionAnalysis(
      acquirer,
      target,
      targetValuation,
      synergyScore
    );
    
    // Side effect through service
    await this.notificationService.notifyAcquisitionOpportunity(analysis);
    
    return analysis;
  }
  
  private calculateSynergy(acquirer: Company, target: Company): number {
    // Complex business logic for synergy calculation
    // This belongs in the service, not the UI or database
  }
}
```

---

### ✅ PATTERN: Global Error Boundary

**Purpose**: Catch all unhandled exceptions in one place for logging and monitoring.

```typescript
// src/core/exceptions/GlobalErrorBoundary.tsx
export class GlobalErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service
    ErrorLogger.logError({
      error,
      errorInfo,
      userId: getCurrentUserId(),
      sessionId: getSessionId(),
      timestamp: new Date().toISOString()
    });
    
    // Send to error tracking service
    Sentry.captureException(error, {
      contexts: { react: errorInfo }
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// src/api/middleware/globalExceptionMiddleware.ts
export function globalExceptionMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log the error with full context
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers,
      user: req.user
    },
    timestamp: new Date().toISOString()
  });
  
  // Alert for critical errors
  if (error instanceof CriticalError) {
    alertingService.triggerAlert(error);
  }
  
  // Return appropriate response
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details
    });
  }
  
  if (error instanceof NotFoundError) {
    return res.status(404).json({
      error: 'Resource not found'
    });
  }
  
  // Default error response
  return res.status(500).json({
    error: 'An unexpected error occurred',
    reference: error.id
  });
}
```

---

### ✅ PATTERN: Domain Entities with Behavior

**Purpose**: Encapsulate data and behavior together in domain objects.

```typescript
// src/core/domain/entities/Company.ts
export class Company {
  private constructor(
    private readonly id: CompanyId,
    private name: CompanyName,
    private revenue: Money,
    private employees: EmployeeCount,
    private industry: Industry,
    private foundedDate: Date
  ) {}
  
  // Factory method with validation
  static create(data: CompanyData): Company {
    if (!data.name || data.name.length < 2) {
      throw new InvalidCompanyError('Name too short');
    }
    
    if (data.revenue < 0) {
      throw new InvalidCompanyError('Revenue cannot be negative');
    }
    
    return new Company(
      new CompanyId(data.id),
      new CompanyName(data.name),
      new Money(data.revenue),
      new EmployeeCount(data.employees),
      new Industry(data.industry),
      new Date(data.foundedDate)
    );
  }
  
  // Business behavior on the entity
  canAcquire(target: Company): boolean {
    // Business rule: Must be 10x larger
    if (this.revenue.isLessThan(target.revenue.multiply(10))) {
      return false;
    }
    
    // Business rule: Must be in compatible industry
    if (!this.industry.isCompatibleWith(target.industry)) {
      return false;
    }
    
    return true;
  }
  
  merge(other: Company): Company {
    // Business logic for merging companies
    const combinedRevenue = this.revenue.add(other.revenue);
    const combinedEmployees = this.employees.add(other.employees);
    
    return new Company(
      CompanyId.generate(),
      this.name.append(other.name),
      combinedRevenue,
      combinedEmployees,
      this.industry, // Keep primary industry
      this.foundedDate // Keep earlier date
    );
  }
  
  // Prevent external mutation
  get revenueAmount(): number {
    return this.revenue.toNumber();
  }
  
  // Domain events
  acquire(target: Company): DomainEvent[] {
    if (!this.canAcquire(target)) {
      throw new InvalidAcquisitionError();
    }
    
    return [
      new CompanyAcquiredEvent(this.id, target.id, new Date()),
      new RevenueUpdatedEvent(this.id, this.revenue.add(target.revenue))
    ];
  }
}
```

---

### ✅ PATTERN: Use Case Pattern

**Purpose**: Orchestrate business operations as explicit use cases.

```typescript
// src/application/useCases/CreateCompanyUseCase.ts
export class CreateCompanyUseCase {
  constructor(
    private companyRepo: ICompanyRepository,
    private validationService: IValidationService,
    private eventBus: IEventBus,
    private logger: ILogger
  ) {}
  
  async execute(request: CreateCompanyRequest): Promise<CreateCompanyResponse> {
    this.logger.info('Creating company', { request });
    
    // Validate request
    const validationResult = await this.validationService.validate(request);
    if (!validationResult.isValid) {
      throw new ValidationError(validationResult.errors);
    }
    
    // Check for duplicates
    const existing = await this.companyRepo.findByName(request.name);
    if (existing) {
      throw new DuplicateCompanyError(request.name);
    }
    
    // Create domain entity
    const company = Company.create({
      id: CompanyId.generate(),
      name: request.name,
      revenue: request.revenue,
      employees: request.employees,
      industry: request.industry,
      foundedDate: request.foundedDate
    });
    
    // Persist
    await this.companyRepo.save(company);
    
    // Publish domain events
    await this.eventBus.publish(
      new CompanyCreatedEvent(company.id, company.name)
    );
    
    this.logger.info('Company created successfully', { id: company.id });
    
    return new CreateCompanyResponse(company.id);
  }
}

// Usage in API handler
export class CompanyController {
  async createCompany(req: Request, res: Response) {
    const useCase = new CreateCompanyUseCase(
      this.companyRepo,
      this.validationService,
      this.eventBus,
      this.logger
    );
    
    const response = await useCase.execute(req.body);
    return res.status(201).json(response);
  }
}
```

---

## 📚 Summary

### **Key Principles to Remember**

1. **Data Access** → Only through Repositories
2. **Business Logic** → Only in Services/Use Cases
3. **UI Components** → Only presentation logic
4. **Exceptions** → Let them bubble up
5. **Dependencies** → Inject, don't instantiate
6. **Domain Objects** → Behavior + Data together
7. **Testing** → Test behavior, not implementation

### **Code Review Checklist**

When reviewing code, reject if you see:
- [ ] SQL queries outside repositories
- [ ] Business calculations in React components
- [ ] Try-catch blocks in business logic
- [ ] Direct instantiation of services
- [ ] Anemic domain models (data without behavior)
- [ ] Mixed data access patterns
- [ ] God objects doing everything
- [ ] Hidden dependencies

### **The Golden Rule**

> **If you're unsure where code belongs, it probably belongs in a service.**

Components should be dumb. Databases should be dumb. All the intelligence should be in your domain and application layers where it can be tested, reused, and maintained.