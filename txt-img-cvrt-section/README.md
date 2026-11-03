# Text → Image Conversion Section

Standalone project-text interaction section.

## Run

```bash
npm install
npm run dev
```

## Interaction

- The section pins one viewport while `safar`, `itqan`, `adval`, `noortrack`, and `AS&OI` fade in sequentially.
- A small vertical dot/line mark provides scroll feedback as part of the composition.
- Hovering, focusing, or tapping a letter replaces that letter with its project-local preview image.
- The name uses natural glyph widths and expands only the replacement slot, moving neighbors without overlap.
- Preview returns are independent: switching letters cannot cancel an existing 600ms bouncy return.
- The project is marked complete with browser coverage for the pinned reveal, viewport fit, hover replacement, independent returns, mobile bounds, image loading, and reduced motion.
