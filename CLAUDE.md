# CLAUDE.md — Project Instructions for AI Agents

## Project Overview

**Muse** — A calming, personal web journaling app built with Next.js + MongoDB Atlas.
Target users: max 10 (single-tenant per user, multi-account support).
Deployed on Vercel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + Framer Motion |
| Auth | NextAuth.js with Google OAuth |
| Database | MongoDB Atlas (journal data + vector embeddings) |
| Vector Search | MongoDB Atlas Vector Search |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM for RAG | Claude API (claude-sonnet-4-6) |
| Deployment | Vercel |
| Testing | Vitest + React Testing Library + Storybook |

---

## Architecture Principles

### 1. Component-First Design
- Every UI piece is an isolated React component
- All data flows via props — no implicit context threading unless state management dictates
- Each component is independently testable via Storybook + Vitest
- No logic inside pages — pages are composition roots only

### 2. Vector Storage Strategy
- Journal entries are stored in MongoDB with an `embedding` field (float array)
- MongoDB Atlas Vector Search index on `embedding` field per user
- Embeddings generated server-side via OpenAI API on journal save
- RAG queries: find top-K relevant past entries → inject into Claude prompt

### 3. File Structure Convention
```
src/
  app/              # Next.js App Router pages (composition only)
  components/       # All UI components (atomic → molecule → organism)
    ui/             # Primitive components (Button, Input, etc.)
    journal/        # Journal-specific components
    layout/         # Layout components
  lib/              # Utilities, DB clients, API helpers
  hooks/            # Custom React hooks
  types/            # TypeScript types/interfaces
  styles/           # Global styles, animation tokens
```

### 4. Naming Conventions
- Components: PascalCase (`JournalEditor.tsx`)
- Hooks: camelCase with `use` prefix (`useJournalEntry.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Types: PascalCase with `Type` or `Props` suffix

---

## Critical Rules

1. **Never put business logic in page files** — pages import and compose components only
2. **Every component must have a Storybook story** before it's considered done
3. **No direct MongoDB calls in components** — always go through API routes or server actions
4. **Embeddings are always generated server-side** — never expose OpenAI API key to client
5. **All user data is scoped by userId** — every DB query must include a userId filter
6. **No hardcoded colors or sizes** — use Tailwind config tokens only
7. **Animations must respect `prefers-reduced-motion`**

---

## Environment Variables Required

```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MONGODB_URI=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run Vitest
npm run storybook    # Launch Storybook
npm run test:e2e     # Playwright E2E (future)
```

---

## Agent Workflow Rules

- Always read existing code before editing
- Check `src/types/` before creating new type definitions
- When adding a component, also create its `.stories.tsx` and `.test.tsx` files
- Before touching MongoDB queries, check `src/lib/db/` for existing patterns
- Prefer editing existing files over creating new ones
- Do not auto-commit — always present changes for review
