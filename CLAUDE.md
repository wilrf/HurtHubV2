# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Charlotte Economic Development Platform is a comprehensive web application designed to provide real-time economic intelligence, community monitoring, and business analytics for the Greater Charlotte/Davidson metropolitan area. This is currently in the planning/architecture phase with detailed specifications in `charlotte-econdev-architecture.md`.

## Development Commands

### Frontend (React 18 + TypeScript)
```bash
npm start              # Start development server
npm run build          # Build for production with Vite
npm test               # Run Jest tests
npm run test:e2e       # Run Playwright E2E tests
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

### Backend (Node.js + Express/Fastify)
```bash
cd backend
npm start              # Start production server
npm run dev            # Start with nodemon (auto-reload)
npm test               # Run backend tests
npm run lint           # Lint backend code
```

### Development Environment
```bash
docker-compose up      # Start local development stack
npm run migrate        # Run database migrations
npm run seed           # Seed development data
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 with TypeScript, Vite build tool
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS + Custom CSS
- **Routing**: React Router v6 with lazy loading
- **Charts**: Recharts, D3.js
- **Maps**: Mapbox GL JS
- **Testing**: Jest + React Testing Library + Playwright

### Backend Stack
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js or Fastify
- **Database**: PostgreSQL with PostGIS
- **Cache**: Redis
- **Queue**: Bull (Redis-based)
- **Real-time**: Socket.io
- **Search**: Elasticsearch
- **Vector DB**: Pinecone/Weaviate for AI features

### Core Modules
1. **Homepage Dashboard** - Central navigation and key metrics overview
2. **Community Pulse** - Real-time community development monitoring with news aggregation, event timeline, and trend analysis
3. **Business Intelligence** - Advanced analytics including competitive analysis, sector performance, and market trends
4. **AI Assistant** - Integrated chatbot with RAG pipeline for intelligent queries

## Data Architecture

### Database Design
- **Primary DB**: PostgreSQL with tables for companies, developments, investments, economic indicators, and chat sessions
- **Time Series**: TimescaleDB for historical trends and real-time metrics
- **Vector Store**: For AI embeddings and semantic search
- **Cache Layer**: Redis for dashboard stats, search results, and WebSocket sessions

### External Data Integration
- News sources: Charlotte Observer, Charlotte Business Journal, WBTV
- Government data: City of Charlotte Open Data, Mecklenburg County GIS, NC Commerce Dept
- Business data: Crunchbase (investments), LinkedIn API, Google Places
- Real estate: Zillow API, CoStar, city permit database

## AI/ML Integration

### AI Services Architecture
- **Chat Engine**: OpenAI GPT-4/Claude integration with custom fine-tuning
- **RAG Pipeline**: Retrieval-Augmented Generation for company database queries
- **Analytics**: Prophet for forecasting, XGBoost for classification
- **NLP**: Sentiment analysis, named entity recognition, text summarization

### AI Components Location
```
ai_system/
├── embeddings/         # Text encoding and semantic search
├── rag/               # Document retrieval and response generation
├── nlp/               # Natural language processing
├── recommendations/   # Business recommendations engine
└── models/           # Predictive models and anomaly detection
```

## Security Considerations

### Authentication & Authorization
- JWT tokens (access + refresh)
- OAuth 2.0 integration (Google, Microsoft)
- Role-based access control (RBAC)
- API key management with rate limiting

### Data Protection
- AES-256 encryption at rest
- TLS 1.3 in transit
- PII data masking and GDPR compliance
- Audit logging and intrusion detection

## Development Workflow

### Environment Strategy
- **Development**: Local Docker Compose with hot reloading and mock data
- **Staging**: Production-like infrastructure with synthetic data for integration testing
- **Production**: Multi-region deployment with auto-scaling and full monitoring

### Code Quality Standards
- ESLint with Airbnb configuration
- Unit test coverage > 80%
- Integration test coverage > 70%
- E2E critical paths: 100%
- TypeScript strict mode enabled

### API Design
- RESTful endpoints following `/api/v1/` pattern
- WebSocket events for real-time updates
- Comprehensive API documentation
- Rate limiting: 100 req/min (public), 1000 req/min (authenticated), 20 req/min (AI)

## Performance & Monitoring

### Optimization Strategy
- Code splitting via React.lazy() for all routes
- Bundle compression with gzip
- CDN caching for static assets
- Database query optimization with indexing
- Redis caching for expensive operations

### Observability
- **Metrics**: Prometheus + Grafana + CloudWatch
- **Logging**: ELK Stack + CloudWatch Logs + Sentry
- **Tracing**: Jaeger + AWS X-Ray
- **Alerting**: PagerDuty + Slack notifications

### Key Performance Targets
- API response time: < 200ms (p95)
- Page load time: < 2s
- Uptime: 99.9%
- Error rate: < 0.1%

## Deployment & Infrastructure

