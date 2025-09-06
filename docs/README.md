# Charlotte Economic Development Platform

A comprehensive web application providing real-time economic intelligence, community monitoring, and business analytics for the Greater Charlotte metropolitan area.

🌐 **Live Demo:** [https://hurt-hub-v2.vercel.app](https://hurt-hub-v2.vercel.app)

## 🚀 Features

- **Dashboard** - Central navigation and key metrics overview
- **Community Pulse** - Real-time community development monitoring with news aggregation and trend analysis
- **Business Intelligence** - Advanced analytics including competitive analysis, sector performance, and market trends
- **AI Assistant** - Integrated chatbot backed by Supabase with **semantic search powered by vector embeddings** (see `embeddings-vector-search.md`).
- **Company Database** - Comprehensive search and filtering of 12,000+ local businesses
- **Real-time Updates** - WebSocket integration for live data feeds
- **Interactive Visualizations** - Charts, maps, and data displays

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS with custom design system
- **Routing**: React Router v6 with lazy loading
- **Charts**: Recharts + D3.js
- **Maps**: Mapbox GL JS
- **Testing**: Vitest + React Testing Library + Playwright
- **Quality**: ESLint + Prettier + TypeScript strict mode

## 📋 Prerequisites

- Node.js 18+
- npm 8+
- Git

## 🔧 Quick Start

**Note**: This project uses a **Vercel-only deployment strategy**. Local development is intentionally disabled.

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd charlotte-econdev-platform
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature
   ```

4. **Make your changes**

   ```bash
   # Edit files in your IDE
   # Run quality checks locally
   npm run quality
   ```

5. **Deploy to Vercel preview**

   ```bash
   git add .
   git commit -m "feat: your changes"
   git push origin feature/your-feature
   ```

6. **Test on preview URL**
   
   Vercel automatically creates a preview deployment.
   Access your changes at: `https://hurt-hub-v2-<hash>.vercel.app`

## 📜 Available Scripts

### Development

```bash
npm run dev              # ⚠️ Disabled - Shows "Local dev unsupported" message
npm run build            # Build for production
npm run deploy           # Deploy to Vercel preview
npm run deploy:prod      # Deploy to production
```

### Quality Assurance

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run type-check       # TypeScript type checking
npm run format           # Format with Prettier
npm run format:check     # Check formatting
npm run quality          # Run all quality checks
npm run quality:fix      # Fix all quality issues
```

### Testing

```bash
npm test                 # Run unit tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Run tests with coverage
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
npm run test:e2e:debug   # Debug E2E tests
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── layouts/         # Layout components
│   ├── forms/           # Form components
│   └── features/        # Feature-specific components
├── hooks/               # Custom React hooks
├── services/            # API services and business logic
├── store/               # Redux store and slices
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── constants/           # Application constants
├── contexts/            # React contexts
├── assets/              # Static assets
└── styles/              # Global styles
```

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                   | Description                    | Required |
| -------------------------- | ------------------------------ | -------- |
| `VITE_API_BASE_URL`        | Backend API URL                | Yes      |
| `VITE_WEBSOCKET_URL`       | WebSocket URL                  | Yes      |
| `VITE_OPENAI_API_KEY`      | OpenAI API key for AI features | No       |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox token for maps          | No       |
| `VITE_ENABLE_AI_FEATURES`  | Enable AI assistant            | No       |

## 🧪 Testing

### Unit Tests

```
```