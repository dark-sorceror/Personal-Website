# ASCII backgrounds

> Branch note: `feat/deep-space-background` now keeps only Night archive (04),
> with the original light/dark toggle and matching star palettes. The full
> experiment set is preserved on `feat/ascii-space-dark-mode`. The research and
> implementation history below describe those earlier experiments.

The homepage at `/` renders five colored ASCII backgrounds. The previous
`/experiments/space/` route has been removed. All rendering uses local assets
or procedural fields; nothing is published by the verification commands.

## Implementation

`src/components/background/` contains the homepage composition, arrow controls,
canvas renderer, scene definitions, palettes, preferences, geometry and compiled
animation fields in separate modules. Only the five active scenes are included
in runtime data. The scalar comparison sampler lives in a test fixture and is
not imported by application code.

The cycle is **03 → 04 → 09 → 10 → 15**, with Polar jet as the default. Scene
identifiers and the storage key preserve existing preferences; retired lens
selections migrate to Golden lens and other removed selections fall back to
Polar jet. Desktop animation and mobile static defaults are unchanged.

Active images are under `public/space/`. Unselected sources and the original
Polar jet frame are preserved under `reference/space/` and are excluded from
the public export. Research and provenance from the design work follow below.

## Visual research

The goal is recognizable space imagery built from actual letters and symbols,
with the warmth and depth of telescope images rather than green terminal rain.
These references were researched and inspected on November 8, 2026:

- [NASA Goddard: black hole accretion disk visualization](https://svs.gsfc.nasa.gov/13326/).
  Compared the edge-on and oblique views. The latest design uses an oblique,
  more face-on swirling disk after the user rejected the oversized diagonal
  edge-on composition. The source's asymmetric brightness is more compelling
  than a symmetric neon donut. Credit: NASA Goddard / Jeremy Schnittman.
- [NASA: a black hole's warped world](https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/).
  Explains the bent view of the disk and its sheared, bright knots. Inspired
  the restrained orbital shear and traveling light in the 16-second loop.
- [ESA / Webb: the heart of the Phantom Galaxy](https://www.esa.int/Science_Exploration/Space_Science/Webb/Webb_inspects_the_heart_of_the_Phantom_Galaxy).
  Studied the clear spiral arms, luminous nucleus, fine filaments and dusty
  gaps. The galaxy scene is an original procedural logarithmic spiral with
  lavender, blue and ivory pigment; it does not reproduce the photograph.
- [Webb's Cosmic Cliffs, NIRCam](https://science.nasa.gov/asset/webb/cosmic-cliffs-in-the-carina-nebula-nircam-image/)
  and [NIRCam / MIRI composite](https://science.nasa.gov/asset/webb/cosmic-cliffs-in-the-carina-nebula-nircam-and-miri-composite-image/).
  Compared the warm ridgeline against the cool stellar sky and the composite's
  greener, softer dust. The experiment samples the NIRCam photograph and
  interprets it as teal and ochre glyphs. Credit: NASA, ESA, CSA, STScI.
- [Hubble: Omega Centauri](https://science.nasa.gov/asset/hubble/hubble-acs-image-of-omega-centauri/).
  A reference for uneven stellar brightness and warm/cool stars. The original
  star-field composition uses fewer marks and much more empty space, making
  it a useful quiet alternative to the other scenes.
- [The Coding Train: Image to ASCII](https://thecodingtrain.com/challenges/166-image-to-ascii).
  Studied brightness-to-character mapping, colored image sampling and cell
  proportions. Implemented a custom renderer without adding p5.js.
- [Three.js: AsciiEffect](https://threejs.org/docs/pages/AsciiEffect.html)
  and its linked source. Reviewed the character-density approach and
  resolution/color tradeoffs. A cached glyph atlas on Canvas 2D suits this
  small experiment without adding a 3D engine or thousands of DOM nodes.

## The original seven compositions

| Scene          | Treatment                                                      | Loop                                       |
| -------------- | -------------------------------------------------------------- | ------------------------------------------ |
| Event horizon  | NASA's oblique swirling disk, amber through pale gold          | 16 seconds; orbital shear and moving light |
| Spiral signal  | Procedural spiral, dusty gaps, violet / blue / ivory           | 20 seconds; light traveling along the arms |
| Cloud nursery  | Webb's Cosmic Cliffs reinterpreted in teal and ochre           | 18 seconds; gentle spatial tide            |
| Night archive  | Sparse printable stars over a faint dust lane                  | 12 seconds; breathing starlight            |
| Ring passage   | Procedural Saturn, shaded sphere and fine ring gaps            | 20 seconds; ring glimmer and cloud bands   |
| Solar crown    | A total-eclipse study with fine coronal streamers              | 16 seconds; coronal breathing              |
| After the star | A fragmented teal and rose shell, inspired by the Helix Nebula | 18 seconds; shell radiance                 |

Additional references: [Cassini's Saturn portraits](https://www.nasa.gov/news-release/nasa-cassini-spacecraft-provides-new-view-of-saturn-and-earth/),
[NASA's 2017 eclipse corona](https://www.nasa.gov/image-article/suns-corona-seen-during-2017-solar-eclipse/),
and the [Helix Nebula composite](https://www.nasa.gov/image-article/helix-nebula/).
These three designs are original procedural interpretations. Their motion is
an authored 16–20 second loop, not motion measured from the references.

Every visible mark in the background is an ASCII character. No photograph is
drawn onto the visible canvas. Photographs are local sampling sources;
the page makes no image API calls. Each scene uses the window as its canvas:
the black hole is a medium-large oblique disk spanning the left half and
reaching into the page; the galaxy spans about two-thirds of the window,
and the nebula fills it. A softer fade protects the existing reading column
without reserving the left margin for the art. Glyphs are rendered at screen-pixel
sizes accounting for the site's `html { zoom: 0.72 }` convention.

The experimental panel and floating Space tab are removed. Only the previous
and next SVG chevrons remain beside the location label in the header.
Phones use a compact appearance row above the content. Colors, centered
alignment and button heights are consistent.

The fullscreen/background-only feature has been removed entirely, including
its center icon button, floating HUD, idle/reveal timers and listeners,
keyboard captures, content hiding, scroll locks, focus restoration and
alternate canvas composition. Content always stays visible and scrollable.

The arrows cycle through the five selected backgrounds. Only ASCII glyph
colors fade to black over 220ms, wait briefly for the next scene to paint,
then return over 220ms. A canvas brightness filter preserves transparency;
page content and its background stay steady. Reduced motion switches directly.

Existing motion, glyph-size and brightness preferences remain saved, without
the old experiment controls. New desktop sessions animate and new phones are
static. Reduced motion stays static. Hidden tabs stop the animation clock.
The loops are authored visual interpretations, not scientific simulations.

## Appearance

The site now uses a permanent dark appearance. The theme toggle, light palettes,
color-transition machinery and saved theme preference handling are removed.
The canvas stays transparent so the dark page surface shows between glyphs.
History previews use dark screenshots; archived versions remain unchanged.

### Earlier light-mode experiment (retired)

Each scene has its own light palette, designed separately from its dark
palette: ochre and burnt orange, indigo and plum, blue-green, sepia, coral,
and rose. Bright regions become deeper ink rather than pale emitted light.
White and cream highlights become charcoal; colored midtones use deeper ink,
while the weakest glyphs are omitted to reduce the washed-out texture.
The existing warm paper background shows through empty space. No black
photograph rectangle or canvas fill remains behind the glyphs.

This also fixes the theme-toggle bug: caching `--bg` on the first frame of
the CSS color transition captured the previous theme. A transparent canvas
now follows the page background automatically, even with static art.

## Mobile composition

Phones now get a deliberately composed masthead: identity and appearance
controls, followed by a 144–204px ASCII vignette, then the reading content.
The art occupies its own layout slot and fades at its boundaries, so it never
sits behind résumé text. Scene changes leave header/content positions fixed.

Each scene has a separate phone framing. Polar jet's hole stays near 68% of
the art band's height, with room for the blue plume above; Golden lens shifts
left to keep its bright arc visible. A finer mobile glyph grid gives these
small compositions more definition. The desktop layout and 09's desktop
position are unchanged.

The reading type is approximately 16px, with 24px minimum gutters and safe-area
insets. Muted text has stronger contrast. Standalone controls
and dock links use 44px touch targets; the dock no longer scales down while
reading. The diagram/gallery actions also keep accessible tap sizes. Touch
hover states do not linger after a tap.

The shared compact-layout rule includes short touchscreens in landscape. In
that orientation, identity and appearance controls share one row, and the
art band shortens to 112px. Static mobile defaults, reduced motion and offscreen
animation suspension remain intact.

The touch-size and safe-area choices are informed by
[Apple's UI design guidance](https://developer.apple.com/design/tips/), while
320px reflow checks follow the viewport size used in
[W3C's reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).
Verification covers the layouts, controls, and text contrast described here.

Run `npm run background:verify:mobile`, adding `-- --webkit` for WebKit. The
checks use touch-enabled 320/360/390/430px portrait viewports and 844×390
landscape, all five scenes, rotation, enlarged text, body/metadata
contrast, dock/footer clearance and gallery interaction. Both engines pass.
The captures and a self-contained before/after comparison are saved under
`/private/tmp/ascii-background-review/`. Localhost remains stopped.

## Local image sources

- `reference/space/black-hole-face.webp`: NASA Goddard's
  [oblique accretion disk still](https://svs.gsfc.nasa.gov/vis/a010000/a013300/a013326/Black_Hole_Accretion_Disk_Sim_4k_ProRes.00386_print.jpg),
  resized to 960 × 960 and converted to WebP. Retained from an earlier study.
- `reference/space/black-hole.webp`: retained first-study source, first frame of NASA Goddard's
  [edge-on GIF](https://svs.gsfc.nasa.gov/vis/a010000/a013300/a013326/BH_AccretionDisk_Sim_Stationary_WebSize.gif),
  converted to a still WebP (1040 × 600, about 38 KB).
- `public/space/cosmic-cliffs.webp`: NASA's
  [NIRCam image](https://assets.science.nasa.gov/dynamicimage/assets/science/missions/webb/science/2022/07/STScI-01GA6KKWG229B16K4Q38CH3BXS.png?fit=clip&w=1200&h=700),
  resized to 960 × 556 and converted to WebP (about 155 KB).

Source credits and links are also available in the controls for each scene.

## Six user-selected references

Added from the six newest images in Downloads on November 8, 2026. The
originals are preserved. No creator or scientific attribution is inferred;
the controls label these as the user's references and link to the local image.

| Picker | Study            | Original filename                                      | Loop |
| ------ | ---------------- | ------------------------------------------------------ | ---- |
| 08     | Chromatic clouds | `360_F_123508533_EwtKBJpXDUcjrLHbBYCb6PjMw8Qyxh42.jpg` | 18s  |
| 09     | Polar jet        | `images.jpeg`                                          | 16s  |
| 10     | Golden vortex    | `Black-Hole-5K.jpg`                                    | 20s  |
| 11     | Pastel lens      | `images-2.jpeg`                                        | 18s  |
| 12     | Silver horizon   | `r8qc3u0bq5fb1.jpg`                                    | 16s  |
| 13     | Amber orbit      | `img_20250428_233451_332.jpg`                          | 20s  |

The six optimized WebPs total about 286 KB and never upscale the originals.
Each uses its own eight-color palette and corresponding paper inks. Visible
pixels are still exclusively ASCII. The renderer samples the image at its
original aspect ratio, covers the viewport with a minimal crop, and adds
gentle periodic drift and light variation. It adds no extra star layer to
these six, preserving the supplied image compositions.
Polar jet (09) has been raised by 16% of viewport height and shifted left by
4.5% of viewport width at the user's request, including the latest tiny leftward
correction. Exposed image edges fade softly
into the page. Decoded sources are cached so toggling Static does not reload
or briefly clear the artwork.
The blue plume in 09 has hue-preserving blue mapping, avoiding the earlier
conversion of dim blue pixels to brown. After the outpaint review, the exposure
lift was reduced, plume opacity softened, and dark-mode blues muted. Warm disk
pixels keep their existing brightness. Paper mode uses deeper navy ink for the
same plume.

09's source has also been edited with the built-in ImageGen tool to extend the
orbital texture below the old bottom edge and add thin blue filaments. The
active asset is `public/space/polar-jet-extended.webp`; the original is retained.
The renderer uses the original 738 × 414 frame as an anchor while sampling
the extra lower canvas, preserving subject scale and position. See the
[complete edit prompt and provenance](polar-jet-source-edit.md).

Two follow-up variants of 11 were added from the newest Downloads files:

| Cycle position after 11 | Study       | Original filename      | Local asset                               |
| ----------------------- | ----------- | ---------------------- | ----------------------------------------- |
| First (14)              | Silver lens | `IS-BH-1024x576-1.jpg` | `reference/space/pastel-lens-silver.webp` |
| Second (15)             | Golden lens | `blackhole.jpg.webp`   | `public/space/pastel-lens-gold.webp`      |

Both preserve the supplied composition, have their own dark/paper palettes,
and use gentle 18/20-second loops. The Downloads originals are untouched.
The user chose the third version overall, Golden lens (15), as the sole active
version of 11. Original 11 and Silver lens (14) remain archived.

## Verification without a server

### Performance pass, November 9

The animation now compiles fixed geometry once, reuses typed arrays, and
caches each sampled source pixel's palette index and exposure. Trigonometric
angle-addition identities reduce the per-cell frame work to multiplies and
adds, using one sine/cosine pair for the frame. The star dust's stationary
noise is also computed once. A scalar test fixture remains the reference for numerical regression tests;
it is excluded from the runtime dependency graph.

Rendering keeps the last glyph, palette index and 8-bit alpha for each cell,
then clears/draws only changed cells. Device-pixel-aligned cell bounds prevent
neighbouring glyph edges from being erased. Sparse stars have a separate
canvas so their breathing doesn't force a full ASCII-grid repaint. Framing,
palettes, glyph density and source resolution are preserved; glyph raster
edges now align with backing pixels.

The idle full-canvas brightness filter is removed; it runs only during a
background transition. Duplicate resize notifications no longer rebuild an
unchanged grid. Phone artwork pauses when scrolled offscreen, and the unused
original dot background releases its fullscreen buffers until needed again.
No renderer dependency or worker infrastructure was added. These choices
follow the caching, selective redraw and layering approaches in
[MDN's canvas optimization guidance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas).

Measured in production-export headless Chromium, DPR 2, dark mode, default
glyph size/brightness, 1.6 seconds warmup and 5 seconds sampling per scenario:

| Scene / viewport | Mean callback before | Mean callback after | FPS before → after |
| ---------------- | -------------------- | ------------------- | ------------------ |
| 09 / 1440 × 1000 | 28.29ms              | 1.37ms              | 15.4 → 18.0        |
| 09 / 2560 × 1440 | 76.41ms              | 6.86ms              | 10.0 → 18.0        |
| 03 / 2560 × 1440 | 70.79ms              | 9.11ms              | 11.0 → 18.0        |
| 04 / 2560 × 1440 | 16.67ms              | 0.62ms              | 14.8 → 18.2        |

These measure animation callback work, not a percentage reduction in total
page CPU usage. The large 09 scenario's measured main-thread task time fell
from about 1001 to 726ms per second; paint/compositing still has a cost in this
headless environment. Runtime depends on hardware and browser. The benchmark
uses the exported app to exclude development-server overhead and checks for
runtime errors. Run `node scripts/background/profile.mjs before` or `after`; JSON
results are written to `/private/tmp/ascii-background-performance/`.

Numerical tests compare all five compiled fields against the original samples
throughout their loops, including the extended 09 frame. Browser checks force
a clean repaint at an animated phase and compare pixels against the incremental
frame, plus verify offscreen pause/resume and dormant dot-canvas restoration.

```sh
npm test
npm run typecheck
npm run build
npm run background:verify
git diff --check
```

The browser check intercepts all requests and streams the static `out/` export
into headless Chromium. No server or port is opened. It checks the five-scene
cycle and wraparound, glyph-only black fades with unchanged content, header order, static pixels and animated
frames, persistently visible/scrollable content, keyboard button access,
permanent dark appearance despite legacy light preferences, 320/390px phones, tablet,
desktop, reduced motion and the canonical homepage. Screenshots go to
`/private/tmp/ascii-background-review/`.
