# Design Specification — Muse Journaling App

## Visual Identity

**Name:** Muse
**Personality:** Calm, intimate, contemplative. Like a beautiful paper journal, not a productivity tool.
**Inspiration:** Physical journals, morning light, quiet rooms, handwriting

---

## Color Palette

### Light Mode (Primary)
```
Background:     #FAF8F5   (warm white, like old paper)
Surface:        #FFFFFF   (pure white cards)
Surface-muted:  #F2EEE8   (slightly warmer surface)
Border:         #E8E2D9   (subtle warm gray)
Text-primary:   #2C2825   (dark warm brown, not pure black)
Text-secondary: #8B7D72   (muted warm gray)
Text-muted:     #B5A99F   (very muted)
Accent:         #7C9E8A   (sage green — calm, natural)
Accent-light:   #EAF1EC   (sage tint for hover states)
Error:          #C4614E   (muted red)
Success:        #6A9B77   (muted green)
```

### Dark Mode (Future)
```
Background:     #1A1815
Surface:        #242220
Text-primary:   #F0EBE4
Text-secondary: #9E918A
Accent:         #8FB09D
```

---

## Typography

### Font Families
```css
--font-serif: 'Lora', 'Georgia', serif;          /* Journal body text */
--font-sans: 'Inter', system-ui, sans-serif;      /* UI chrome */
--font-mono: 'JetBrains Mono', monospace;         /* Code (if ever needed) */
```

### Type Scale
```
Display:    48px / 56px line-height / Lora / 400 weight (journal title in editor)
H1:         36px / 44px / Lora / 400
H2:         24px / 32px / Inter / 600
H3:         18px / 28px / Inter / 600
Body-lg:    18px / 30px / Lora / 400             (journal body text)
Body:       16px / 26px / Inter / 400            (UI text)
Body-sm:    14px / 22px / Inter / 400            (secondary info)
Caption:    12px / 18px / Inter / 400            (metadata, word count)
```

---

## Spacing

Base unit: 4px
Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

---

## Border Radius
```
sm: 4px    (tags, small elements)
md: 8px    (cards, inputs)
lg: 12px   (modals, large cards)
xl: 16px   (journal editor surface)
full: 9999px (pills, avatars)
```

---

## Shadow
```
sm:  0 1px 3px rgba(44, 40, 37, 0.08)
md:  0 4px 16px rgba(44, 40, 37, 0.10)
lg:  0 8px 32px rgba(44, 40, 37, 0.12)
```

---

## Animations

### Timing
```
instant:    0ms      (no animation, state toggle)
fast:       150ms    (word fade-in, hover)
normal:     300ms    (page transitions, modal open)
slow:       500ms    (save success, celebration)
```

### Easing
```
ease-out:   cubic-bezier(0.16, 1, 0.3, 1)     (entries appearing)
ease-in:    cubic-bezier(0.7, 0, 0.84, 0)     (exits)
spring:     cubic-bezier(0.34, 1.56, 0.64, 1) (save confirmation bounce)
linear:     linear                              (cursor blink)
```

### Key Animations

**Word Fade-In (Editor)**
```css
@keyframes wordFadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Applied to each new word span: animation: wordFadeIn 150ms ease-out */
```

**Cursor Blink**
```css
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
/* Custom cursor element: animation: cursorBlink 1s step-end infinite */
```

**Page Entry**
```css
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**Save Success (ink drop)**
```css
@keyframes inkDrop {
  0%   { transform: scale(0); opacity: 0.8; }
  60%  { transform: scale(1.2); opacity: 0.4; }
  100% { transform: scale(1.5); opacity: 0; }
}
```

---

## Screen Designs (Figma Screens)

### 1. Login Page
- Centered card on warm background
- App name "Muse" in Lora, large, centered above card
- Tagline: "A space to remember yourself" in muted text
- Google sign-in button (full width, standard Google brand)
- Subtle texture or grain overlay on background

### 2. Dashboard
- Navbar: "Muse" logo left, avatar right
- "Ask your journal..." recall input — prominent, centered, below navbar
- Entry list below: masonry grid on desktop, single column on mobile
- Floating "+" button for new entry (bottom right)
- Entry cards: date top-right, title, excerpt, mood dot

### 3. Journal Editor (Full Focus Mode)
- No navbar — only a subtle "Save" status top-right and "← Back" top-left
- Background: warm white, full page
- Title: huge Lora font, placeholder "What's on your mind today?"
- Horizontal divider below title
- Body: large Lora body text, comfortable line-height
- Mood selector: subtle icon row at bottom
- Word count: bottom-right, very muted
- Custom animated cursor (slim, rounded, accent color)

### 4. Entry Detail
- Read-only view of editor layout
- Title and body in same typography
- Date/mood in muted header
- Edit and Delete actions in a subtle top bar

### 5. AI Recall View
- Split: left = conversation, right = cited entries
- Input at bottom, streamed response above
- Cited entry cards: mini version of JournalCard with "Recalled from" label
- Calming illustration for empty/loading state

### 6. Empty State (First Visit)
- Illustrated: open journal, pen resting
- "Your story starts here" headline
- "Write your first entry" CTA button
- Warm, encouraging, not clinical

---

## Figma File Structure

```
Muse Design
├── 🎨 Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Animations
├── 🧩 Components
│   ├── Primitives (Button, Input, etc.)
│   ├── Journal (JournalCard, MoodSelector, etc.)
│   └── Layout (Navbar, PageWrapper, etc.)
└── 📱 Screens
    ├── Login
    ├── Dashboard
    ├── Journal Editor
    ├── Entry Detail
    ├── AI Recall
    └── Empty State
```

---

## Figma MCP Usage

When design is ready, use these tools in sequence:

1. `get_variable_defs` → extract color and typography tokens → paste into `tailwind.config.ts`
2. `get_design_context` (per screen node) → get component structure for implementation
3. `get_screenshot` → visual reference during component build
4. `generate_diagram` (FigJam) → system architecture diagram
