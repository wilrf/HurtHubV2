# Charlotte Economic Development Platform
## System Architecture Document v1.0

---

## 1. Executive Summary

The Charlotte Economic Development Platform is a comprehensive web application designed to provide real-time economic intelligence, community monitoring, and business analytics for the Greater Charlotte/Davidson metropolitan area. The platform integrates multiple data sources, AI-powered insights, and interactive visualizations to support economic development decision-making.

---

## 2. System Overview

### 2.1 Core Modules
- **Homepage Dashboard** - Central navigation and key metrics overview
- **Community Pulse** - Real-time community development monitoring
- **Business Intelligence** - Advanced analytics and market insights
- **AI Assistant** - Integrated chatbot for data queries and recommendations

### 2.2 Key Features
- Real-time data aggregation from multiple sources
- Interactive data visualizations and maps
- AI-powered recommendations
- Company database search and filtering
- Trend analysis and predictive modeling
- Mobile-responsive design

---

## 3. Technical Architecture

### 3.1 Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navigation.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── LoadingSpinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── dashboard/
│   │   │   ├── HomePage.jsx
│   │   │   ├── StatsGrid.jsx
│   │   │   ├── AnimatedCounter.jsx
│   │   │   └── QuickInsights.jsx
│   │   ├── community-pulse/
│   │   │   ├── CommunityPulse.jsx
│   │   │   ├── ActivityMap.jsx
│   │   │   ├── EventTimeline.jsx
│   │   │   ├── TrendingTopics.jsx
│   │   │   └── NewsAggregator.jsx
│   │   ├── business-intelligence/
│   │   │   ├── BusinessIntelligence.jsx
│   │   │   ├── CompetitiveAnalysis.jsx
│   │   │   ├── SectorPerformance.jsx
│   │   │   ├── OpportunityZones.jsx
│   │   │   └── MarketTrends.jsx
│   │   ├── ai-assistant/
│   │   │   ├── ChatBot.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── InputBar.jsx
│   │   │   └── Suggestions.jsx
│   │   └── visualizations/
│   │       ├── ChartWrapper.jsx
│   │       ├── GeoMap.jsx
│   │       ├── RadarChart.jsx
│   │       └── TimeSeriesChart.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js
│   │   ├── useDataFetch.js
│   │   ├── useAuth.js
│   │   └── useAnalytics.js
│   ├── services/
│   │   ├── api.js
│   │   ├── websocket.js
│   │   ├── auth.js
│   │   └── analytics.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── store/
│   │   ├── index.js
│   │   ├── slices/
│   │   │   ├── dashboardSlice.js
│   │   │   ├── communitySlice.js
│   │   │   ├── businessSlice.js
│   │   │   └── chatSlice.js
│   │   └── middleware/
│   │       └── apiMiddleware.js
│   ├── styles/
│   │   ├── globals.css
│   │   ├── themes/
│   │   │   └── dark-sapphire.css
│   │   └── components/
│   └── App.jsx
```

**Technology Stack:**
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS + Custom CSS
- **Charts**: Recharts, D3.js
- **Maps**: Mapbox GL JS
- **Build Tool**: Vite
- **Testing**: Jest + React Testing Library

---

### 3.2 Backend Architecture

```
backend/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── community.routes.js
│   │   │   ├── business.routes.js
│   │   │   ├── companies.routes.js
│   │   │   └── ai.routes.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── communityController.js
│   │   │   ├── businessController.js
│   │   │   ├── companiesController.js
│   │   │   └── aiController.js
│   │   └── middleware/
│   │       ├── authentication.js
│   │       ├── authorization.js
│   │       ├── rateLimiter.js
│   │       ├── validation.js
│   │       └── errorHandler.js
│   ├── services/
│   │   ├── dataAggregation/
│   │   │   ├── newsAggregator.js
│   │   │   ├── permitsFetcher.js
│   │   │   ├── socialMediaMonitor.js
│   │   │   └── economicIndicators.js
│   │   ├── analysis/
│   │   │   ├── trendAnalysis.js
│   │   │   ├── sentimentAnalysis.js
│   │   │   ├── clusterAnalysis.js
│   │   │   └── predictiveModeling.js
│   │   ├── ai/
│   │   │   ├── chatbotService.js
│   │   │   ├── ragPipeline.js
│   │   │   ├── embeddingService.js
│   │   │   └── recommendationEngine.js
│   │   └── cache/
│   │       ├── redisClient.js
│   │       └── cacheManager.js
│   ├── models/
│   │   ├── Company.js
│   │   ├── Development.js
│   │   ├── Investment.js
│   │   ├── User.js
│   │   └── ChatSession.js
│   ├── database/
│   │   ├── connection.js
│   │   ├── migrations/
│   │   └── seeders/
│   ├── workers/
│   │   ├── dataFetcher.js
│   │   ├── analyzer.js
│   │   └── notifier.js
│   ├── websocket/
│   │   ├── server.js
│   │   └── handlers.js
│   └── utils/
│       ├── logger.js
│       ├── config.js
│       └── helpers.js
```

**Technology Stack:**
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js / Fastify
- **Real-time**: Socket.io
- **Queue**: Bull (Redis-based)
- **Caching**: Redis
- **Process Manager**: PM2

---

### 3.3 Database Architecture

#### Primary Database (PostgreSQL)
```sql
-- Core Tables
companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  industry VARCHAR(100),
  sub_industry VARCHAR(100),
  address TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  employees_count INTEGER,
  revenue_range VARCHAR(50),
  year_founded INTEGER,
  description TEXT,
  website VARCHAR(255),
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

