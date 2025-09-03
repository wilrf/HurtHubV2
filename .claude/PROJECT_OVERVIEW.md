# Hurt Hub V2 - Project Overview

## 📋 Project Information

- **Name**: Charlotte Economic Development Platform (Hurt Hub V2)
- **Version**: 1.0.0
- **Description**: Real-time economic intelligence and business analytics platform for Charlotte, NC
- **Repository**: Private project focused on economic development and business intelligence

## 🏗️ Technical Architecture

### **Core Technology Stack**

#### Frontend

- **Framework**: React 18.2.0 + TypeScript
- **Build Tool**: Vite 7.1.4
- **Styling**: TailwindCSS 3.3.3 with custom design system
- **State Management**: Redux Toolkit + React Redux
- **Routing**: React Router DOM 6.15.0
- **Forms**: React Hook Form + Zod validation
- **UI Components**: Custom components with Headless UI + Lucide Icons
- **Animations**: Framer Motion
- **Charts**: Recharts for data visualization

#### Backend & APIs

- **Runtime**: Vercel Edge Functions (Node.js)
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4o-mini API
- **Authentication**: Supabase Auth
- **Real-time**: Socket.IO + SWR for data fetching

#### Development Tools

- **TypeScript**: 5.0.2 with strict mode
- **Linting**: ESLint 9 with TypeScript support
- **Testing**: Vitest + Playwright for E2E
- **Code Quality**: Prettier, Husky, lint-staged
- **Deployment**: Vercel with automated CI/CD

### **Key Features & Modules**

#### 1. **Business Intelligence** (`/business-intelligence`)

- Real-time business analytics and insights
- AI-powered market analysis with OpenAI integration
- Revenue, employment, and industry performance metrics
- Geographic business distribution analysis
- Competitive landscape intelligence

#### 2. **Community Pulse** (`/community-pulse`)

- Community engagement and sentiment analysis
- Local business network analysis
- Economic impact assessment
- Neighborhood business clustering patterns

#### 3. **AI Assistant System**

- Multi-modal AI chat interface (`BusinessAIChat` component)
- Context-aware responses with business data integration
- Conversation persistence and session management
- Real-time business data queries and analysis

#### 4. **Business Search & Profiles**

- Advanced business search with filtering
- Detailed company profiles and analytics
- Geographic and industry-based discovery
- Performance benchmarking tools

## 📁 Project Structure

```
├── api/                      # Vercel Edge Functions
│   ├── ai-chat-simple.ts     # Main AI chat endpoint
│   ├── health-check.ts       # System health monitoring
│   ├── data-query.ts         # Business data queries
│   └── context.ts            # AI conversation context
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ai/              # AI chat components
│   │   ├── ui/              # Design system components
│   │   ├── search/          # Business search components
│   │   └── layouts/         # Layout components
│   ├── pages/               # Route page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # Business logic & API clients
│   ├── store/               # Redux store configuration
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── config/              # Environment configuration
├── scripts/                 # Build and deployment scripts
│   ├── validate-deployment.cjs  # Pre-deployment validation
│   ├── validate-docs.cjs    # Documentation validation
│   └── update-docs.cjs      # Auto-update documentation
├── tests/                   # Test files (unit + E2E)
├── api-docs/               # API and configuration documentation
├── .env                    # Local development secrets (not in git)
├── .env.production         # Production template (not in git)
├── .env.example           # Developer template (in git)
├── ENV_GUIDE.md           # Complete environment setup guide
└── .env-backup/           # Archived old env files (can delete)
```

## 🗄️ Database Architecture

### **Supabase Tables**

- **`companies`** - Business entity information (299+ Charlotte businesses)
- **`ai_conversations`** - Chat history and conversation logs
- **`ai_session_summaries`** - Session metadata and summaries
- **`developments`** - Business development news and updates
- **`economic_indicators`** - Regional economic data (GDP, unemployment, etc.)

### **Key Relationships**

- Companies ←→ Developments (business news)
- AI Conversations → Sessions (conversation grouping)
- Economic Indicators → Regional analysis

## 🤖 AI Integration

### **OpenAI GPT-4o-mini Integration**

- **Primary Endpoint**: `/api/ai-chat-simple`
- **Model**: gpt-4o-mini (configurable)
- **Context Enhancement**: Real-time business data injection
- **Features**:
  - Smart business data retrieval based on user queries
  - Context-aware conversation management
  - Industry-specific analysis and insights
  - Session persistence and summaries

