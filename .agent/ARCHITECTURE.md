# Architecture — Muse Journaling App

## System Diagram

```
┌─────────────────────────────────────────────────────┐
│                     Vercel (Edge/Serverless)         │
│                                                      │
│   Next.js App                                        │
│   ┌────────────┐    ┌──────────────────────────┐    │
│   │  Pages /   │    │    API Routes             │    │
│   │  App Router│───▶│  /api/auth (NextAuth)     │    │
│   │            │    │  /api/journal (CRUD)      │    │
│   │  - /       │    │  /api/recall (RAG)        │    │
│   │  - /journal│    └──────────┬───────────────┘    │
│   │  - /entries│               │                     │
│   └────────────┘               │                     │
└───────────────────────────────┼─────────────────────┘
                                │
              ┌─────────────────┼──────────────────┐
              │                 │                  │
              ▼                 ▼                  ▼
    ┌──────────────┐  ┌─────────────────┐  ┌──────────────┐
    │ MongoDB Atlas│  │  OpenAI API     │  │ Anthropic    │
    │              │  │                 │  │ Claude API   │
    │ Collections: │  │ text-embedding  │  │              │
    │  - users     │  │ -3-small        │  │ RAG answers  │
    │  - entries   │  │ (1536 dims)     │  │ streaming    │
    │              │  └─────────────────┘  └──────────────┘
    │ Vector Index:│
    │  on embedding│
    │  field (HNSW)│
    └──────────────┘
```

## Data Flow: Save Journal Entry

```
Client (JournalEditor)
    │ POST /api/journal { title, body, mood }
    ▼
API Route (server-side)
    │ 1. Validate session → get userId
    │ 2. Sanitize input
    │ 3. Insert entry to MongoDB (without embedding) → get entryId
    │ 4. [Async] Generate embedding:
    │      OpenAI.embeddings.create({ input: title + body })
    │ 5. [Async] Update entry with embedding vector
    │ 6. Return 201 with entryId immediately
    ▼
Client receives entryId
    │ AutoSave status → "Saved"
    │ Navigate to entries or stay in editor
```

## Data Flow: RAG Recall

```
Client (RecallInput)
    │ POST /api/recall { query }
    ▼
API Route (server-side)
    │ 1. Validate session → get userId
    │ 2. Embed the query: OpenAI.embeddings.create({ input: query })
    │ 3. MongoDB Atlas Vector Search:
    │      $vectorSearch: {
    │        index: "journal_embedding_index",
    │        path: "embedding",
    │        queryVector: queryEmbedding,
    │        numCandidates: 50,
    │        limit: 5,
    │        filter: { userId: userId }   ← CRITICAL: per-user scoping
    │      }
    │ 4. Format retrieved entries as context
    │ 5. Build Claude prompt:
    │      system: journaling companion instructions
    │      user: [context from entries] + actual query
    │ 6. Stream Claude response back via ReadableStream
    ▼
Client receives streamed text + entry IDs as citations
```

## MongoDB Schema

### users collection
```ts
{
  _id: ObjectId,
  email: string,         // unique
  name: string,
  image: string,         // Google avatar URL
  googleId: string,      // unique
  createdAt: Date,
  lastLoginAt: Date
}
```

### entries collection
```ts
{
  _id: ObjectId,
  userId: ObjectId,      // ref: users._id — ALWAYS indexed
  title: string,
  body: string,          // plain text
  mood: 'calm' | 'happy' | 'anxious' | 'sad' | 'grateful' | null,
  wordCount: number,
  createdAt: Date,
  updatedAt: Date,
  embedding: number[]    // 1536-dim float array — Atlas Vector Search index
}

// Indexes:
// { userId: 1, createdAt: -1 }  — list queries
// { userId: 1 } on text index   — keyword search
// Atlas Vector Search on embedding with filter on userId
```

## Next.js App Router Structure

```
src/
  app/
    (auth)/
      login/
        page.tsx          # Login page
    (app)/
      layout.tsx          # Authenticated layout with Navbar
      page.tsx            # Dashboard (entry list + recall)
      journal/
        new/
          page.tsx        # New journal editor
        [id]/
          page.tsx        # Entry detail / edit
    api/
      auth/
        [...nextauth]/
          route.ts        # NextAuth handler
      journal/
        route.ts          # GET (list), POST (create)
        [id]/
          route.ts        # GET, PUT, DELETE
      recall/
        route.ts          # POST (RAG query)

  components/
    ui/                   # Primitive components
    journal/              # Journal-specific components
    layout/               # Navbar, PageWrapper, etc.

  lib/
    db/
      client.ts           # MongoDB singleton connection
      collections.ts      # Typed collection accessors
    auth/
      options.ts          # NextAuth config
    embeddings/
      generate.ts         # OpenAI embedding wrapper
    rag/
      pipeline.ts         # Vector search + Claude prompt construction
    validations/
      journal.ts          # Zod schemas for journal input

  hooks/
    useAutoSave.ts
    useWordFadeIn.ts
    useJournalEntries.ts  # SWR/TanStack Query hook

  types/
    journal.ts
    user.ts
    api.ts

  styles/
    globals.css
    animations.css        # Keyframe definitions
```

## Authentication Flow

```
User visits /dashboard
    │ Middleware checks session (next-auth middleware)
    │ No session → redirect to /login
    ▼
/login page
    │ "Sign in with Google" button
    │ NextAuth handles OAuth flow
    │ On success: upsert user in MongoDB
    │ Set session JWT
    ▼
Redirect to /dashboard
    │ Session available server-side and client-side
    │ userId embedded in JWT — used for all DB queries
```

## Deployment Architecture

```
GitHub repo
    │ Push to main
    ▼
Vercel CI
    │ tsc --noEmit (type check)
    │ npm run lint
    │ npm run test
    │ Next.js build
    ▼
Vercel Edge Network
    │ Static assets → CDN
    │ API routes → Serverless Functions (Node.js runtime)
    │ Serverless functions connect to MongoDB Atlas via connection pooling
```

## Environment Configuration

```bash
# .env.local (never commit)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>

MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/muse?retryWrites=true&w=majority

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