developments (
  id UUID PRIMARY KEY,
  type VARCHAR(50),
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  impact_level VARCHAR(20),
  status VARCHAR(50),
  source VARCHAR(100),
  source_url TEXT,
  published_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP
)

investments (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  amount DECIMAL(15, 2),
  round_type VARCHAR(50),
  investors TEXT[],
  announced_date DATE,
  metadata JSONB,
  created_at TIMESTAMP
)

economic_indicators (
  id UUID PRIMARY KEY,
  indicator_type VARCHAR(100),
  value DECIMAL(15, 4),
  unit VARCHAR(50),
  period_start DATE,
  period_end DATE,
  source VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP
)

chat_sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  messages JSONB[],
  context JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### Vector Database (Pinecone/Weaviate)
- Company embeddings for semantic search
- Document embeddings for RAG
- News article embeddings

#### Time Series Database (TimescaleDB)
- Real-time metrics
- Historical trends
- Performance indicators

#### Cache Layer (Redis)
```
Cache Structure:
- dashboard:stats:{date} (TTL: 5 minutes)
- company:search:{query_hash} (TTL: 1 hour)
- trends:hourly:{metric} (TTL: 1 hour)
- news:latest (TTL: 5 minutes)
- websocket:sessions:{user_id}
```

---

## 4. Data Integration Layer

### 4.1 External Data Sources

```yaml
News & Media:
  - Charlotte Observer API
  - Charlotte Business Journal Feed
  - WBTV News API
  - Charlotte Agenda RSS

Government Data:
  - City of Charlotte Open Data Portal
  - Mecklenburg County GIS
  - NC Commerce Department
  - US Census Bureau API
  - Bureau of Labor Statistics

Business Data:
  - Crunchbase API (investments)
  - LinkedIn API (company insights)
  - Google Places API (business listings)
  - SEC EDGAR (public company filings)

Real Estate:
  - Zillow API
  - CoStar (commercial real estate)
  - City permit database

Social Signals:
  - Twitter/X API (sentiment analysis)
  - Reddit API (r/Charlotte monitoring)
  - Nextdoor Business API
```

### 4.2 Data Pipeline Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  External APIs  │────▶│   Fetchers   │────▶│  Validators  │
└─────────────────┘     └──────────────┘     └──────────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│   PostgreSQL    │◀────│ Transformers │◀────│   Cleaners   │
└─────────────────┘     └──────────────┘     └──────────────┘
         │                                            
         ▼                                            