### **AI Chat Flow**

```
User Input → BusinessAIChat → useBusinessAIChat →
/api/ai-chat-simple → Supabase Data Query →
OpenAI API → Context Enhancement → Response → UI
```

## 🔒 Security & Environment

### **Environment Variables**

- **Client-side** (VITE\_ prefix): UI configuration, public API endpoints
- **Server-side**: OpenAI API keys, Supabase service role keys
- **Security**: API keys never exposed to browser, server-side only

### **Authentication & Authorization**

- Supabase Auth for user management
- Row-level security (RLS) policies
- Protected API endpoints with proper validation

## 📊 Business Intelligence Features

### **Analytics Dashboards**

- Market size and revenue analysis
- Employment impact metrics
- Industry diversity and performance
- Geographic business distribution
- Business maturity and age analysis

### **AI-Powered Insights**

- Context-aware business queries
- Industry trend analysis
- Competitive landscape intelligence
- Market opportunity identification
- Performance benchmarking

## 🚀 Deployment & DevOps

### **Deployment Pipeline**

- **Platform**: Vercel with Edge Functions
- **CI/CD**: Automated builds on push
- **Environment Management**: Vercel environment variables
- **Monitoring**: Built-in health checks and logging

### **Development Workflow**

```bash
# Local Development
npm run dev              # Start development server
npm run quality          # Run linting and type checking
npm run test             # Run unit tests
npm run test:e2e         # Run end-to-end tests

# Deployment
npm run build           # Production build
npm run deploy:prod     # Deploy to production
```

## 🔧 Configuration Files

- **`package.json`** - Dependencies and scripts
- **`vite.config.ts`** - Build configuration and aliases
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.js`** - Styling and design system
- **`vercel.json`** - Deployment configuration
- **`CLAUDE.md`** - Project development guidelines

## 📈 Performance Optimizations

### **Frontend Optimizations**

- **Code Splitting**: Vendor, router, Redux, UI chunks
- **Lazy Loading**: Route-based and component-based
- **Caching**: SWR for data fetching with smart caching
- **Bundle Size**: Chunk size warnings at 512KB

### **API Optimizations**

- **Edge Functions**: Fast global response times
- **Database Connection**: Supavisor pooling for PostgreSQL
- **AI Context**: Smart data retrieval to minimize API calls

## 🧪 Testing Strategy

### **Testing Stack**

- **Unit Tests**: Vitest with Jest DOM
- **Integration Tests**: React Testing Library
- **End-to-End**: Playwright with multi-browser support
- **Coverage**: V8 coverage reporting
- **Test UI**: Vitest UI for visual test running

### **Quality Assurance**

- **Code Quality**: ESLint + Prettier + TypeScript strict mode
- **Pre-commit Hooks**: Husky + lint-staged
- **CI Pipeline**: Automated testing on deployment
- **Type Safety**: Full TypeScript coverage

## 📚 Documentation Structure

### **Core Documentation** (`.claude/` directory)

- **`PROJECT_OVERVIEW.md`** - This document, high-level architecture
- **`API_INDEX.md`** - Complete API endpoint documentation
- **`FRONTEND_INDEX.md`** - React components and frontend architecture
- **`DATABASE_INDEX.md`** - Database schema and query patterns
- **`DEVELOPMENT.md`** - Development setup and workflow
- **`ARCHITECTURE_CICD.md`** - 🆕 Architecture patterns, CI/CD, and deployment

### **Project Documentation**

- **`CLAUDE.md`** - Development guidelines and rules
- **`api-docs/`** - API endpoint documentation
- **`ENV_GUIDE.md`** - 🆕 Environment setup guide (9→3 files cleanup)
- **`.env.example`** - 🆕 Comprehensive template with security notes
- **`.claude/`** - Complete codebase documentation

## 🎯 Key Success Metrics

- **Business Data**: 299+ Charlotte businesses indexed
- **AI Integration**: GPT-4o-mini with real business context
- **Performance**: Sub-2s page loads, efficient caching
- **Security**: Zero client-side API key exposure, clean environment management
- **Developer Experience**: Type-safe, well-documented, tested, secure env setup
- **Environment Management**: 🆕 Simplified from 9→3 files, no newlines, proper gitignore

---

_Generated: 2025-09-02_  
_Last Updated: Based on codebase analysis_  
_Total Files Analyzed: 100+_
