# Future Architecture: Privacy-First Google Drive SPA

## Goal

Rewrite Muse as a pure React SPA with zero server-side data storage. Every user's journal lives exclusively in their own Google Drive. The developer never sees any user data. App is free to host forever.

**Why:**
- Privacy-first — developer has zero access to user journal data
- Zero infra cost — no MongoDB Atlas, no Vercel backend
- User-owned data — users can revoke access, export, or delete anytime

---

## New Stack

| Layer | Technology |
|---|---|
| Framework | Vite + React + React Router v6 |
| Auth | Google OAuth 2.0 PKCE (no server needed) |
| Storage | Google Drive `appDataFolder` |
| Embeddings | Transformers.js — `Xenova/all-MiniLM-L6-v2` (384-dim, runs in WebWorker) |
| Vector Search | In-browser cosine similarity on IndexedDB |
| LLM | Self-hosted Gemma 4 4B on a VM via Ollama, JWT-authenticated |
| Hosting | Cloudflare Pages or GitHub Pages (free, static files only) |

---

## Google Drive File Structure

```
appDataFolder/
  _index.json          ← manifest: all entry metadata + embeddings
  entries/{id}.json    ← full journal entry content
  sessions/{id}.json   ← chat session history
  settings.json        ← theme, LLM endpoint URL, preferences
```

`appDataFolder` scope keeps Muse files sandboxed — they don't appear in the user's Drive UI. Users can revoke access to delete all data.

---

## Local-First Index Pattern

Google Drive has no partial update API — every change requires read-whole-file → modify → write-whole-file. To avoid slow network calls on every save/search:

```
Drive (_index.json)     ← source of truth, durable, cross-device sync
        ↕ sync
IndexedDB (browser)     ← working index, instant reads/writes, no network
```

**Flow:**
1. App load → fetch `_index.json` from Drive once → populate IndexedDB
2. Entry save → write `entries/{id}.json` to Drive + update IndexedDB immediately
3. Search → always read from IndexedDB (instant, zero network calls)
4. Index sync to Drive → debounced 10–30s after last change (batches multiple saves into one write)

This is the **local-first** pattern: data lives locally for speed, Drive is the sync layer.

---

## Vector Update Flow

- Embeddings only regenerate on save (not on every keystroke)
- Auto-save is debounced (1–2s after user stops typing)
- Transformers.js runs in a WebWorker — never blocks the UI
- Only the changed entry's embedding is updated — no full reindex
- Per-save Drive writes: 1 entry file (targeted) + `_index.json` (debounced/batched)

---

## Eemo — Emotion Detection (no API key needed)

Use zero-shot classification with the same embedding model already loaded:
- Embed the journal text
- Embed phrases like `"this text feels calm"`, `"this text feels anxious"`, etc.
- Pick the emotion with highest cosine similarity
- Zero extra model, zero API key, zero cost

---

## LLM Server (Gemma 4 4B on VM)

```bash
ollama pull gemma4:4b
ollama serve
# + nginx reverse proxy with HTTPS + JWT auth middleware
```

- Auth: validate Google OAuth JWT before serving any request
- VM holds **zero user data** — prompt in, text out, nothing persisted
- The VM is the only "backend" but stores nothing

---

## What Carries Over From Current Codebase

| Asset | Status |
|---|---|
| `src/components/ui/` (all 9 components) | Copy as-is |
| `src/components/layout/ThemeProvider, ThemeToggle, Modal, PageWrapper` | Copy as-is |
| `src/components/journal/` — MoodSelector, ColorPicker, WordCount, DrawingCanvas, DrawingToolbar, TypingCursor, FadeInText, DateStamp, AutoSaveStatus | Copy as-is |
| `src/hooks/useDebounce.ts`, `useWordCount.ts` | Copy as-is |
| `src/hooks/useAutoSave.ts` | Reuse — swap `onSave` callback to Drive write |
| `src/lib/embeddings/chunk.ts` | Copy as-is |
| Tailwind config, CSS tokens, Framer Motion animations | Copy as-is |
| `src/types/journal.ts` | Adapt (remove MongoDB-specific fields) |

## What Gets Replaced

| Current | Replacement |
|---|---|
| `src/lib/db/` (MongoDB/Mongoose) | `src/lib/drive/` (Google Drive API wrapper) |
| `src/lib/embeddings/generate.ts` (OpenAI/Voyage) | Transformers.js WebWorker |
| All `src/app/api/` routes | Deleted — Drive API called from browser |
| `src/lib/auth/` (NextAuth) | Google OAuth 2.0 PKCE |
| `useJournalEntries.ts`, `useEntrySync.ts` | Rewrite against Drive/IndexedDB |
| `JournalEditor`, `DashboardView`, `RecallPanel` | Adapt to new data layer |
| `src/app/` (Next.js pages) | React Router routes |
| `next.config.js`, NextAuth config | Deleted |

---

## Implementation Phases

1. **Scaffold** — `npm create vite@latest`, install deps, copy reusable components
2. **Drive data layer** — `src/lib/drive/`: auth, client, entries CRUD, index/manifest management, sessions
3. **Embeddings** — Transformers.js WebWorker + `useEmbedding` hook
4. **Vector search** — `src/lib/search/`: cosine similarity + recall query
5. **LLM integration** — calls to self-hosted Gemma endpoint, streaming, RAG prompt assembly
6. **Wire components** — JournalEditor → Drive, DashboardView → manifest, RecallPanel → search + LLM, React Router setup, Settings page

---

## Trade-offs vs Current Architecture

| Aspect | Current (MongoDB) | New (Google Drive SPA) |
|---|---|---|
| Data ownership | Developer's DB | User's own Drive |
| Privacy | Server sees all data | Developer sees nothing |
| Cost | MongoDB Atlas + Vercel | Free forever |
| Backend | Yes (Next.js + API routes) | VM for LLM only (no data stored) |
| Vector search | Atlas Vector Search | In-browser cosine sim (fine for small personal datasets) |
| AI features | Developer's API keys | Self-hosted Gemma on VM |
| First load | Fast | ~25MB model download (cached after) |
| Offline support | No | Possible via service worker (future) |
