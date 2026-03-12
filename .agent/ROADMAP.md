# Roadmap — Muse Journaling App

## Stage Overview

```
Stage 0: Design (Figma)
    ↓
Stage 1: Scaffold + Auth + DB
    ↓
Stage 2: Component Library (Storybook)
    ↓
Stage 3: Journal Editor
    ↓
Stage 4: Data Layer + Embedding Pipeline
    ↓
Stage 5: RAG / AI Memory
    ↓
Stage 6: Past Entries + Search
    ↓
Stage 7: Polish + QA + Ship
```

---

## Stage 0 — Design (Figma First)
**Status:** Not started
**Depends on:** Nothing
**Blocks:** All implementation

### Goals
- Establish visual identity before writing code
- Prevent design churn during development
- Export tokens directly to Tailwind config

### Screens to Design
1. **Login Page** — minimal, calming, centered card
2. **Dashboard** — entry list + AI recall input
3. **Journal Editor** — full-page focus mode
4. **Entry Detail** — read view of a past entry
5. **AI Recall View** — question input + streamed answer + citations
6. **Empty State** — first-time user, no entries

### Design Tokens to Define
- Color palette (background, surface, text-primary, text-muted, accent, error)
- Typography scale (font families, sizes, line heights, weights)
- Spacing scale (4px base unit)
- Border radius (soft, rounded)
- Shadow levels (subtle elevation)
- Animation durations and easing curves

### Figma MCP Plan
- Use `generate_diagram` for architecture overview in FigJam
- After manual/AI design: use `get_variable_defs` to extract tokens
- Use `get_design_context` per component during Stage 2-3

**Exit Criteria:** All 6 screens approved, tokens exported

---

## Stage 1 — Project Scaffold
**Status:** Not started
**Depends on:** Stage 0 exit criteria

### Goals
- Working Next.js app with auth and DB
- CI/CD pipeline live on Vercel
- Development tooling ready for Stage 2

### Checklist
- [ ] `npx create-next-app@latest muse --typescript --tailwind --app`
- [ ] Configure ESLint + Prettier
- [ ] Install and configure Storybook 8
- [ ] Install Vitest + React Testing Library
- [ ] Install NextAuth.js + configure Google provider
- [ ] Create MongoDB Atlas cluster (M0 free tier)
- [ ] Create `User` collection schema
- [ ] Create Atlas Vector Search index (prep only, no data yet)
- [ ] Environment variables documented in `.env.example`
- [ ] Deploy to Vercel, verify env vars set
- [ ] Google OAuth redirect URIs configured for Vercel domain

**Exit Criteria:** App live on Vercel, Google login works, DB connects

---

## Stage 2 — Component Library
**Status:** Not started
**Depends on:** Stage 1 complete, Stage 0 design tokens

### Component Build Order (atomic first)

**Primitives:**
1. `Button` (primary, ghost, danger, loading state)
2. `Input` (text, with label, error state)
3. `Textarea` (resizable, with char count)
4. `Badge` / `Tag` (for mood tags)
5. `Avatar` (Google photo, initials fallback)
6. `Spinner` / `LoadingDots`
7. `Divider`

**Layout:**
8. `PageWrapper` (centered content, calming background)
9. `Navbar` (user avatar, app name, sign out)
10. `Modal` (accessible dialog)
11. `Card` (surface component)

**Journal-specific:**
12. `JournalCard` (entry preview: title, date, excerpt, mood)
13. `MoodSelector` (5 mood options, icon + label)
14. `DateStamp` (elegant date formatting)
15. `WordCount` (subtle counter)
16. `TypingCursor` (animated blinking caret)
17. `FadeInText` (word-by-word fade animation)
18. `AutoSaveStatus` (Saving... / Saved / Error)
19. `AIRecallCard` (retrieved entry citation)
20. `EmptyState` (no entries, encouraging message)
21. `SearchInput` (debounced, with clear button)

**Each component ships with:**
- `ComponentName.tsx` (implementation)
- `ComponentName.stories.tsx` (all states in Storybook)
- `ComponentName.test.tsx` (unit test)
- `ComponentName.types.ts` (props interface, if complex)

**Exit Criteria:** All 21 components in Storybook, all tests passing

---

## Stage 3 — Journal Editor
**Status:** Not started
**Depends on:** Stage 2 complete

### Goals
- Build the full editor experience using Stage 2 components
- Animations polished and approved
- Editor works with mock data (no real API yet)

### Checklist
- [ ] `JournalEditorPage` — composition of components
- [ ] `useAutoSave` hook (30s interval, dirty state tracking)
- [ ] `useWordFadeIn` hook (tracks last word boundary for animation)
- [ ] Keyboard shortcut handling (`Cmd/Ctrl + Enter`)
- [ ] Mobile layout (tablet-friendly)
- [ ] Animation review pass
- [ ] Reduced-motion fallback

**Exit Criteria:** Editor demo in Storybook with full animation, keyboard shortcuts work

---

## Stage 4 — Data Layer
**Status:** Not started
**Depends on:** Stage 3 complete

### Goals
- Full CRUD for journal entries
- Embedding generation pipeline on save
- All APIs secured by session

### API Routes
- `POST /api/journal` — create entry, generate + store embedding
- `GET /api/journal` — list (paginated, userId-scoped)
- `GET /api/journal/[id]` — single entry
- `PUT /api/journal/[id]` — update, re-embed
- `DELETE /api/journal/[id]`

### Embedding Pipeline
```
User saves journal
  → Server receives body + title
  → Concatenate: "{title}\n\n{body}"
  → POST to OpenAI embeddings API
  → Receive 1536-dim float vector
  → Store in journal document as `embedding` field
  → MongoDB Atlas indexes automatically
```

**Exit Criteria:** End-to-end save → embed → store → retrieve working

---

## Stage 5 — RAG / AI Memory
**Status:** Not started
**Depends on:** Stage 4 complete (need real embeddings)

### Goals
- Working RAG recall endpoint
- Streamed Claude response in UI
- Citations showing source entries

### RAG Pipeline
```
User submits query
  → Embed query with OpenAI
  → Atlas Vector Search: top 5 entries (by userId + cosine similarity)
  → Build prompt:
      System: "You are a thoughtful journaling companion..."
      Retrieved entries: [formatted excerpts]
      User: {query}
  → Stream Claude response
  → Return response + entry IDs as citations
```

**Exit Criteria:** Query returns contextually relevant answer from past entries

---

## Stage 6 — Past Entries + Search
**Status:** Not started
**Depends on:** Stage 4 complete

### Checklist
- [ ] Dashboard entry list with infinite scroll
- [ ] Entry detail page/modal
- [ ] Edit flow (re-embed on save)
- [ ] Delete with confirmation
- [ ] Keyword search (MongoDB text index)
- [ ] Date range filter
- [ ] Mood filter
- [ ] Grid/list view toggle

**Exit Criteria:** Full CRUD accessible in UI, search returns correct results

---

## Stage 7 — Polish + QA
**Status:** Not started
**Depends on:** All prior stages

### Checklist
- [ ] Lighthouse audit: Performance > 90, Accessibility > 95
- [ ] E2E test: login → write → save → recall → verify
- [ ] Mobile/tablet responsive review
- [ ] Error boundary coverage
- [ ] Rate limiting on write endpoints
- [ ] Security review: auth, userId scoping, input sanitization
- [ ] Empty states and loading states on all async flows
- [ ] 404 and error pages with calming design
- [ ] Final animation review pass

**Exit Criteria:** All checks pass, V1 shipped to production
