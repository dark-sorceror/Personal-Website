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
it looks for the Worker on port 8788 of the host the page came from. Otherwise
the site posts to the Discord webhook directly, as before.

To run it locally beside the site, with the same self-signed certs:

```sh
npm --prefix worker install
npm run visits:dev -- --key key.pem --cert cert.pem   # Worker on :8788
npm run history:dev -- --port 3100 --key key.pem --cert cert.pem
```

`visits:dev` applies the D1 migrations to the local database first. Without
a webhook it's a dry run that logs the embeds; to post to a test channel, copy
`worker/.dev.vars.example` to `worker/.dev.vars` and fill it in. Check the
counts with:

```sh
cd worker && npx wrangler d1 execute haoyan-analytics --local \
    --command "select id, country, city, browser, entry, session from visits"
```
