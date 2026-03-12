# Agent Instructions — Muse Journaling App

## Project Identity

**App Name:** Muse
**Purpose:** A calming, single-user-focused journaling web app with AI memory via RAG
**Scale:** Max 10 users, personal-scale infrastructure
**Tone:** Calm, minimal, elegant — like a paper journal, not a productivity tool

---

## Stage-by-Stage Development Plan

### Stage 0 — Design (Figma First)
**Goal:** Finalize visual design before writing any code.

Tasks:
- [ ] Use Figma MCP to create wireframes for: Login, Dashboard, Journal Editor, Past Entries, AI Recall view
- [ ] Define color palette (soft, muted tones — warm whites, sage greens, warm grays)
- [ ] Define typography (serif for journal body, sans-serif for UI chrome)
- [ ] Define animation behavior (fade-in words, cursor pulse, page transitions)
- [ ] Export design tokens to Tailwind config
- [ ] Get design approval before Stage 1

Deliverable: Figma file with all screens + component specs

---

### Stage 1 — Project Scaffold
**Goal:** Solid foundation with auth, DB, and folder structure.

Tasks:
- [ ] Init Next.js 14 with TypeScript + Tailwind + ESLint + Prettier
- [ ] Set up Storybook
- [ ] Set up Vitest + React Testing Library
- [ ] Configure NextAuth.js with Google OAuth
- [ ] Connect MongoDB Atlas (connection pooling via singleton)
- [ ] Create User schema in MongoDB
- [ ] Set up MongoDB Atlas Vector Search index (prep only)
- [ ] Configure environment variables
- [ ] Deploy skeleton to Vercel (CI/CD pipeline)

Deliverable: Running app on Vercel with Google login, empty dashboard

---

### Stage 2 — Core UI Components (No Logic)
**Goal:** Build and test all UI components in isolation via Storybook.

Priority Components:
- [ ] `Button` — variants: primary, ghost, danger
- [ ] `Input`, `Textarea` — with label, error state
- [ ] `Avatar` — Google profile picture
- [ ] `Navbar` — minimal, with user menu
- [ ] `PageWrapper` — layout shell with calming background
- [ ] `JournalCard` — preview of a past entry
- [ ] `MoodTag` — optional mood indicator
- [ ] `EmptyState` — no entries yet
- [ ] `LoadingDots` — animated, calming loader
- [ ] `TypingCursor` — animated cursor for journal editor
- [ ] `FadeInText` — text that fades in word-by-word (key UX feature)
- [ ] `DateStamp` — elegant date display
- [ ] `AIRecallCard` — shows retrieved past journal context

Each component:
- Props-only interface
- Storybook story with all states
- Vitest unit test for render + key interactions

Deliverable: Storybook with all components at 100% coverage

---

### Stage 3 — Journal Editor (Core Feature)
**Goal:** Build the flagship journal writing experience.

Features:
- [ ] Full-page distraction-free writing mode
- [ ] Rich text (minimal: bold, italic, heading — no heavy editor)
- [ ] Auto-save every 30s with subtle status indicator
- [ ] Word-by-word fade-in animation as user types
- [ ] Animated blinking cursor (custom, not browser default)
- [ ] Title field with large serif typography
- [ ] Mood selector (optional, subtle)
- [ ] Date/time stamp auto-populated
- [ ] Submit/Save button with satisfying animation
- [ ] Keyboard shortcut: `Cmd/Ctrl + Enter` to save

Animation goals:
- Text appears with soft fade as typed
- Page entry: gentle fade + slide-up
- Save confirmation: subtle particle burst or ink-drop effect

Deliverable: Fully functional journal editor, independently testable

---

### Stage 4 — Data Layer
**Goal:** Wire up MongoDB CRUD + embedding pipeline.

Tasks:
- [ ] `JournalEntry` MongoDB schema (title, body, userId, createdAt, embedding, tags)
- [ ] API route: `POST /api/journal` — save entry + generate embedding
- [ ] API route: `GET /api/journal` — list entries for user (paginated)
- [ ] API route: `GET /api/journal/[id]` — single entry
- [ ] API route: `DELETE /api/journal/[id]`
- [ ] Embedding pipeline: on save → call OpenAI `text-embedding-3-small` → store in document
- [ ] MongoDB Atlas Vector Search index setup (script + docs)
- [ ] All DB calls scoped by `userId` from session

