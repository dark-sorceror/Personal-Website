# Deep-space homepage

The preview was developed on `feat/deep-space-background` and is included on
main as one squashed commit. The full background experiments remain on
`feat/ascii-space-dark-mode`; the headless-agent work remains on
`feat/headless-computer-agents`.

The homepage uses only the Night archive (04) ASCII star field. There are no
background arrows, image backgrounds, scene switching, or experiment settings.
Stars stay anchored and breathe gently over a 12-second loop. Desktop draws at
18fps, repainting only changed dust glyphs. Phones and reduced motion are static;
hidden/offscreen animation pauses. A transparent canvas follows the page surface.

The original `ThemeToggle.tsx`, icon stylesheet and theme-transition stylesheet
are restored directly from main. Theme choice persists in `localStorage.theme`.
Both the page and the star/dust palettes update when the theme changes. The
button sits in the header on desktop and the 44px mobile link dock on phones.

Phones retain a dedicated star vignette above the reading content, roughly 16px
reading text, 24px safe-area-aware gutters and full-size touch targets. The
LinkedIn URL is `https://www.linkedin.com/in/haoyan160/`. Quotes are in the footer,
right of the date on desktop and right-aligned below it on phones.

`src/components/background/` contains the page wrapper, canvas lifecycle, pure
field/layout functions and their tests. Photo loading, multi-scene preferences,
scene fade timers and retired image assets are absent from this branch. Source
research and outpainting notes remain in `docs/` as historical records.

Validation:

```sh
npm test
npm run typecheck
npx eslint src scripts/background
npm run build
npm run background:verify
npm run background:verify:mobile -- --webkit
```

40 unit tests, TypeScript, feature lint, production build, desktop Chromium and
mobile WebKit checks pass. The original toggle and transition files match main
byte for byte. Dynamic reduced-motion pause/resume is covered.

The browser checks stream the static export into an isolated browser without
opening a port. They cover both themes, canvas recoloring, saved theme choice,
keyboard and rapid toggles, reduced motion, legacy scene preferences, mobile
layout, footer clearance and history-route ownership. Screenshots are saved to
`/private/tmp/deep-space-review/`. Existing unrelated local files and the saved
worker-edit stash are preserved. The experiment branches remain local.

Local preview is stopped. Use port 3002 because unrelated docs and Lumen servers occupy
3000 and 3001. Bind to `::` so both IPv4 and IPv6 localhost resolve correctly.
