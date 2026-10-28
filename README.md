# Personal-Website

Personal website of Hao Yan

**Live:** [haoyan.ca](https://haoyan.ca)

## Stack

- [Next.js 16](https://nextjs.org) (App Router, static export)
- [React 19](https://react.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- TypeScript, deployed to GitHub Pages via Actions

## Structure

```
src/
  app/          # App Router: layout, page, global styles
  components/   # UI components (DotCanvas, ThemeToggle, ...)
  hooks/        # Client hooks (page tracking, visitor log)
  lib/          # Framework-free logic (Life engines, session state)
worker/         # Visit counter: a Cloudflare Worker with D1
```

## Visit counter

`worker/` is a Cloudflare Worker that numbers each visit in D1 and posts it to
Discord as "Visitor #1,234", then edits that message as the visit goes on. The
site uses it when `NEXT_PUBLIC_VISIT_ENDPOINT` is set, and in development, where
`history:dev` passes `/__visits/` on to the Worker, so a phone on the LAN reaches
it through the site. Otherwise the site posts to the Discord webhook directly,
as before. A link tagged `?via=code` is counted with its tag, which is then
taken off the address.

To run it locally, in two terminals:

```sh
npm --prefix worker install
npm run visits:dev        # Worker on http://127.0.0.1:8788, loopback only
npm run history:dev -- --port 3100 --key key.pem --cert cert.pem
```

On another port, pass it to both: `npm run visits:dev -- --port 8790` and
`--visits-port 8790` to `history:dev`. Plain `npm run dev` doesn't pass visits
on, so nothing is counted there.

`visits:dev` applies the D1 migrations to the local database first, and
counts there only, so testing never moves the live numbers. Without a webhook
it's a dry run that logs the embeds; to post, copy `worker/.dev.vars.example`
to `worker/.dev.vars` and fill it in. Dev visits are titled `[dev]`, coloured
amber and footed "· dev". Check the counts with:

```sh
cd worker && npx wrangler d1 execute haoyan-analytics --local \
    --command "select id, country, city, browser, entry, session from visits"
```
