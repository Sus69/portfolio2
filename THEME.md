# Whimsical Editorial — Theme

**Manaal Maple — Whimsical Editorial**
Colourful Editorial Design × Whimsical Organic Surrealism.
Playful, curious, expressive, sophisticated and slightly absurd.

A colourful illustrated world with an editorial designer's eye and a
curious engineer's personality.

## Palette

Use only these six hexes for main surfaces. No other hexes were
introduced for backgrounds, text, or accents.

| Colour | Hex | Role |
| --- | --- | --- |
| Cool Cloud White | `#F2F5FA` | Dominant background / white space |
| Bubblegum Pink | `#FF3F70` | Focal accent, selection, active states |
| Sunset Orange | `#FF8552` | Focal accent |
| Golden Yellow | `#FFD447` | Focal accent, highlights |
| Electric Cobalt | `#3548C8` | Focal accent, secondary text accents |
| Midnight Blue | `#14245C` | Main ink / text, dark surfaces |

CSS variables (defined in each section's `global.css`):

```css
--cloud: #F2F5FA;
--pink: #FF3F70;
--orange: #FF8552;
--yellow: #FFD447;
--cobalt: #3548C8;
--midnight: #14245C;
```

White space (`#F2F5FA`) dominates in every section. Midnight Blue is the
main ink. Pink / Orange / Yellow / Cobalt are deliberate focal points
only — never a full background wash.

## Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display | **Fredoka** (600) | Temporary alternative to MapleCat — rounded, playful, expressive. Used for headings, card titles, project names, the footer phrase. |
| Body | **DM Sans** (400 / 500 / 700) | All body copy, nav, labels, meta. |
| Hand-drawn | **Caveat** (600) | Small annotations only — the cat notes and hand-written asides. |

Loaded via one Google Fonts import at the top of each section's
`global.css`. When the real MapleCat face exists, swap Fredoka for it
in the `--display` / display `font-family` declarations — nothing else
needs to change.

## Visual language

- **Organic, imperfect geometry** — uneven blob radii, e.g.
  `24px 28px 22px 30px / 28px 22px 30px 24px`, on cards, the nav pill,
  preview images, the footer reveal and pills. Nothing is a perfect
  rectangle or a perfect pill any more.
- **Cats as recurring characters** — one small inline SVG cat
  (`src/components/ThemeCat.tsx`, drawn in code, no external image,
  no emoji) in each section, same cat, different spot:
  - Card section: peeking at bottom-right of the pinned scene.
  - Projects section: sitting bottom-left beside the project list.
  - Footer section: in the revealed footer, next to "See you around."
- **Surreal interruptions** — one short Caveat annotation per section:
  - Cards: "a cat supervised this build"
  - Projects: "psst — hover a letter"
  - Footer: "keep going ↓" (restyled as a hand-written note) and
    "a cat supervised this build" in the revealed footer.
- **Asymmetric editorial composition** — eyebrows and kickers rotated
  −2deg, subtitles rotated −1.5deg, offset editorial shadows
  (`8px 8px 0 rgba(20,36,92,.12)`), intentional negative space around
  the centred headings.

## Per-section mapping

### card-section — Toolkit card stack

- Was dark `#211f1f` / cream `#f5e9df`, Cormorant Garamond import.
  Now Cloud White background, Midnight ink, Fredoka headings,
  Caveat subtitle ("Creative Front-end" / "Art Direction").
- Card tones remapped to the palette only (class names unchanged, so
  `Card.tsx` and `data/cards.ts` are untouched):
  - `yellow` → Golden Yellow / Midnight
  - `white` → Cloud White / Midnight
  - `black` → Midnight Blue / Cloud White
  - `green` → Electric Cobalt / Cloud White
  - `slate` → Sunset Orange / Midnight
  - `blue` → Bubblegum Pink / Cloud White
  - `lime` → Sunset Orange / Cloud White
  - `gradient` → Pink → Orange → Yellow → Cobalt
  - `figma` → Bubblegum Pink / Cloud White
  - `red` → Sunset Orange / Midnight
  - `maroon` → Midnight Blue / Golden Yellow
  - `indigo` → Electric Cobalt / Golden Yellow
- Pills on each tone use the matching contrasting pair from the same
  table (see `experience.css`).

### txt-img-cvrt-section — Projects, text → image

- Was light beige `#e9e3db` / `#211f1f`, Cormorant Garamond names.
  Now Cloud White background, Midnight ink, Fredoka project names.
- Per-project accent (name colour):
  - `safar` → Bubblegum Pink
  - `itqan` → Electric Cobalt
  - `adval` → Sunset Orange
  - `noortrack` → Midnight Blue, with a Golden Yellow preview frame
  - `AS&OI` → Bubblegum Pink, with a Sunset Orange preview frame
- Preview images get a Midnight border and an uneven blob radius.
  Scroll feedback fill / active tick is Bubblegum Pink. Two faint
  colour blobs (Yellow top-left, Pink bottom-right) sit behind the
  list as a surreal interruption.

### ftr-sprze-section — Footer surprise reveal

- Was dark `#17151b`, DM Serif Display, lime selection.
  Now Cloud White scene, Midnight ink, Fredoka phrase and footer
  heading.
- Glows remapped: coral → Bubblegum Pink, violet → Electric Cobalt,
  blue → Sunset Orange, lime → Golden Yellow; blend mode changed
  from `screen` (for dark) to `multiply` (for light).
- The big phrase keeps its gradient-clip treatment, now
  Midnight → Pink → Orange → Cobalt.
- The revealed footer is now Midnight Blue with Cloud White text,
  Golden Yellow kicker, Pink hover underlines — the dark focal point
  at the end of a mostly-white page.
- "keep going ↓" and the caption are Caveat notes; the period after
  "you will really like this one." is Bubblegum Pink.

### hero-section — Fluid identity reveal hero (added in 5f66ed2)

- Was already close to the theme, with near-miss variants: Pink
  `#ff758f`, Orange `#ff9f43`, Yellow `#fbc531`, Cobalt `#2e86de`,
  Midnight `#13182b`, Syne display, Plus Jakarta Sans body.
  Now the exact palette and fonts:
  - `#ff758f` → Bubblegum Pink `#FF3F70`
  - `#ff9f43` → Sunset Orange `#FF8552`
  - `#fbc531` → Golden Yellow `#FFD447`
  - `#2e86de` → Electric Cobalt `#3548C8`
  - `#13182b` (and `rgba(19, 24, 43, …)`) → Midnight Blue `#14245C`
    (and `rgba(20, 36, 92, …)`)
  - Syne → Fredoka (600/700), Plus Jakarta Sans → DM Sans,
    plus Caveat for the hand-drawn note. Same Google Fonts import
    as the other sections; `theme-color` is `#F2F5FA`.
- UI chrome only: nav pill, nav links, profile button, project
  cards, stack columns, contact card, identity block and tags get
  uneven blob radii; section tags are rotated −2deg; project numbers
  are Pink / Cobalt / Orange across the three cards; stack column
  underlines are Pink / Orange / Yellow.
- One Caveat note added in `index.html`, under the editorial
  statement: "a cat supervised this build". No extra SVG cat was
  added — the hero already has cats throughout (profile avatar,
  retro-computer cat face, cat-ear `M`s, the background artwork).
- Deliberately left untouched in the hero: `BACKGROUND.svg`,
  `ANIMATED.svg`, `REAL.png`, `REAL.webp`, `assets.js`, `fluid.js`,
  `cat-font`, `README.md`, `package.json`. No artwork was
  recoloured, no fluid-simulation code changed, no copy, project
  names, or layout geometry changed. The retro computer's own
  screen colours (`#10b981`, `#38bdf8`, `#0f172a`, cream chassis)
  were kept as part of that toy. The hero is a standalone plain
  HTML/JS section — it is not a root npm workspace, and was not
  added to the root `package.json` workspaces.

## Deliberately not changed

- No copy, project names, card titles, or the footer phrase were
  changed.
- No GSAP timelines, ScrollTrigger logic, animation durations, data
  files, or component structure — except the small cat / annotation
  additions (`ThemeCat.tsx` + two lines per section component).
- `prefers-reduced-motion` handling is preserved; the reduced-motion
  card list colour was fixed to Midnight on Cloud White so it stays
  readable on the new light background.
- No GitHub push, PR, or deployment was made from this change.