┌─────────────────┐     ┌──────────────┐     
│  Redis Cache    │────▶│   WebSocket  │────▶ [Frontend]
└─────────────────┘     └──────────────┘     
```

---

## 5. AI/ML Architecture

### 5.1 AI Assistant Components

```python
ai_system/
├── embeddings/
│   ├── text_encoder.py      # BERT/Sentence Transformers
│   ├── index_builder.py     # Vector index creation
│   └── similarity_search.py # Semantic search
├── rag/
│   ├── retriever.py         # Document retrieval
│   ├── reranker.py          # Result reranking
│   └── generator.py         # Response generation
├── nlp/
│   ├── sentiment.py         # Sentiment analysis
│   ├── ner.py              # Named entity recognition
│   └── summarization.py    # Text summarization
├── recommendations/
│   ├── collaborative.py     # Collaborative filtering
│   ├── content_based.py    # Content-based filtering
│   └── hybrid.py           # Hybrid approach
└── models/
    ├── trend_predictor.py   # Time series forecasting
    ├── cluster_model.py     # Business clustering
    └── anomaly_detector.py  # Anomaly detection
```

### 5.2 AI Integration Points

1. **Chatbot Engine**
   - OpenAI GPT-4 / Claude API integration
   - Custom fine-tuned models for local context
   - RAG pipeline for company database queries

2. **Predictive Analytics**
   - Prophet for time series forecasting
   - XGBoost for classification tasks
   - LSTM for sequence prediction

3. **Computer Vision** (Future)
   - Satellite imagery analysis for development tracking
   - Construction progress monitoring

---

## 6. Security Architecture

### 6.1 Authentication & Authorization

```javascript
Security Stack:
├── Authentication
│   ├── JWT tokens (access + refresh)
│   ├── OAuth 2.0 (Google, Microsoft)
│   └── MFA support (TOTP)
├── Authorization
│   ├── Role-based access control (RBAC)
│   ├── Resource-level permissions
│   └── API key management
├── Data Protection
│   ├── AES-256 encryption at rest
│   ├── TLS 1.3 in transit
│   └── PII data masking
└── Monitoring
    ├── Audit logging
    ├── Intrusion detection
    └── Rate limiting
```

### 6.2 API Security

```yaml
Rate Limiting:
  Public endpoints: 100 requests/minute
  Authenticated: 1000 requests/minute
  AI endpoints: 20 requests/minute

CORS Policy:
  Origins: 
    - https://charlotte-econdev.com
    - https://app.charlotte-econdev.com
  Methods: GET, POST, PUT, DELETE
  Credentials: true

Input Validation:
  - SQL injection prevention
  - XSS protection
  - Request size limits
  - File upload scanning
```

---

## 7. Infrastructure & Deployment

### 7.1 Cloud Architecture (AWS)

```
┌──────────────────────────────────────────────┐
│                   CloudFront                  │
│              (CDN + DDoS Protection)          │
└────────────────────┬─────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐          ┌─────▼────┐
    │   S3     │          │   ALB    │
    │ (Static) │          │          │
    └──────────┘          └─────┬────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────▼────┐           ┌─────▼────┐
              │  ECS/EKS │           │  ECS/EKS │
              │  (API)   │           │ (Workers)│
              └─────┬────┘           └─────┬────┘
                    │                       │
         ┌──────────┴───────────────────────┴──┐
         │                                      │
    ┌────▼─────┐  ┌─────────┐  ┌──────────┐  ┌▼────────┐
    │   RDS    │  │ ElastiCache │ OpenSearch│ │ SQS/SNS │
    │(PostgreSQL)│ │  (Redis)  │ │         │  │         │
    └──────────┘  └─────────┘  └──────────┘  └─────────┘
```

### 7.2 Container Configuration

```dockerfile
# API Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

# Frontend Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 7.3 Kubernetes Configuration

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: econdev-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: econdev-api
  template:
    metadata:
      labels:
        app: econdev-api
    spec:
      containers:
      - name: api
        image: econdev/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: econdev-api-service
spec:
  selector:
    app: econdev-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: LoadBalancer
