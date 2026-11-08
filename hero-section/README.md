# Manaal Maple — Portfolio Homepage Hero & Systems

An editorial portfolio experience built upon rich illustrated surrealism, fluid GPU computing, and custom MapleCat-inspired typography.

The homepage harmonizes an expressive illustrated world with a functional website interface:
1. **Background Artwork (`BACKGROUND.svg`)**: Preserved in full with Cool Cloud White (`#F2F5FA`), saturated pinks, cobalt blues, oranges, and whimsical cats.
2. **Interactive Identity Reveal**: The central illustrated character smoothly transitions into the photorealistic portrait via a lightweight GPU-accelerated Eulerian Navier-Stokes fluid simulation on hover.
3. **Top-Left Navigation**: Rounded pill container with thin midnight-blue border, translucent Cool Cloud White background, and pink highlight for active state.
4. **Top-Right Profile Button**: Circular pink button featuring a minimalist cat-ear avatar silhouette.
5. **Left Editorial Statement**: "Curious by nature. / Driven to understand. / Always building something." positioned cleanly in the open sky space.
6. **Bottom-Left 3D Sculptural Computer**: Interactive retro micro-computer toy with soft pink cat ears, cream chassis, and expressive blinking screen.
7. **Bottom-Right Identity**: "Manaal Maple" display typography with feline ear accents on letterforms, paired with an understated systems/design descriptor.
8. **Scrollable Page Flow**: Seamless transition from the 100vh hero section into subsequent portfolio sections (`#projects`, `#tech-stack`, `#contact`).

---

## Architecture & Implementation Overview

### 1. Visual Composition & Layer Alignment
- **Hero Integration**: Structured as a responsive portfolio hero section (`#hero`) with vertical page scrolling enabled (`overflow-y: auto`), allowing subsequent portfolio sections to seamlessly follow beneath.
- **Framing**: The scene maintains an authoritative 1670:941 widescreen aspect ratio across all viewports.
- **Placement**: The subject is anchored in the composition foreground (height: 85% of scene, horizontally centered), aligned with the surreal bridge and floating island landscape.
- **Geometric Precision**: An affine normalization transform maps the photorealistic portrait to the vector illustrated portrait with sub-pixel alignment, ensuring facial features (eyes, nose, mouth, chin, hair) and the resting cat overlap with zero ghosting.

### 2. Lightweight WebGL Fluid Simulation
- **Advection**: Back-traces velocity and dye fields through GPU bilinear interpolation.
- **Vorticity Confinement**: Calculates 2D curl and re-injects angular acceleration to generate rolling liquid eddies and vortices rather than flat linear displacement.
- **Incompressibility**: Solves Poisson pressure equations using Jacobi relaxation iterations.
- **Momentum & Dissipation**: Velocity and density dissipate with calibrated decay coefficients (0.984 velocity, 0.976 density), preserving momentum while avoiding lingering residue or abrupt resets.
- **Continuous Splat Interpolation**: Pointer movements interpolate sub-pixel steps between consecutive frames, generating smooth fluid streams even during high-velocity cursor flicks.

### 3. Reveal Mask & Meniscus Rendering
- **Organic Liquid Threshold**: Converts scalar fluid density into a soft sigmoid reveal curve (`smoothstep(0.04, 0.32, density)`), yielding viscous, rounded liquid boundaries.
- **Meniscus Specular Gleam**: Computes the 2D gradient of the fluid density to derive a surface normal. A directional specular reflection catches the virtual sunlight from the upper-left sun in the background illustration.
- **Chromatic Dispersion**: Adds subtle optical refraction at the advancing fluid boundary, slightly refracting the underlying illustration through the liquid meniscus before dissolving into the photorealistic layer.
- **Background Sheen**: When the cursor moves outside the portrait area, the liquid leaves a subtle glassy translucent wake over the background without obscuring vector detail.

---

## Getting Started

### Direct Offline Execution
The project includes embedded asset fallbacks (`assets.js`), allowing direct execution without a local web server:
1. Double-click `index.html` in any modern web browser (Edge, Chrome, Firefox, Safari).

### Local Web Server Execution
For optimal HTTP asset streaming:
```bash
# Using Node.js
npm start

# Or using Python 3
npm run python
# (Equivalent to: python -m http.server 3000)
```
Open `http://localhost:3000` in your browser.

---

## Simulation Physics & Parameters

The fluid simulation parameters and portrait scaling are calibrated for production:
- **Real Layer Scale**: 1.1x subtle scale boost, centered on facial features for enhanced portrait presence while maintaining close alignment with the illustrated silhouette.
- **Dissipation Persistence**: Calibrated decay coefficient (0.976 density, 0.984 velocity) ensuring fluid momentum carries naturally before dissipating.
- **Swirl Vorticity**: Vorticity confinement parameter of 24.0, generating organic circular eddies and liquid curl.
- **Liquid Stream Width**: Adaptive pointer interpolation dynamically widening the splat radius during fast movements.
- **Surface Meniscus Gleam**: Directional specular reflection catching virtual sunlight from the upper-left sun in the background illustration.
- **Whole-Body Coverage**: Unoccluded pointer event tracking covering the full figure including cat, head, face, neck, chest, torso, and shorts.

---

## Performance Characteristics
- **Desktop Target**: 60 to 120 FPS desktop performance.
- **Simulation Resolution**: 256x144 internal grid resolution, decoupled from screen resolution.
- **Multi-Touch & Mouse**: Full support for pointer events, mouse drag, and touch gestures.

