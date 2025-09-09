// Domain entity representing a Business
export class Business {
  // Domain properties (use business-friendly names)
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly industry: string | null,
    public readonly employeeCount: number | null,  // NOT employees_count
    public readonly yearFounded: number | null,     // NOT year_established
    public readonly revenue: number | null,
    public readonly city: string,
    public readonly state: string,
    public readonly neighborhood: string | null,
    // Rich domain properties
    public readonly operatingHours: BusinessHours | null,
    public readonly customerMetrics: CustomerMetrics | null,
    public readonly financialMetrics: FinancialMetrics | null,
    // Derived metrics
    private readonly revenueGrowthPct: number | null,
  ) {}

  // Factory method to create from database record
  static fromDatabase(record: any): Business {
    return new Business(
      record.id,
      record.name,
      record.industry,
      record.employees,           // Map DB field to domain field
      record.year_established,    // Map DB field to domain field
      record.revenue,
      record.city || 'Charlotte',
      record.state || 'NC',
      record.neighborhood,
      // Transform operating hours from DB format
      Business.parseOperatingHours(record),
      // Build customer metrics
      {
        averageSpend: record.avg_customer_spend,
        monthlyCustomers: record.monthly_customers,
        rating: record.customer_rating,
        reviewCount: record.review_count,
      },
      // Build financial metrics
      {
        revenuePerEmployee: record.revenue_per_employee,
        operatingMargin: record.operating_margin,
        monthlyRent: record.rent_per_month,
        monthlyPayroll: record.payroll_per_month,
        monthlyUtilities: record.utilities_per_month,
      },
      // Derived revenue growth (average of quarterly pct columns if present)
      Business.calculateRevenueGrowth(record),
    );
  }

  // Helper to parse hours from DB format
  private static parseOperatingHours(record: any): BusinessHours | null {
    if (!record.hours_monday) return null;
    
    return {
      monday: record.hours_monday,
      tuesday: record.hours_tuesday,
      wednesday: record.hours_wednesday,
      thursday: record.hours_thursday,
      friday: record.hours_friday,
      saturday: record.hours_saturday,
      sunday: record.hours_sunday,
    };
  }

  // Domain methods (business logic goes here)
  isOpenOn(day: string): boolean {
    if (!this.operatingHours) return false;
    const hours = this.operatingHours[day.toLowerCase() as keyof BusinessHours];
    return hours !== null && hours !== 'Closed';
  }

  getAgeInYears(): number | null {
    if (!this.yearFounded) return null;
    return new Date().getFullYear() - this.yearFounded;
  }

  getEmployeeSizeCategory(): string {
    if (!this.employeeCount) return 'Unknown';
    if (this.employeeCount < 10) return 'Micro';
    if (this.employeeCount < 50) return 'Small';
    if (this.employeeCount < 250) return 'Medium';
    return 'Large';
  }

  // Derived financial metrics
  getGrossMargin(): number | null {
    // For now, use operating margin as proxy if available
    return this.financialMetrics?.operatingMargin ?? null;
  }

  getNetMargin(): number | null {
    if (this.revenue == null) return null;
    // Estimate net margin: revenue minus annualized primary operating costs
    const monthlyCosts =
      (this.financialMetrics?.monthlyRent ?? 0) +
      (this.financialMetrics?.monthlyPayroll ?? 0) +
      (this.financialMetrics?.monthlyUtilities ?? 0);
    const netProfit = this.revenue - monthlyCosts * 12;
    return this.revenue > 0 ? (netProfit / this.revenue) * 100 : null;
  }

  getRevenueGrowth(): number | null {
    return this.revenueGrowthPct;
  }

  // Convert to API response format - CLEAN ARCHITECTURE, NO COMPROMISES
  toJSON(): any {
    return {
      // Core fields with CLEAN domain naming ONLY
      id: this.id,
      name: this.name,
      industry: this.industry,
      employeeCount: this.employeeCount,  // CLEAN NAME - NO ALIASES
      yearFounded: this.yearFounded,      // CLEAN NAME - NO ALIASES
      revenue: this.revenue,
      
      // Location fields
      city: this.city,
      state: this.state,
      neighborhood: this.neighborhood,
      
      // Financial metrics
      revenuePerEmployee: this.financialMetrics?.revenuePerEmployee || null,
      operatingMargin: this.financialMetrics?.operatingMargin || null,
      grossMargin: this.getGrossMargin(),
      netMargin: this.getNetMargin(),
      revenueGrowth: this.getRevenueGrowth(),
      
      // Customer metrics
      rating: this.customerMetrics?.rating || null,
      reviewCount: this.customerMetrics?.reviewCount || null,
      
      // Operating details
      operatingHours: this.operatingHours,
      monthlyRent: this.financialMetrics?.monthlyRent || null,
      monthlyPayroll: this.financialMetrics?.monthlyPayroll || null,
      monthlyUtilities: this.financialMetrics?.monthlyUtilities || null,
      
      // Additional fields
      description: null,
      headquarters: `${this.city}, ${this.state}`,
      website: null,
      logoUrl: null,
      status: 'active',
      industryMetrics: {},
      
      // Computed properties
      businessAge: this.getAgeInYears(),
      employeeSizeCategory: this.getEmployeeSizeCategory(),
    };
  }

  // --- Private helpers ----------------------------------------------------
  private static calculateRevenueGrowth(record: any): number | null {
    const quarters = [
      record.q1_revenue_pct,
      record.q2_revenue_pct,
      record.q3_revenue_pct,
      record.q4_revenue_pct,
    ].filter((v: any) => typeof v === 'number');
    if (quarters.length === 0) return null;
    const sum = quarters.reduce((s: number, v: number) => s + v, 0);
    return sum / quarters.length;
  }
}

// Supporting types
interface BusinessHours {
  monday: string | null;
  tuesday: string | null;
  wednesday: string | null;
  thursday: string | null;
  friday: string | null;
  saturday: string | null;
  sunday: string | null;
}

interface CustomerMetrics {
  averageSpend: number | null;
  monthlyCustomers: number | null;
  rating: number | null;
  reviewCount: number | null;
}

interface FinancialMetrics {
  revenuePerEmployee: number | null;
  operatingMargin: number | null;
  monthlyRent: number | null;
  monthlyPayroll: number | null;
  monthlyUtilities: number | null;
}