Security:
- Validate session on every API route
- Sanitize inputs
- Rate limiting on save endpoint

Deliverable: Full CRUD with embeddings stored in Atlas

---

### Stage 5 — RAG / AI Memory Feature
**Goal:** Let users ask questions about their past journals.

Features:
- [ ] "Ask your journal" UI — a soft input at the bottom of dashboard
- [ ] API route: `POST /api/recall` — takes query, returns contextualized answer
- [ ] RAG pipeline:
  1. Embed the query with OpenAI
  2. Vector search in Atlas (top 5 relevant entries)
  3. Construct prompt: system context + retrieved entries + user query
  4. Call Claude API (`claude-sonnet-4-6`) with prompt
  5. Stream response back to UI
- [ ] `AIRecallCard` component shows retrieved entries as citations
- [ ] Graceful handling when no relevant entries exist
- [ ] Usage is per-user, no cross-user data leakage

Deliverable: Working RAG memory with Claude-powered responses

---

### Stage 6 — Past Entries View
**Goal:** Beautiful browsable archive of journal entries.

Features:
- [ ] Grid/list view of past entries (toggle)
- [ ] Infinite scroll or pagination
- [ ] Search by keyword (text search in MongoDB)
- [ ] Filter by date range, mood
- [ ] Entry detail view with full text
- [ ] Edit existing entry (re-generate embedding on save)
- [ ] Delete with confirmation

Deliverable: Full entry management experience

---

### Stage 7 — Polish, Performance, and QA
**Goal:** Ship-ready quality.

Tasks:
- [ ] Lighthouse score > 90 on all pages
- [ ] All components pass Storybook visual review
- [ ] E2E tests (Playwright): login → write entry → save → recall
- [ ] `prefers-reduced-motion` respected in all animations
- [ ] Mobile responsive (journal editor works on tablet)
- [ ] Error boundaries on all async data flows
- [ ] Loading states on all async actions
- [ ] 404 / error page with calming design
- [ ] Security audit: auth, data scoping, rate limits

---

## Quality Gates Per Stage

Each stage must pass before the next begins:

| Gate | Criteria |
|------|----------|
| Design | All screens approved in Figma |
| Scaffold | Auth works, DB connected, CI green |
| Components | All components in Storybook, tests pass |
| Editor | Editor works in isolation, animations approved |
| Data Layer | All API routes tested, embeddings verified in Atlas |
| RAG | Recall returns contextually relevant answers |
| Entries View | CRUD fully functional, search works |
| Polish | Lighthouse > 90, E2E green, mobile tested |

---

## Vector DB Decision — Final Rationale

**Choice: MongoDB Atlas Vector Search**

Why not S3:
- S3 stores files, not queryable vectors — would need a vector DB on top anyway

Why MongoDB Atlas:
- Already the primary database — zero additional infrastructure
- Atlas Vector Search is production-grade, serverless-compatible
- Single connection string, unified data model
- $0 at this scale (10 users, ~thousands of entries)
- ANN search with HNSW algorithm built-in

Embedding model: `text-embedding-3-small` (1536 dims, cheap, fast)

---

## Figma MCP Usage Plan

Tools to use:
- `get_design_context` — extract component specs after design is complete
- `get_screenshot` — visual reference during implementation
- `generate_diagram` — for architecture/flow diagrams in FigJam
- `get_variable_defs` — extract design tokens (colors, typography)
- `get_metadata` — navigate file structure

Workflow:
1. Create Figma file manually or via AI generation
2. Use `get_variable_defs` to extract tokens → paste into `tailwind.config.ts`
3. Use `get_design_context` per screen → generate component scaffolds
4. Cross-reference `get_screenshot` during component build

---

## Key Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Vercel serverless cold starts + MongoDB | Use connection pooling singleton pattern |
| OpenAI API cost for embeddings | Use `text-embedding-3-small`, batch on save only |
| Atlas Vector Search index rebuild | Create index setup script, document in README |
| Animation performance on low-end devices | `will-change`, reduced-motion fallback |
| Journal data privacy | All queries scoped by userId, no shared state |
| RAG hallucination | Ground prompt strictly in retrieved entries only |
