# Feature Specification — Muse Journaling App

## Core Features

### F1 — Google Authentication
- Sign in / Sign up with Google OAuth via NextAuth.js
- Session persisted with JWT
- User profile (name, avatar) stored in MongoDB on first login
- Protected routes — all journal routes require auth
- Sign out clears session

### F2 — Journal Editor
**The flagship feature. UI quality is the priority.**

- Full-page distraction-free mode
- Large serif font for body text (e.g., Lora, Playfair Display)
- Title field at top, large and prominent
- Auto-save every 30 seconds (unobtrusive status: "Saved" / "Saving...")
- Manual save: Cmd/Ctrl + Enter or save button
- Optional mood selector (5 moods: calm, happy, anxious, sad, grateful)
- Date/time auto-stamped on creation
- Word count in subtle footer
- Exit editor returns to dashboard without data loss

**Animations (high priority):**
- Each word fades in as typed (opacity: 0 → 1, duration: 150ms)
- Animated blinking cursor (custom, not OS default)
- Page load: gentle fade-up
- Save action: ink-drop ripple or subtle success animation
- Title to body transition is seamless

### F3 — AI Memory / RAG Recall
- Accessible from dashboard: "Ask your journal..." input
- User types a question (e.g., "When did I last feel anxious about work?")
- System:
  1. Embeds the question
  2. Finds top 5 semantically similar past journal entries
  3. Passes them to Claude as context
  4. Streams a thoughtful, grounded answer
- Response UI: streamed text + citation cards showing retrieved entries
- Graceful fallback: "Not enough journal history yet" if < 3 entries

### F4 — Past Entries Archive
- Grid or list view (user toggle, preference persisted)
- Each entry card: title, date, mood tag, excerpt (100 chars)
- Click to expand full entry in modal or detail page
- Edit entry (re-vectorizes on save)
- Delete entry with confirmation dialog
- Infinite scroll (20 entries per page)

### F5 — Search
- Full-text keyword search across title + body
- MongoDB text index
- Results highlighted
- Debounced input (300ms)

### F6 — Filter and Sort
- Filter by: date range, mood
- Sort by: newest, oldest
- Filter state reflected in URL params (shareable, bookmarkable)

---

## Planned / Future Features (Post-V1)

### F7 — Themes
- Light / dark / sepia modes
- Respects system preference by default
- Manual override persisted to user profile

### F8 — Export
- Export all entries as PDF or Markdown zip
- Single entry export

### F9 — Streaks and Reflection
- Writing streak counter (days in a row)
- Weekly reflection prompt surfaced by AI

### F10 — Voice Entry
- Record voice note, transcribed via Whisper API
- Transcription saved as journal entry

---

## Non-Features (Explicitly Out of Scope)

- No social/sharing features — fully private
- No collaboration — single-user per account
- No mobile app — web only (responsive)
- No markdown syntax in editor — clean prose only
- No image attachments in V1
