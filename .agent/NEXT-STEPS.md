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
