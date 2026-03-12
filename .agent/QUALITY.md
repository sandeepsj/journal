# Quality Standards — Muse Journaling App

## Philosophy

Quality here means three things:
1. **Component quality** — each piece works perfectly in isolation
2. **UX quality** — the app feels alive, calm, and delightful
3. **Engineering quality** — secure, maintainable, and correct

---

## Component Quality Standard

### Definition of Done for a Component

A component is "done" only when ALL of the following are true:

- [ ] Props interface is typed with TypeScript (no `any`)
- [ ] All visual states covered in Storybook story:
  - Default / happy path
  - Loading state (if async-related)
  - Error state (if applicable)
  - Empty state (if applicable)
  - All variants
- [ ] Unit test covers:
  - Renders without crashing
  - Correct output given props
  - User interactions (click, type, keyboard) where relevant
  - Accessibility (role, label, focus behavior)
- [ ] No hardcoded colors, sizes, or spacing (use Tailwind tokens)
- [ ] `prefers-reduced-motion` respected for any animation
- [ ] No internal state that should be in props
- [ ] No direct API calls inside the component

### Component Testing Approach

```tsx
// Pattern for component tests
describe('JournalCard', () => {
  it('renders title and excerpt', () => { ... })
  it('shows mood tag when mood prop is provided', () => { ... })
  it('calls onDelete when delete button clicked', () => { ... })
  it('does not render delete button when readOnly is true', () => { ... })
})
```

---

## Animation Quality Standard

Animations are a first-class feature of this app. Each animation must:

1. **Feel natural** — use easing curves, not linear
2. **Be purposeful** — animate to communicate state change, not for decoration
3. **Be fast** — most transitions under 300ms; fade-ins under 200ms
4. **Degrade gracefully** — if `prefers-reduced-motion: reduce`, skip or minimize
5. **Not cause layout shift** — animate `opacity` and `transform` only (no width/height)

### Animation Token Reference
```ts
// tailwind.config.ts
animation: {
  'fade-in': 'fadeIn 150ms ease-out',
  'fade-up': 'fadeUp 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  'cursor-blink': 'blink 1s step-end infinite',
  'save-pulse': 'pulse 0.5s ease-in-out',
}
```

### Word Fade-In Implementation Standard
- Track last word boundary on each keystroke
- New words animate from `opacity-0` to `opacity-100` over 150ms
- Must not cause re-render of the entire text block
- Must degrade to no animation if reduced-motion

---

## Code Quality Standards

### TypeScript
- `strict: true` in tsconfig
- No `any` types — use `unknown` + type guard if needed
- All component props have explicit interface definitions
- All API route handlers have typed request/response

### API Security
Every API route must:
```ts
// 1. Check session
const session = await getServerSession(authOptions)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// 2. Scope all queries by userId
const entries = await db.collection('entries').find({ userId: session.user.id })

// 3. Validate input
const body = await request.json()
// validate with zod schema
```

### Database Query Standard
- Never use `find({})` without userId filter
- Always handle `null` returns (document not found)
- Use indexes for all filtered queries
- Keep embedding field out of list queries (project it out unless needed)

---

## Testing Pyramid

```
        /\
       /E2E\          <- Playwright: critical user flows (Stage 7)
      /------\
     / Integ  \       <- API route tests with real MongoDB (Stage 4+)
    /----------\
   / Unit Tests \     <- Vitest: all components + hooks + utilities
  /--------------\
 /  Type Checking \   <- tsc --noEmit (CI on every push)
/------------------\
```

### Coverage Targets
- Component unit tests: 100% of public components
- Hook unit tests: 100% of custom hooks
- API routes: integration tests for all happy paths + auth failure
- E2E: login flow, create entry, recall

---

## Performance Standards

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID/INP | < 100ms |
| CLS | < 0.1 |
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 95 |
| Time to first editor keystroke | < 1s |
| Embedding generation (server) | < 3s (non-blocking) |
| RAG recall response start | < 2s |

### Performance Rules
- No blocking embedding generation on save UX — do it async, confirm in background
- Paginate entry lists (20 per page)
- Project out embedding field from list queries (1536 floats is heavy)
- Use Next.js `loading.tsx` on all data-fetching routes
- Images: use `next/image` always

---

## Accessibility Standards

- All interactive elements keyboard-navigable
- All images have meaningful `alt` text
- Color contrast ratio: WCAG AA minimum (4.5:1 for text)
- Focus indicators visible (no `outline: none` without replacement)
- Modal traps focus correctly
- Form inputs have associated labels
- Screen reader announcements for async state changes

---

## Security Checklist (Pre-Ship)

- [ ] All API routes validate session before any operation
- [ ] All DB queries include userId from session (not from request body)
- [ ] No secrets in client bundle (`NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` are server-only)
- [ ] Input sanitization on all user-submitted text
- [ ] Rate limiting on `/api/journal` (POST) and `/api/recall`
- [ ] CORS configured for production domain only
- [ ] Dependency audit: `npm audit` clean
- [ ] No debug logs in production
