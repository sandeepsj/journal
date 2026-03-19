# Dark Mode Implementation — Muse Journaling App

## Progress

| Stage | Name | Status |
|---|---|---|
| 0 | Foundation (tokens, next-themes, provider) | ✅ done |
| 1 | Theme Toggle (component + Navbar) | ✅ done |
| 2 | UI Primitives (Button, Input, Card, Badge…) | ✅ done |
| 3 | Layout & Modal (Navbar, Modal) | ✅ done |
| 4 | Journal Editor (paper, toolbar, status bar) | ✅ done |
| 5 | Dashboard (cards, search, pinned rail, FAB) | ✅ done |
| 6 | Recall / AI Chat (panels, sidebar, bubbles) | ✅ done |
| 7 | Pages & Error screens (login, loading, error…) | ✅ done |
| 8 | Polish, Storybook & final build | ✅ done |

---

## Stage 0 — Foundation ✅

- Installed `next-themes`
- Added `html.dark { }` token overrides to `globals.css`
- Added paper tokens (`--color-paper`, `--color-paper-line`, `--color-paper-margin`, `--color-dot-pattern`) to `:root`
- Updated `.ruled-paper`, `.ruled-lines`, and body dot pattern to use CSS variables
- Created `src/components/layout/ThemeProvider.tsx`
- Updated `src/app/layout.tsx` — wrapped in ThemeProvider, added `suppressHydrationWarning`, removed hardcoded body colors

## Stage 1 — Theme Toggle ⬜

Files:
- `src/components/layout/ThemeToggle.tsx` (NEW)
- `src/components/layout/Navbar.tsx` (add toggle)

## Stage 2 — UI Primitives ⬜

Files: Button, Input, Textarea, Card, Badge, Avatar, Skeleton, Divider

## Stage 3 — Layout & Modal ⬜

Files: Navbar, Modal

## Stage 4 — Journal Editor ⬜

Files: JournalEditor, DrawingToolbar, ColorPicker, AutoSaveStatus, MoodSelector, WordCount, DateStamp, TypingCursor

## Stage 5 — Dashboard ⬜

Files: DashboardView, JournalCard, JournalCardSkeleton, SearchInput, PinnedRail, PinnedBookmarkCard, EmptyState, PinLimitBanner

## Stage 6 — Recall / AI Chat ⬜

Files: RecallPanel, RecallChatPanel, ChatSidebar, AIRecallCard, EemoWidget

## Stage 7 — Pages & Error Screens ⬜

Files: login/page.tsx, loading.tsx, error.tsx, not-found.tsx, global-error.tsx

## Stage 8 — Polish & Final Build ⬜

- Storybook dark preview
- Scrollbar, focus styles, transitions
- Full test suite + build
- Manual smoke test
