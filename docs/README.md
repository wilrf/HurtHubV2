# Charlotte Economic Development Platform

A comprehensive web application providing real-time economic intelligence, community monitoring, and business analytics for the Greater Charlotte metropolitan area.

🌐 **Live Demo:** [https://hurt-hub-v2.vercel.app](https://hurt-hub-v2.vercel.app)

## 🚀 Features

- **Dashboard** - Central navigation and key metrics overview
- **Community Pulse** - Real-time community development monitoring with news aggregation and trend analysis
- **Business Intelligence** - Advanced analytics including competitive analysis, sector performance, and market trends  
- **AI Assistant** - Integrated chatbot with RAG pipeline for intelligent queries
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

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd charlotte-econdev-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📜 Available Scripts

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production  
npm run preview          # Preview production build
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

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | Yes |
| `VITE_WEBSOCKET_URL` | WebSocket URL | Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI features | No |
| `VITE_MAPBOX_ACCESS_TOKEN` | Mapbox token for maps | No |
| `VITE_ENABLE_AI_FEATURES` | Enable AI assistant | No |

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage
npm test Button            # Test specific component
```

### E2E Tests  
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:headed    # Run with browser UI
npm run test:e2e:debug     # Debug mode
npx playwright test --list # List available tests
```

## 📊 Data Architecture

The platform integrates with multiple data sources:

- **Government Data**: City of Charlotte Open Data, Mecklenburg County GIS
- **Business Data**: Crunchbase API, LinkedIn API, Google Places
- **News Sources**: Charlotte Observer, Charlotte Business Journal, WBTV  
- **Real Estate**: Zillow API, CoStar, city permit database

## 🤖 AI Features

When enabled, the platform includes:

- **Chat Interface** - Natural language queries about local business data
- **RAG Pipeline** - Context-aware responses using company database  
- **Predictive Analytics** - Time series forecasting and trend analysis
- **Sentiment Analysis** - News and social media monitoring

## 🚢 Deployment

### Development
```bash
npm run build
npm run preview
```

### Production (Vercel)
```bash
npx vercel --prod
```

### Docker
```bash
docker build -t charlotte-econdev .
docker run -p 3000:3000 charlotte-econdev
```

## 🔧 Configuration

### Tailwind CSS
Custom design system with:
- Primary color palette (Dark Sapphire theme)
- Consistent spacing scale
- Custom animations and transitions  
- Mobile-first responsive breakpoints

### Code Quality
- **ESLint**: Airbnb config + accessibility rules
- **Prettier**: Consistent formatting + Tailwind plugin
- **TypeScript**: Strict mode with path mapping
- **Husky**: Pre-commit hooks for quality checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the code quality standards
4. Run quality checks: `npm run quality`  
5. Commit with conventional format: `git commit -m 'feat: add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Commit Message Format
```
type(scope): description

feat(dashboard): add real-time metrics display
fix(api): handle rate limiting errors
docs(readme): update installation instructions
```

## 📚 Architecture Documentation

For detailed technical specifications, see:
- `charlotte-econdev-architecture.md` - Complete system architecture
- `CLAUDE.md` - Development workflow and best practices

## 🐛 Troubleshooting

### Common Issues

**Build fails with memory error:**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**TypeScript errors:**
```bash
npm run type-check
# Fix type errors, then retry build
```

**E2E tests failing:**
```bash
npx playwright install  # Reinstall browsers
npm run test:e2e:debug  # Debug specific test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support  

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions  
- **Email**: support@charlotte-econdev.com

---

Built with ❤️ for the Charlotte economic development community#
