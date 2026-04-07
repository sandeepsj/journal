# Stage 1 — Journal 2.0: Drive SPA Migration

## Goal

Migrate Muse from Next.js + MongoDB + Vercel to a **React SPA** hosted on **GitHub Pages**, with **Google Drive** as the sole data store. Vercel is retained only as a lightweight serverless proxy for AI API calls. User owns all their data.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Pages (free)                   │
│                                                         │
│  React SPA (Vite build)                                 │
│  ├── Google OAuth via GIS                               │
│  ├── Google Drive API ──────────► Google Drive           │
│  │     (journal CRUD, direct)      (appDataFolder)      │
│  ├── Transformers.js WebWorker                          │
│  │     (client-side embeddings)                         │
│  └── In-memory cosine similarity                        │
│        (vector search)                                  │
└────────────┬────────────────────────────────────────────┘
             │ Authorization: Bearer <google_token>
             ▼
┌─────────────────────────────────────────────────────────┐
│               Vercel Serverless (free tier)              │
│                                                         │
│  api/embed.ts ──────────────────► OpenAI API            │
│  api/recall.ts ─────────────────► Claude API            │
│  api/eemo.ts ───────────────────► Claude API            │
│                                                         │
│  • Stateless proxy — zero data stored                   │
│  • API keys in Vercel env vars (never exposed)          │
│  • Auth: validates Google token on every request        │
│  • Allowed users: hardcoded email allowlist             │
└─────────────────────────────────────────────────────────┘
```

**Total cost: $0** — GitHub Pages free, Vercel free tier (100K req/month), Google Drive free.

---

## What Changes

| Aspect | Before (v1) | After (Stage 1) |
|---|---|---|
| Framework | Next.js 14 (App Router) | Vite + React + React Router v6 |
| SPA Hosting | Vercel | GitHub Pages (static files) |
| Auth | NextAuth.js (Google OAuth) | Google Identity Services (GIS) OAuth 2.0 |
| Storage | MongoDB Atlas | Google Drive `appDataFolder` |
| Embeddings | OpenAI `text-embedding-3-small` (server) | OpenAI via Vercel proxy + Transformers.js fallback (client) |
| Vector search | MongoDB Atlas Vector Search | In-memory cosine similarity |
| RAG / Recall | Claude API via Next.js API route | Claude API via Vercel serverless proxy |
| Eemo | Claude Haiku via Next.js API route | Claude Haiku via Vercel serverless proxy |
| API routes | `src/app/api/*` (Next.js) | Standalone `api/` dir deployed to Vercel |
| Database | MongoDB Atlas | None — fully eliminated |

---

## Vercel Serverless Proxy

### Purpose

A minimal, stateless proxy that holds API keys server-side and forwards requests to OpenAI/Claude. The SPA never sees API keys.

### Endpoints

| Endpoint | Upstream | Purpose |
|---|---|---|
| `POST /api/embed` | OpenAI `text-embedding-3-small` | Generate embeddings on journal save |
| `POST /api/recall` | Claude `claude-sonnet-4-6` | RAG — answer questions from past entries |
| `POST /api/eemo` | Claude `claude-haiku-4-5-20251001` | Ambient emotion detection |

### Auth Flow

Every request from the SPA includes the user's Google OAuth access token:

```
Browser                          Vercel Function                    Google
  │                                    │                              │
  │  POST /api/embed                   │                              │
  │  Authorization: Bearer <token>     │                              │
  │───────────────────────────────────►│                              │
  │                                    │  GET /oauth2/v3/userinfo     │
  │                                    │  Authorization: Bearer <tok> │
  │                                    │─────────────────────────────►│
  │                                    │                              │
  │                                    │  { email: "user@gmail.com" } │
  │                                    │◄─────────────────────────────│
  │                                    │                              │
  │                                    │  email in ALLOWED_USERS?     │
  │                                    │  ├── Yes → call OpenAI/Claude│
  │                                    │  └── No  → 403 Forbidden    │
  │                                    │                              │
  │  { embedding: [...] }             │                              │
  │◄───────────────────────────────────│                              │
```

### Function Structure

```ts
// api/embed.ts
const ALLOWED_USERS = ['user@example.com', ...]; // max 10

export default async function handler(req, res) {
  // 1. Extract Google token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  // 2. Verify with Google
  const googleRes = await fetch(
    'https://www.googleapis.com/oauth2/v3/userinfo',
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!googleRes.ok) return res.status(401).json({ error: 'Invalid token' });

  const { email } = await googleRes.json();

  // 3. Check allowlist
  if (!ALLOWED_USERS.includes(email)) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // 4. Proxy to OpenAI (key is in Vercel env vars)
  const openaiRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: req.body.text,
    }),
  });

  const data = await openaiRes.json();
  return res.status(200).json({ embedding: data.data[0].embedding });
}
```

### Environment Variables (Vercel Dashboard)

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ALLOWED_USERS=user@example.com,friend@example.com,...
```

### Deployment

The Vercel project contains **only** the `api/` folder — no frontend. The SPA is deployed separately on GitHub Pages. This is a supported Vercel pattern: serverless functions without a frontend.

---

## Google Drive File Structure

```
appDataFolder/
  entries/{id}.json    ← full journal entry + embedding
  settings.json        ← theme, preferences
```

Each journal entry file:

```json
{
  "id": "uuid-v4",
  "title": "Morning thoughts",
  "body": "...",
  "bodyPlainText": "...",
  "mood": "calm",
  "color": "#A7C4A0",
  "drawingData": null,
  "createdAt": "2026-04-07T08:30:00Z",
  "updatedAt": "2026-04-07T08:45:00Z",
  "embedding": [0.023, -0.041, ...]
}
```

No `_index.json` manifest in Stage 1 — keep it simple. List entries by listing files in `appDataFolder`. Embeddings live inside each file. On Recall, load all embeddings into memory and do cosine similarity.

---

## Auth Flow (Google Identity Services)

1. Load GIS client library (`accounts.google.com/gsi/client`)
2. Initialize token client with scopes: `https://www.googleapis.com/auth/drive.file`
3. On sign-in → save `access_token` to `sessionStorage`
4. On page load → check `sessionStorage`, validate via `googleapis.com/oauth2/v3/userinfo`
5. If valid → restore session. If 401 → clear, show login.
6. Token expires after 1 hour → user signs in again (Google SPA constraint)

**Note:** `drive.file` scope means app can only access files it created. Cannot see user's other Drive files.

The **same token** is used for both:
- Direct Google Drive API calls from the browser
- Authorization header sent to Vercel proxy functions

---

## GitHub Pages Deployment

- **Router:** `HashRouter` (URLs become `/#/dashboard`, `/#/editor/123`)
- **Vite config:** `base: '/<repo-name>/'` (or `'/'` with custom domain)
- **CI/CD:** GitHub Actions workflow on push to `main`
  - `npm ci` → `npm run build` → deploy `dist/` to Pages
- **Secrets:** `VITE_GOOGLE_CLIENT_ID` and `VITE_API_BASE_URL` stored in GitHub repo secrets
- **Favicon:** Use relative path (`href="./favicon.ico"`) for base path compatibility

### Workflow (`.github/workflows/deploy.yml`)

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## Embedding Strategy

### Primary: OpenAI via Vercel Proxy

- Model: `text-embedding-3-small` (1536 dimensions)
- Generated on journal save via `POST /api/embed`
- Same model as v1 — embeddings are compatible for migration

### Fallback (future): Transformers.js Client-Side

- Model: `Xenova/all-MiniLM-L6-v2` (384 dimensions)
- Runs in a WebWorker — never blocks UI thread
- Could replace OpenAI entirely (zero API cost) but lower quality embeddings
- Evaluate in Stage 2 whether quality tradeoff is acceptable

### Vector Search

- Load all embeddings into memory from Drive entry files
- Cosine similarity, return top-K results
- At 10 users × ~1000 entries × 1536 dims ≈ 6MB of vectors — trivial in memory

---

## What Carries Over (copy as-is or adapt)

### Copy as-is
- `src/components/ui/` — all primitive components
- `src/components/layout/` — ThemeProvider, ThemeToggle, Modal, PageWrapper
- `src/components/journal/` — MoodSelector, ColorPicker, WordCount, DrawingCanvas, DrawingToolbar, TypingCursor, FadeInText, DateStamp, AutoSaveStatus
- `src/hooks/useDebounce.ts`, `useWordCount.ts`
- Tailwind config, CSS tokens, Framer Motion animations
- Storybook stories + test files

### Adapt
- `src/hooks/useAutoSave.ts` — swap save callback to Drive write
- `src/hooks/useJournalEntries.ts` — rewrite against Drive API
- `src/components/journal/JournalEditor.tsx` — wire to Drive + Vercel proxy for Eemo
- `src/components/dashboard/DashboardView.tsx` — wire to Drive listing
- `src/components/dashboard/RecallPanel.tsx` — wire to Vercel proxy for RAG
- `src/types/journal.ts` — remove MongoDB fields, add `embedding` field

### Delete
- `src/app/` — all Next.js pages and API routes
- `src/lib/db/` — MongoDB/Mongoose layer
- `src/lib/auth/` — NextAuth config
- `src/lib/embeddings/generate.ts` — OpenAI server-side generation
- `next.config.js`, middleware, NextAuth config

### New
- `api/embed.ts` — Vercel serverless: OpenAI proxy
- `api/recall.ts` — Vercel serverless: Claude proxy for RAG
- `api/eemo.ts` — Vercel serverless: Claude proxy for Eemo
- `api/_lib/auth.ts` — shared Google token verification + allowlist
- `src/lib/drive/` — Google Drive API wrapper (auth, CRUD, file listing)
- `src/lib/search/cosine.ts` — in-memory vector similarity
- `src/contexts/AuthContext.tsx` — Google OAuth state management
- `src/routes/` or router config — React Router v6 setup
- `.github/workflows/deploy.yml` — GitHub Pages CI/CD

---

## Implementation Order

1. **Scaffold** — `npm create vite@latest`, install deps, configure Tailwind + Framer Motion
2. **Copy reusable components** — UI, layout, journal components, hooks, types, styles
3. **Google OAuth** — GIS integration, session persistence, AuthContext
4. **Drive data layer** — `src/lib/drive/`: auth'd fetch wrapper, entry CRUD, file listing
5. **Wire pages** — React Router, Dashboard → Drive listing, Editor → Drive read/write
6. **Vercel proxy** — set up `api/` folder, deploy to Vercel, wire embed/recall/eemo
7. **Embeddings** — generate via Vercel proxy on save, store in entry file
8. **Vector search** — load embeddings, cosine similarity, wire Recall panel
9. **Eemo** — wire to Vercel proxy, restore ambient emotion in editor
10. **GitHub Pages deploy** — workflow, HashRouter, base path config, verify end-to-end
11. **Migration script** — one-time: export MongoDB entries → Drive files (run locally)

---

## Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Vercel for AI proxy | Serverless functions, free tier | Already familiar with Vercel. Stateless, zero data stored. API keys stay server-side. |
| Auth via Google token verification | Verify token with Google userinfo endpoint + email allowlist | No separate auth system. Reuses the same token the SPA already has for Drive. Max 10 users = hardcoded list is fine. |
| No `_index.json` manifest | List files via Drive API | Simpler for Stage 1. Add manifest later if listing gets slow. |
| Embeddings inside entry files | One file = one source of truth | No sync issues. Rebuild-friendly. Can extract to manifest later. |
| OpenAI embeddings (not Transformers.js) | Keep `text-embedding-3-small` via proxy | Higher quality, same model as v1 (migration-compatible). Evaluate client-side alternative in Stage 2. |
| `drive.file` scope | App can only access files it created | Minimal permissions. User's other Drive files are untouched. |
| HashRouter | GitHub Pages doesn't support SPA routing | URLs are `/#/path` but it works reliably. |
| sessionStorage for token | Per-tab, clears on close | Safer than localStorage. Token expires in 1hr anyway. |
| Two separate deployments | SPA on GitHub Pages, proxy on Vercel | Clean separation. SPA is pure static. Vercel holds only secrets. |