### Container Strategy
- Docker containers for both frontend and backend
- Kubernetes deployment with auto-scaling
- AWS infrastructure: EKS, RDS, ElastiCache, S3, CloudFront

### CI/CD Pipeline
- GitHub Actions for automated testing and deployment
- Docker image builds on push to main/develop
- Automated deployment to staging and production
- Rollback capabilities and health checks

## Cost Management

### Infrastructure Costs (Monthly Estimate)
- AWS services: $1,600-2,500
- Third-party APIs (OpenAI, Maps, News): $1,000-1,800
- Total estimated monthly cost: $2,600-4,300

### Optimization Strategies
- Auto-scaling based on traffic patterns
- Reserved instances for predictable workloads
- Spot instances for batch processing jobs
- CDN caching to reduce data transfer costs

## Future Development Phases

### Phase 2 (Q2 2025)
- Mobile native apps (iOS/Android)
- Advanced predictive analytics
- Multi-language support
- API marketplace for third-party integrations

### Phase 3 (Q3 2025)
- Blockchain integration for verified data
- AR visualization for development projects
- Automated report generation
- Partner portal development

## Claude Code Development Workflow

### **CRITICAL: Always Follow This Workflow for All Development Tasks**

#### 1. **Planning Phase (MANDATORY)**
- **Always use TodoWrite** to break down user requests into specific, actionable tasks
- Research existing codebase before implementing anything
- Understand current patterns, conventions, and dependencies
- Create a clear plan and review it before proceeding

#### 2. **Research and Analysis**
```bash
# Always examine codebase first
npm run lint           # Check current code quality
npm run type-check     # Verify TypeScript compliance
```
- Use Glob/Grep to find existing similar functionality
- Read related files to understand current implementation patterns
- Check for existing components, services, or utilities that can be reused
- Understand the project's naming conventions and structure

#### 3. **Implementation Process**
- Work on ONE task at a time, marking it as `in_progress`
- Follow existing code conventions exactly
- Implement changes carefully and methodically
- Mark tasks as `completed` immediately after finishing each one
- Never batch multiple task completions

#### 4. **Quality Assurance (MANDATORY)**
```bash
npm run quality        # Run all quality checks
npm run lint           # ESLint validation  
npm run type-check     # TypeScript validation
npm test               # Run tests if applicable
```

#### 5. **Review and Validation**
- Test that changes work as expected
- Ensure no existing functionality is broken
- Verify code follows project patterns and conventions
- Double-check that all requirements are met

#### 6. **Communication Protocol**
- Explain what will be done before doing it
- Show the plan via TodoWrite for complex changes
- Ask for confirmation on significant architectural decisions
- Provide clear summaries of what was accomplished

### **Example Workflow**
```
User Request → TodoWrite (Planning) → Research Existing Code → 
Review Plan → Careful Implementation → Quality Checks → 
Mark Complete → Summary
```

### **Key Principles**
- **Slow and careful** is always better than fast and broken
- **Review before implementing** - understand the full context
- **Follow existing patterns** - maintain consistency
- **Test thoroughly** - ensure nothing breaks
- **Communicate clearly** - keep the user informed of progress

## Industry Best Practices & Standards

### **Code Quality & Efficiency**

#### Performance Optimization
```typescript
// ✅ GOOD - Efficient patterns
const memoizedComponent = React.memo(ComponentName);
const { data, isLoading } = useSWR(key, fetcher); // Cache API calls
const deferredValue = useDeferredValue(searchTerm); // React 18 performance

// ❌ AVOID - Inefficient patterns  
const data = await fetch(url); // No caching or error handling
useEffect(() => { /* expensive operation on every render */ }, []);
```

