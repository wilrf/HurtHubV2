# Embeddings & Vector Search Guide

_Last updated 2024-06-09_

## 1  Purpose
Explain how we generate OpenAI embeddings for every company, store them in pgvector on Supabase, and query them via the `semantic_business_search` function.

## 2  End-to-end data flow
```text
User Query ─▶ /api/ai-search
            (1) OpenAI embeddings.create → query vector
            (2) supabase.rpc('semantic_business_search', …)
            (3) merge with keyword fallback  → JSON response
```

## 3  Database setup
Run `supabase/vector-setup.sql` once:
* enables `vector` extension  
* adds `businesses.embedding vector(1536)`  
* IVFFlat index `businesses_embedding_idx`  
* function `semantic_business_search()`  
* table `embedding_updates` for tracking

## 4  Generating embeddings
Endpoint: `POST /api/generate-embeddings`

Body (all optional):
```json
{ "batchSize": 20, "forceRegenerate": false, "companyIds": [] }
```
The endpoint selects companies without vectors, calls OpenAI `text-embedding-3-small`, saves vectors, logs to `embedding_updates`.

## 5  Query-time semantic search
Helpers:
| File | Function | Notes |
| ---- | -------- | ----- |
| api/ai-search.ts | performSemanticSearch | pure semantic & hybrid |
| api/unified-search.ts | performSemanticSearch | hybrid + filters |
| api/context.ts | performSemanticSearch | chat-history search |

Each calls `semantic_business_search(query_embedding, 0.3, limit)`.

## 6  Testing it works
1. `npx playwright test tests/vercel-api-tests.spec.ts` – check console for “Semantic search ACTIVE”.
2. `node test-database-first.mjs` – prints similarity scores.
3. Add a Vitest unit spec (`tests/vector-search.spec.ts`) for direct RPC testing.

## 7  Troubleshooting
| Symptom | Fix |
| ------- | --- |
| No semantic results | Ensure vectors exist (`select count(*) from businesses where embedding is not null`) |
| RPC error | Confirm `vector-setup.sql` ran and user has function EXECUTE perms |
| Rate-limit 429 | Lower batchSize or add delay in generator |

---
For questions open an issue or ping **#ai-search** on Slack.