```

---

## 8. Monitoring & Analytics

### 8.1 Observability Stack

```
Monitoring Tools:
├── Metrics
│   ├── Prometheus (metrics collection)
│   ├── Grafana (visualization)
│   └── CloudWatch (AWS metrics)
├── Logging
│   ├── ELK Stack (Elasticsearch, Logstash, Kibana)
│   ├── CloudWatch Logs
│   └── Sentry (error tracking)
├── Tracing
│   ├── Jaeger (distributed tracing)
│   └── AWS X-Ray
└── Alerting
    ├── PagerDuty (incident management)
    ├── Slack (notifications)
    └── Email (reports)
```

### 8.2 Key Performance Indicators (KPIs)

```yaml
System Metrics:
  - API response time: < 200ms (p95)
  - Page load time: < 2s
  - Uptime: 99.9%
  - Error rate: < 0.1%

Business Metrics:
  - Daily active users
  - Query response accuracy
  - Data freshness (< 5 minutes)
  - AI recommendation CTR

Data Quality:
  - Company data completeness: > 95%
  - News aggregation success rate: > 98%
  - Duplicate detection accuracy: > 99%
```

---

## 9. Development Workflow

### 9.1 CI/CD Pipeline

```yaml
name: Deploy Pipeline
on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          npm test
          npm run test:e2e
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Build Docker images
        run: |
          docker build -t econdev/api:$GITHUB_SHA ./backend
          docker build -t econdev/frontend:$GITHUB_SHA ./frontend
      
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EKS
        run: |
          kubectl set image deployment/api api=econdev/api:$GITHUB_SHA
          kubectl set image deployment/frontend frontend=econdev/frontend:$GITHUB_SHA
```

### 9.2 Environment Strategy

```
Environments:
├── Development
│   ├── Local Docker Compose
│   ├── Hot reloading
│   └── Mock data available
├── Staging
│   ├── Production-like infrastructure
│   ├── Synthetic data
│   └── Integration testing
└── Production
    ├── Multi-region deployment
    ├── Auto-scaling enabled
    └── Full monitoring
```

---

## 10. API Documentation

### 10.1 RESTful Endpoints

```yaml
Dashboard:
  GET /api/v1/dashboard/stats
  GET /api/v1/dashboard/trends
  GET /api/v1/dashboard/alerts

Companies:
  GET /api/v1/companies
  GET /api/v1/companies/:id
  GET /api/v1/companies/search
  POST /api/v1/companies
  PUT /api/v1/companies/:id
  DELETE /api/v1/companies/:id

Community Pulse:
  GET /api/v1/community/events
  GET /api/v1/community/developments
  GET /api/v1/community/news
  GET /api/v1/community/trends
  WebSocket: /ws/community/live

Business Intelligence:
  GET /api/v1/business/analysis
  GET /api/v1/business/competitors
  GET /api/v1/business/opportunities
  GET /api/v1/business/predictions

AI Assistant:
  POST /api/v1/ai/chat
  GET /api/v1/ai/suggestions
  POST /api/v1/ai/feedback
```

### 10.2 WebSocket Events

```javascript
// Client -> Server
socket.emit('subscribe', { channels: ['developments', 'investments'] });
socket.emit('chat.message', { text: 'Show tech companies hiring' });

// Server -> Client
socket.on('development.new', (data) => { /* New development */ });
socket.on('metrics.update', (data) => { /* Real-time metrics */ });
socket.on('chat.response', (data) => { /* AI response */ });
```

---

## 11. Data Models & Schemas

### 11.1 Company Data Model

```typescript
interface Company {
  id: string;
  name: string;
  legalName?: string;
  dba?: string[];
  industry: Industry;
  subIndustry?: string;
  naicsCode?: string;
  sicCode?: string;
  
  location: {
    headquarters: Address;
    offices?: Address[];
    serviceAreas?: string[];
  };
  
  metrics: {
    employeeCount: number;
    employeeGrowthRate?: number;
    revenue?: RevenueRange;
    fundingTotal?: number;
    valuation?: number;
  };
  
  contact: {
    website?: string;
    email?: string;
    phone?: string;
    socialMedia?: SocialLinks;
  };
  
  timeline: {
    founded: Date;
    incorporated?: Date;
    acquired?: Date;
    ipoDate?: Date;
  };
  
