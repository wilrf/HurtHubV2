# GPT-5 AI Integration Guide

## ✨ Overview

This application now features cutting-edge GPT-5 integration with advanced capabilities:

- **GPT-5 Model** - Latest AI model with superior reasoning (Released August 2025)
- **Conversation Memory** - Persistent context across sessions
- **Deep Analysis** - Advanced business and code analysis
- **Streaming Responses** - Real-time AI responses
- **Semantic Search** - Find relevant conversations using AI

## 🚀 Quick Start

### 1. Set Up Environment Variables

Add your OpenAI API key to Vercel:

```bash
vercel env add OPENAI_API_KEY
```

Or add to `.env.local`:

```env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

Execute the Supabase schema for conversation memory:

```bash
npx supabase db push --file supabase/ai-conversation-schema.sql
```

### 4. Deploy to Vercel

```bash
git push origin main
```

## 📁 Project Structure

```
├── api/
│   ├── chat.ts         # GPT-5 chat endpoint
│   ├── analyze.ts      # Deep analysis endpoint
│   └── context.ts      # Conversation memory management
├── src/
│   ├── services/
│   │   └── aiService.ts    # AI service with GPT-5 integration
│   ├── hooks/
│   │   ├── useGPT5Chat.ts  # Enhanced chat hook with memory
│   │   └── useBusinessAIChat.ts  # Business-specific AI chat
│   └── pages/
│       └── GPT5Test.tsx    # Test page for GPT-5 features
```

## 🎯 Key Features

### 1. GPT-5 Chat with Memory

```typescript
import { useGPT5Chat } from "@/hooks/useGPT5Chat";

const chat = useGPT5Chat({
  model: "gpt-5",
  enableStreaming: true,
  enableMemory: true,
});
```

### 2. Deep Analysis

```typescript
import { performDeepAnalysis } from "@/services/aiService";

const analysis = await performDeepAnalysis({
  type: "business",
  data: businessData,
  depth: "deep",
});
```

### 3. Conversation Context

```typescript
import { retrieveContext, storeContext } from "@/services/aiService";

// Store conversation
await storeContext(sessionId, messages);

// Retrieve previous context
const context = await retrieveContext(sessionId);
```

## 🔧 API Endpoints

### `/api/chat` - GPT-5 Chat

- **Method**: POST
- **Body**:
  ```json
  {
    "messages": [...],
    "model": "gpt-5",
    "stream": true,
    "sessionId": "session_123"
  }
  ```

### `/api/analyze` - Deep Analysis

- **Method**: POST
- **Body**:
  ```json
  {
    "type": "business",
    "data": {...},
    "depth": "deep"
  }
  ```

### `/api/context` - Memory Management

- **Method**: POST
- **Actions**: store, retrieve, search, summarize

## 💡 Usage Examples

### Basic Chat

```typescript
const response = await createChatCompletion({
  messages: [{ role: "user", content: "Analyze our Q3 revenue" }],
  model: "gpt-5",
});
```

### Streaming Chat

```typescript
const response = await createChatCompletion({
  messages: [...],
  stream: true,
  sessionId: 'session_123'
});
```

### Business Analysis

```typescript
const analysis = await performDeepAnalysis({
  type: "market",
  data: marketData,
  depth: "deep",
  context: "Charlotte tech industry",
});
```

## 🧪 Testing

1. Navigate to `/gpt5-test` in your application
2. Test different models (GPT-5 vs GPT-5 Pro)
3. Try streaming vs non-streaming modes
4. Test conversation memory features
5. Perform deep analysis queries

## 📊 Database Schema

The system uses these Supabase tables:

- `ai_conversations` - Stores chat messages with embeddings
- `ai_session_summaries` - Conversation summaries
- `ai_user_preferences` - User-specific AI settings
- `ai_analytics` - Analysis results and insights
- `ai_feedback` - User feedback for improvement
- `ai_context_cache` - Performance cache

## 🔐 Security

- API keys stored in environment variables
- Row-level security on Supabase tables
- Rate limiting on API endpoints
- Secure token handling

## 💰 Cost Optimization

- **GPT-5**: ~$0.03/1K input + $0.06/1K output tokens
- **GPT-5 Pro**: Higher cost for extended reasoning
- Use caching for repeated queries
- Implement token limits per user

## 🐛 Troubleshooting

### "Invalid API Key" Error

- Verify `OPENAI_API_KEY` in Vercel environment
- Ensure key has GPT-5 access

### "Model not found" Error

- GPT-5 requires specific API access
- Fallback to `gpt-4-turbo` if needed

### Memory Not Working

- Check Supabase connection
- Verify `SUPABASE_SERVICE_ROLE_KEY`
- Run database migrations

## 📈 Next Steps

1. **Add User Authentication** - Link conversations to users
2. **Implement Rate Limiting** - Prevent API abuse
3. **Add Analytics Dashboard** - Track usage and costs
4. **Create Custom Prompts** - Industry-specific templates
5. **Build RAG System** - Connect to your business data

## 🤝 Support

For issues or questions:

- Check API status: https://status.openai.com
- Review logs in Vercel dashboard
- Test with `/gpt5-test` page

---

**Note**: GPT-5 was released in August 2025. Ensure your OpenAI account has access to the latest models.