#### Clean Code Principles
- **Single Responsibility Principle** - One function, one purpose
- **DRY (Don't Repeat Yourself)** - Extract reusable utilities
- **KISS (Keep It Simple, Stupid)** - Prefer simple, readable solutions
- **Pure Functions** - Predictable inputs/outputs, no side effects
- **Immutable State** - Use state management patterns that prevent mutations

#### Code Organization Standards
```typescript
// File naming: kebab-case for components, camelCase for utilities
// Component files: PascalCase.tsx
// Service files: camelCase.ts
// Hook files: use[Name].ts
// Type files: [name].types.ts

// ✅ GOOD - Clear, specific naming
const calculateMonthlyRevenue = (data: RevenueData[]) => { ... }
const useCompanySearch = (query: string) => { ... }
const CompanyAnalyticsDashboard = () => { ... }

// ❌ AVOID - Vague, generic naming
const calculate = (data: any) => { ... }
const useData = (query: string) => { ... }
const Component = () => { ... }
```

### **Project Structure & Organization**

#### Directory Structure Standards
```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── forms/              # Form components
│   ├── layouts/            # Layout components
│   └── feature/            # Feature-specific components
├── hooks/                  # Custom React hooks
├── services/               # API and business logic
├── utils/                  # Pure utility functions
├── types/                  # TypeScript type definitions
├── constants/              # Application constants
├── contexts/               # React contexts
├── stores/                 # State management
├── assets/                 # Static assets (images, fonts)
└── styles/                 # Global styles and themes
```

#### File Organization Rules
- **Colocation** - Keep related files together
- **Index Files** - Use index.ts files for clean imports
- **Feature Folders** - Group by feature, not by file type
- **Absolute Imports** - Configure path mapping for cleaner imports

```typescript
// ✅ GOOD - Clean imports with absolute paths
import { Button } from '@/components/ui/Button';
import { useCompanyData } from '@/hooks/useCompanyData';
import { formatCurrency } from '@/utils/formatters';

// ❌ AVOID - Relative import mess
import { Button } from '../../../components/ui/Button';
import { useCompanyData } from '../../hooks/useCompanyData';
```

### **Design System & UI Standards**

#### Component Design Principles
- **Atomic Design** - Build from atoms → molecules → organisms
- **Consistent Spacing** - Use standardized spacing scale (4px, 8px, 16px, 24px, 32px)
- **Accessible by Default** - WCAG 2.1 AA compliance
- **Mobile-First** - Responsive design starting from mobile
- **Design Tokens** - Use CSS variables/Tailwind config for consistency

#### UI Component Standards
```typescript
// ✅ GOOD - Well-structured component
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
  'aria-label'?: string;
}

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size, 
  isLoading = false, 
  children,
  ...props 
}) => {
  return (
    <button
      className={cn(
        'font-medium rounded-md transition-colors',
        buttonVariants[variant],
        buttonSizes[size],
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
};
```

### **Performance & Efficiency Standards**

#### Bundle Optimization
- **Code Splitting** - Lazy load routes and heavy components
- **Tree Shaking** - Import only what you need
- **Image Optimization** - Use WebP, lazy loading, responsive images
- **CSS Optimization** - Remove unused CSS, use CSS-in-JS efficiently

#### Runtime Performance
```typescript
// ✅ GOOD - Optimized patterns
const expensiveValue = useMemo(() => calculateComplexData(data), [data]);
const handleClick = useCallback((id: string) => onSelect(id), [onSelect]);

// Virtualize large lists
const VirtualizedList = () => (
  <FixedSizeList height={400} itemCount={items.length} itemSize={50}>
    {ItemRenderer}
  </FixedSizeList>
);

// ❌ AVOID - Performance killers
const value = calculateComplexData(data); // Runs on every render
const handleClick = (id: string) => onSelect(id); // New function every render
```

### **Security Best Practices**

#### Data Protection
- **Input Sanitization** - Sanitize all user inputs
- **XSS Prevention** - Use dangerouslySetInnerHTML carefully
- **API Security** - Validate all API responses
- **Environment Variables** - Never commit secrets to version control

```typescript
// ✅ GOOD - Secure data handling
const sanitizedInput = DOMPurify.sanitize(userInput);
const apiKey = process.env.REACT_APP_API_KEY; // Environment variable
const response = ApiResponseSchema.parse(data); // Validate API responses

// ❌ AVOID - Security risks
const unsafeHtml = `<div>${userInput}</div>`; // XSS vulnerability
const apiKey = 'hardcoded-key-123'; // Exposed secret
```

### **Testing Standards**

#### Test Organization
```typescript
// ✅ GOOD - Comprehensive test structure
describe('CompanySearchForm', () => {
  describe('when searching for companies', () => {
    it('should display loading state during search', async () => {
      // Arrange
      const mockSearch = vi.fn();
      render(<CompanySearchForm onSearch={mockSearch} />);
      
      // Act
      await user.click(screen.getByRole('button', { name: /search/i }));
      
      // Assert
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });
});
```

#### Test Coverage Standards
- **Unit Tests** - 80%+ coverage for utilities and hooks
- **Integration Tests** - 70%+ coverage for API interactions
- **E2E Tests** - 100% coverage for critical user journeys
- **Visual Regression Tests** - For UI components

### **Git & Version Control Standards**

#### Commit Message Format
```bash
# ✅ GOOD - Conventional commits
feat(dashboard): add real-time metrics display
fix(api): handle rate limiting errors gracefully
docs(readme): update deployment instructions
refactor(components): extract reusable Button component

# ❌ AVOID - Vague commit messages
updated stuff
fix
changes
```

#### Branch Strategy
- **main** - Production-ready code
- **develop** - Integration branch
- **feature/[name]** - New features
- **fix/[name]** - Bug fixes
- **hotfix/[name]** - Critical production fixes

## Important Notes

- This project is currently in the architecture/planning phase
- Refer to `charlotte-econdev-architecture.md` for comprehensive technical specifications
- Focus on scalability and real-time capabilities when implementing
- Prioritize data quality and AI accuracy for economic insights
- Ensure GDPR/CCPA compliance for data handling
- Implement comprehensive monitoring from day one
- **ALWAYS follow the development workflow above for all changes**