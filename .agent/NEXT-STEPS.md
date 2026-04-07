# Next Steps — Post Stage 1

## Immediate (Next Session)

### Eemo Playground Redesign
Redesign the Eemo widget from a fixed-position overlay to a scroll-aware component:

1. **Playground mode** — A dedicated strip at the top of the journal editor (below toolbar, above the ruled paper). Eemo roams/animates freely within this area.
2. **Floating mode** — When the user scrolls past the playground, Eemo transitions to a small floating pill in the top-right corner showing just the current emotion face + a one-line message. No playground, just a compact indicator.
3. **Implementation details:**
   - Use `IntersectionObserver` on the playground div to detect when it scrolls out of view
   - Playground: Eemo face + message with ambient animations (breathing, gentle movement)
   - Floating: small circle with emotion face, expands on hover to show message
   - Smooth transition between the two states via Framer Motion

### Rich Text Editor (TipTap)
Replace the plain `<textarea>` in JournalEditor with TipTap (free, MIT, built on ProseMirror):

1. **Features to add:** bold, italic, bullet lists, numbered lists, headings, block indentation
2. **Packages:** `@tiptap/react`, `@tiptap/starter-kit` (includes all basics), `@tiptap/extension-placeholder`
3. **Styling:** TipTap renders into a `<div contenteditable>` — the existing `ruled-text`, `ruled-lines`, and `ruled-paper` CSS classes apply directly. Kalam font, ruled notebook background all stay as-is.
4. **Toolbar:** Extend the existing `DrawingToolbar` area with formatting buttons (B, I, list, indent) when in write mode
5. **Storage:** TipTap outputs HTML. Store as HTML in `content.md` (still readable) or convert to markdown on save. Either way the file stays human-readable in Drive.
6. **Migration:** Existing plain-text entries load fine in TipTap — it treats plain text as paragraphs automatically. No migration needed.

---

## Short-term Improvements

- Fix favicon 404 on GitHub Pages
- Add error boundary so individual page crashes don't blank the whole app
- Session persistence for Recall chat (save sessions to Drive)
- Loading states when Drive operations are slow

---

## Backlog (Future — No Timeline)

### Self-hosted LLM
Replace Claude/Anthropic API with self-hosted model (e.g., Gemma on VM via Ollama). This would eliminate the Anthropic API key dependency and reduce costs to just VM hosting. Not planned for the near future — current Claude API setup works well and the cost is minimal for 10 users. See `future-drive-spa-architecture.md` for the original design.

### Client-side embeddings (Transformers.js)
Replace Gemini embedding API with `Xenova/all-MiniLM-L6-v2` running in a WebWorker. Would eliminate the last API dependency for embeddings. Tradeoff: ~25MB model download on first load, slightly lower quality embeddings.

### Offline support
Service worker for offline journaling. Write entries offline, sync to Drive when back online.