  tags: string[];
  metadata: Record<string, any>;
  
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 12. Future Enhancements

### Phase 2 (Q2 2025)
- Mobile native apps (iOS/Android)
- Advanced predictive analytics
- Multi-language support
- API marketplace

### Phase 3 (Q3 2025)
- Blockchain integration for verified data
- AR visualization for development projects
- Automated report generation
- Partner portal

### Phase 4 (Q4 2025)
- ML-powered investment matching
- Satellite imagery analysis
- Economic simulation engine
- Regional expansion

---

## 13. Disaster Recovery

### 13.1 Backup Strategy

```yaml
Database Backups:
  - Automated snapshots: Every 6 hours
  - Point-in-time recovery: 7 days
  - Cross-region replication: us-east-1 → us-west-2
  - Monthly archives: S3 Glacier

Application State:
  - Redis persistence: AOF + RDB
  - Configuration backup: Git + AWS Secrets Manager
  - Media files: S3 versioning enabled

Recovery Objectives:
  - RTO (Recovery Time Objective): < 1 hour
  - RPO (Recovery Point Objective): < 15 minutes
```

### 13.2 Failover Procedures

```
Primary Region Failure:
1. DNS failover to secondary region (Route 53)
2. Promote read replica to primary
3. Scale up secondary region capacity
4. Notify stakeholders
5. Begin root cause analysis
```

---

## 14. Compliance & Governance

### 14.1 Data Privacy

```yaml
Compliance Standards:
  - GDPR (EU users)
  - CCPA (California users)
  - SOC 2 Type II
  - ISO 27001

Data Handling:
  - PII encryption
  - Right to deletion
  - Data portability
  - Consent management
  - Audit trails
```

### 14.2 Code Quality Standards

```javascript
// ESLint Configuration
{
  "extends": ["airbnb", "prettier"],
  "rules": {
    "complexity": ["error", 10],
    "max-lines": ["error", 300],
    "no-console": "error"
  }
}

// Testing Requirements
- Unit test coverage: > 80%
- Integration test coverage: > 70%
- E2E critical paths: 100%
```

---

## 15. Cost Optimization

### 15.1 Infrastructure Costs (Monthly Estimate)

```yaml
AWS Services:
  EC2/EKS: $800-1200
  RDS: $400-600
  ElastiCache: $200-300
  S3/CloudFront: $100-200
  Data Transfer: $100-200
  Total AWS: ~$1,600-2,500

Third-party APIs:
  OpenAI/Claude: $500-1000
  Maps/Geocoding: $200-300
  News APIs: $300-500
  Total APIs: ~$1,000-1,800

Total Monthly: $2,600-4,300
```

### 15.2 Optimization Strategies

- Auto-scaling based on traffic
- Reserved instances for predictable workloads
- Spot instances for batch processing
- CDN caching for static assets
- Database query optimization
- API response caching

---

## Appendix A: Technology Decision Matrix

| Component | Options Considered | Selected | Rationale |
|-----------|-------------------|----------|-----------|
| Frontend Framework | React, Vue, Angular | React | Ecosystem, performance, team expertise |
| State Management | Redux, MobX, Zustand | Redux Toolkit | Scalability, DevTools, middleware |
| Database | PostgreSQL, MongoDB, MySQL | PostgreSQL | ACID, JSON support, PostGIS |
| Cache | Redis, Memcached | Redis | Persistence, data structures |
| Search | Elasticsearch, Algolia | Elasticsearch | Self-hosted, flexibility |
| AI/ML | OpenAI, Claude, Cohere | OpenAI + Claude | Quality, API stability |
| Maps | Mapbox, Google Maps | Mapbox | Customization, pricing |
| Hosting | AWS, GCP, Azure | AWS | Services, regional presence |

---

## Appendix B: Contact & Support

**Development Team**
- Technical Lead: tech-lead@charlotte-econdev.com
- DevOps: devops@charlotte-econdev.com
- Support: support@charlotte-econdev.com

**Documentation**
- API Docs: https://docs.charlotte-econdev.com
- User Guide: https://help.charlotte-econdev.com
- Status Page: https://status.charlotte-econdev.com

---

*Document Version: 1.0*  
*Last Updated: August 2025*  
*Next Review: Q4 2025*