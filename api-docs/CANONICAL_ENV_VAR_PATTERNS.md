# Canonical Environment Variable Patterns

**Source Documentation:**

- Vite: https://vite.dev/guide/env-and-mode.html
- https://supabase.com/docs/guides/api/api-keys

## 🎯 Framework-Specific Patterns

### **Vite + React (Our Stack)**

#### Client-Side (Browser Accessible)

```typescript
// Accessible in React components via import.meta.env
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Environment variables:
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon-key
```

#### Server-Side (API Routes Only)

```typescript
// Vercel API functions - NO VITE_ prefix
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Environment variables:
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...service-role-key
OPENAI_API_KEY=sk-proj-...
```

### **Next.js (Reference - Not Our Stack)**

```typescript
// Client-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Server-side - same as Vite server-side
```

## 🔒 Security Rules

### **Vite Security Model (Official)**

- **`VITE_*`**: Exposed to browser, included in client bundle
- **No prefix**: Server-side only, never exposed to browser
- **Never put secrets in `VITE_*` variables**

### **Variable Access Patterns**

```typescript
// ✅ CLIENT-SIDE (React components)
import.meta.env.VITE_SUPABASE_URL; // Public URL
import.meta.env.VITE_SUPABASE_ANON_KEY; // Public anon key

// ✅ SERVER-SIDE (Vercel API functions)
process.env.SUPABASE_URL; // Can be same as client URL
process.env.SUPABASE_SERVICE_ROLE_KEY; // SECRET - bypasses RLS
process.env.OPENAI_API_KEY; // SECRET - API access
```

## 🚨 Common Configuration Errors

### **Error 1: Using VITE\_ in Server Code**

```typescript
// ❌ WRONG - Server-side code cannot access VITE_ vars
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL; // undefined!
}

// ✅ CORRECT - Use non-prefixed vars
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL; // works!
}
```

### **Error 2: Missing Prefixes in Client Code**

```typescript
// ❌ WRONG - Client cannot access non-prefixed vars
const supabase = createClient(
  process.env.SUPABASE_URL, // undefined in browser!
);

// ✅ CORRECT - Use VITE_ prefix
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, // works in browser!
);
```

### **Error 3: Exposing Secrets Client-Side**

```typescript
// ❌ WRONG - Exposes secret to browser
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...secret

// ✅ CORRECT - Keep secrets server-side
SUPABASE_SERVICE_ROLE_KEY=eyJ...secret
```

## 📋 Environment Variable Checklist

### **Required for Client-Side**

- ✅ `VITE_SUPABASE_URL` - Supabase project URL
- ✅ `VITE_SUPABASE_ANON_KEY` - Public anon key (safe with RLS)

### **Required for Server-Side APIs**

- ✅ `SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Admin access key (bypasses RLS)
- ✅ `OPENAI_API_KEY` - OpenAI API access

### **Auto-Added by Vercel Supabase Integration**

- `SUPABASE_SUPABASE_URL` - Mirror of SUPABASE_URL
- `SUPABASE_SUPABASE_ANON_KEY` - Mirror of anon key
- `SUPABASE_SUPABASE_SERVICE_ROLE_KEY` - Mirror of service key

## 🧪 Testing Configuration

### **Verify Client-Side Access**

```typescript
// In React component - should log URLs
console.log("Client URL:", import.meta.env.VITE_SUPABASE_URL);
console.log("Client Key:", import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### **Verify Server-Side Access**

```typescript
// In API function - should log URLs
console.log("Server URL:", process.env.SUPABASE_URL);
console.log("Service Key:", process.env.SUPABASE_SERVICE_ROLE_KEY);
```

## 📚 Reference Links

- [Vite Environment Variables](https://vite.dev/guide/env-and-mode.html)
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/initializing)

---

_Generated: 2025-01-03_  
_Based on: Official Vite and Supabase documentation_
