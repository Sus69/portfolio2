# Toolkit — Scroll-driven card stack

An isolated React + TypeScript section that recreates the supplied Toolkit reference sequence.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Implementation notes

- React and TypeScript provide the component structure and typed card data.
- GSAP + ScrollTrigger coordinate independent card entrances and a reversible timeline for stacking, flipping, and expansion.
- CSS owns the card geometry, 3D face construction, responsive layout, color surfaces, and depth treatment.
- `src/animations/cardTimeline.ts` coordinates both groups. Every arrival moves the existing hand around a shared circular pivot; stacking starts only after all eight cards arrive.
- Crossing a card's threshold starts a direct 0.26-second card tween, with a 0.22-second fan shift. The master timeline is parked during dealing: scrolling never controls an entrance's playhead. Later arrivals can run concurrently without restarting an earlier card's movement. A new stage waits for active entrances to finish, and crossing backward removes cards. The controller never moves the page's scroll position.
- Tune `CARD_SNAP_DURATION`, `CARD_SNAP_EASE`, and `FAN_SHIFT_DURATION` at the top of `src/animations/cardTimeline.ts`; these real-time controls are independent of the master timeline's stage positions.
- The collapsed Shopify card rotates its inner 3D wrapper to reveal Figma. Covered cards are repositioned while hidden, then enter one at a time as reverse faces.
- Corner radii propagate through the shell, inner wrapper, and both faces. Only the inner wrapper rotates in 3D, preserving backface culling.
- The final card expands around its center using measured viewport/card dimensions. Once its cream surface covers the viewport, the next scene takes over above it and the entire old stage is hidden. All steps reverse with scrolling.
- `prefers-reduced-motion` removes the pinned choreography and exposes the complete front/reverse card index as readable content.

## Verification

```bash
npm run build
npx playwright install chromium
npm test
```

Browser regressions cover tiny-scroll entrance completion, fast settling during continuous scrolling and overlapping arrivals, progressive fan entrances, the painted Figma reverse face, full-viewport coverage, clean handoff, reverse scrolling, mobile bounds, live resizing, reduced motion, and console errors. Screenshots from the desktop/mobile checkpoints are written under `test-results/`.
