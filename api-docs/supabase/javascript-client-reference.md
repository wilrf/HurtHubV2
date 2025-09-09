# Supabase JavaScript Client API Reference

## Installation

```bash
npm install @supabase/supabase-js
```

## Client Initialization

### Basic Setup

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
```

### With Options

```javascript
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce", // or 'implicit'
  },
  global: {
    headers: { "x-custom-header": "my-app" },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

## Database Operations

### Select (Read)

```javascript
// Basic select
const { data, error } = await supabase.from("users").select();

// Select specific columns
const { data, error } = await supabase.from("users").select("id, name, email");

// With joins
const { data, error } = await supabase.from("users").select(`
    id,
    name,
    posts (
      id,
      title
    )
  `);

// With count
const { data, count, error } = await supabase
  .from("users")
  .select("*", { count: "exact" });
```

### Insert

```javascript
// Single insert
const { data, error } = await supabase
  .from("users")
  .insert({ name: "John", email: "john@example.com" })
  .select();

// Multiple inserts
const { data, error } = await supabase
  .from("users")
  .insert([
    { name: "John", email: "john@example.com" },
    { name: "Jane", email: "jane@example.com" },
  ])
  .select();

// Upsert (insert or update)
const { data, error } = await supabase
  .from("users")
  .upsert({ id: 1, name: "Updated Name" })
  .select();
```

### Update

```javascript
// Update single record
const { data, error } = await supabase
  .from("users")
  .update({ name: "New Name" })
  .eq("id", 1)
  .select();

// Update multiple records
const { data, error } = await supabase
  .from("users")
  .update({ active: true })
  .in("id", [1, 2, 3])
  .select();
```

### Delete

```javascript
// Delete single record
const { error } = await supabase.from("users").delete().eq("id", 1);

// Delete multiple records
const { error } = await supabase.from("users").delete().in("id", [1, 2, 3]);
```

## Filters

### Comparison Operators

```javascript
// Equal
.eq('column', 'value')

// Not equal
.neq('column', 'value')

// Greater than
.gt('column', value)

// Greater than or equal
.gte('column', value)

// Less than
.lt('column', value)

// Less than or equal
.lte('column', value)

// Pattern matching
.like('column', '%pattern%')
.ilike('column', '%pattern%') // case insensitive

// In array
.in('column', ['value1', 'value2'])

// Contains (for arrays/jsonb)
.contains('column', ['value'])

// Contained by
.containedBy('column', ['value1', 'value2'])

// Is null
.is('column', null)

// Range
.range('column', 'start', 'end')
```

### Logical Operators

```javascript
// AND (chaining)
const { data } = await supabase
  .from("users")
  .select()
  .eq("active", true)
  .gte("age", 18);

// OR
const { data } = await supabase
  .from("users")
  .select()
  .or("age.gte.18,status.eq.verified");

// NOT
const { data } = await supabase
  .from("users")
  .select()
  .not("status", "eq", "banned");
```

## Query Modifiers

```javascript
// Order by
.order('created_at', { ascending: false })

// Limit
.limit(10)

// Range (pagination)
.range(0, 9) // first 10 records

// Single row
.single()

// Maybe single (doesn't error if no rows)
.maybeSingle()
```

## Authentication

### Sign Up

```javascript
// Email/password signup
const { data, error } = await supabase.auth.signUp({
  email: "user@example.com",
  password: "password",
  options: {
    data: {
      first_name: "John",
      age: 27,
    },
    emailRedirectTo: "https://example.com/welcome",
  },
});

// Phone signup
const { data, error } = await supabase.auth.signUp({
  phone: "+13334445555",
  password: "password",
});
```

### Sign In

```javascript
// Email/password
const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "password",
});

// Magic link
const { data, error } = await supabase.auth.signInWithOtp({
  email: "user@example.com",
  options: {
    emailRedirectTo: "https://example.com/welcome",
  },
});

// OAuth
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "github",
  options: {
    redirectTo: "https://example.com/auth/callback",
    scopes: "repo gist",
  },
});
```

### Session Management

```javascript
// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();

// Get session
const {
  data: { session },
} = await supabase.auth.getSession();

// Refresh session
const { data, error } = await supabase.auth.refreshSession();

// Sign out
const { error } = await supabase.auth.signOut();

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log(event, session);
});
```

### User Management

```javascript
// Update user metadata
const { data, error } = await supabase.auth.updateUser({
  data: { hello: "world" },
});

// Update email
const { data, error } = await supabase.auth.updateUser({
  email: "new@example.com",
});

// Update password
const { data, error } = await supabase.auth.updateUser({
  password: "new-password",
});

// Reset password
const { data, error } = await supabase.auth.resetPasswordForEmail(
  "user@example.com",
  { redirectTo: "https://example.com/update-password" },
);
```

## Real-time Subscriptions

### Database Changes

```javascript
// Subscribe to all changes
const channel = supabase
  .channel("db-changes")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "users",
    },
    (payload) => console.log(payload),
  )
  .subscribe();

// Specific events
const channel = supabase
  .channel("inserts")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "users",
      filter: "age=gte.18",
    },
    (payload) => console.log("New user:", payload.new),
  )
  .subscribe();

// Unsubscribe
await supabase.removeChannel(channel);
```

### Broadcast

```javascript
// Send message
const channel = supabase.channel("room1");

channel.subscribe((status) => {
  if (status === "SUBSCRIBED") {
    channel.send({
      type: "broadcast",
      event: "message",
      payload: { text: "Hello world" },
    });
  }
});

// Receive messages
channel.on("broadcast", { event: "message" }, (payload) =>
  console.log(payload),
);
```

### Presence

```javascript
const channel = supabase.channel("online-users");

// Track presence
channel.on("presence", { event: "sync" }, () => {
  const state = channel.presenceState();
  console.log("Online users:", state);
});

// Subscribe and track
channel.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    await channel.track({
      online_at: new Date().toISOString(),
      user_id: user.id,
    });
  }
});
```

## Storage

### Buckets

```javascript
// List buckets
const { data, error } = await supabase.storage.listBuckets();

// Create bucket
const { data, error } = await supabase.storage.createBucket("avatars", {
  public: true,
  allowedMimeTypes: ["image/*"],
  fileSizeLimit: 1024 * 1024 * 5, // 5MB
});

// Get bucket
const { data, error } = await supabase.storage.getBucket("avatars");

// Delete bucket
const { data, error } = await supabase.storage.deleteBucket("avatars");
```

### Files

```javascript
// Upload file
const { data, error } = await supabase.storage
  .from("avatars")
  .upload("public/avatar.png", file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "image/png",
  });

// Download file
const { data, error } = await supabase.storage
  .from("avatars")
  .download("public/avatar.png");

// Get public URL
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl("public/avatar.png");

// Create signed URL
const { data, error } = await supabase.storage
  .from("avatars")
  .createSignedUrl("private/avatar.png", 60); // 60 seconds

// List files
const { data, error } = await supabase.storage.from("avatars").list("public", {
  limit: 100,
  offset: 0,
});

// Delete files
const { data, error } = await supabase.storage
  .from("avatars")
  .remove(["public/avatar.png"]);

// Move file
const { data, error } = await supabase.storage
  .from("avatars")
  .move("public/avatar.png", "private/avatar.png");

// Copy file
const { data, error } = await supabase.storage
  .from("avatars")
  .copy("public/avatar.png", "backup/avatar.png");
```

## Edge Functions

```javascript
// Invoke function
const { data, error } = await supabase.functions.invoke("hello-world", {
  body: { name: "Functions" },
  headers: {
    "my-custom-header": "my-custom-header-value",
  },
});
```

## RPC (Remote Procedure Call)

```javascript
// Call stored procedure
const { data, error } = await supabase.rpc("get_user_count", { min_age: 18 });
```

## Error Handling

```javascript
try {
  const { data, error } = await supabase.from("users").select();

  if (error) throw error;

  // Handle data
  console.log(data);
} catch (error) {
  console.error("Error:", error.message);
  console.error("Details:", error.details);
  console.error("Hint:", error.hint);
  console.error("Code:", error.code);
}
```

## TypeScript Support

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/supabase";

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Now you get full type safety
const { data, error } = await supabase
  .from("users")
  .select("id, name, email")
  .returns<User[]>();
```

## Advanced Features

### Abort Requests

```javascript
const controller = new AbortController();

const { data, error } = await supabase
  .from("users")
  .select()
  .abortSignal(controller.signal);

// Cancel request
controller.abort();
```

### Custom Fetch

```javascript
const supabase = createClient(url, key, {
  global: {
    fetch: customFetch,
  },
});
```

### Response Types

```javascript
// CSV
const { data, error } = await supabase.from("users").select().csv();

// Single object
const { data, error } = await supabase.from("users").select().single();

// Maybe single (no error if 0 rows)
const { data, error } = await supabase.from("users").select().maybeSingle();
```
