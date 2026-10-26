// Turns a past version's build output into a snapshot that works, and stays
// private, when served from /history/<key>/ instead of the site root.
import fs from "node:fs";
import path from "node:path";

// Files that only mean something at the site root
const ROOT_ONLY = [
    "CNAME",
    "404.html",
    "404",
    "robots.txt",
    "sitemap.xml",
    ".nojekyll",
];

const TEXT_EXT = new Set([
    ".html",
    ".js",
    ".mjs",
    ".css",
    ".txt",
    ".json",
    ".webmanifest",
    ".svg",
    ".xml",
]);

// Keeps search engines out, and limits fetch, XHR and beacons to this
// origin, so no old build can reach the visitor log or its IP lookup
export const HEAD_TAGS =
    '<meta name="robots" content="noindex, nofollow">' +
    `<meta http-equiv="Content-Security-Policy" content="connect-src 'self'">`;

export function walk(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const p = path.join(dir, entry.name);

        return entry.isDirectory() ? walk(p) : [p];
    });
}

const PATH_RE = /(["'`(=])(\/(?!\/)[A-Za-z0-9_\-.~%@/]+)(?=[?#"'`)\\\s>])/g;

/**
 * Prefixes root-relative paths ("/media/a.png", url(/icon.svg)) with the
 * snapshot's base path, but only paths to files the snapshot really has.
 * Routes, already-prefixed paths and anything else are left alone, so
 * client-side routers keep working and a second pass changes nothing.
 * Pages and RSC payloads (.html, .txt) belong to the router, which already
 * prefixes them; "/index.txt" is also a bare suffix test in Next's runtime.
 */
export function rewriteRootPaths(text, basePath, isFile) {
    let count = 0;
    const out = text.replace(PATH_RE, (match, quote, p) => {
        if (p === "/" || /\.(html|txt)$/.test(p)) return match;
        if (p.startsWith(basePath + "/") || !isFile(p)) return match;
        count++;

        return quote + basePath + p;
    });

    return { text: out, count };
}

export function injectHead(html) {
    if (html.includes('name="robots"')) return html;

    return html.replace(/<head([^>]*)>/i, (tag) => tag + HEAD_TAGS);
}

// "Last updated" footers rendered new Date() at build time, so a rebuild
// would claim today; put the version's own date back. Same format as the
// footer; local time by default, like the build that rendered it.
export function formatDay(date, timeZone) {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone,
    });
}

export function redate(text, buildDays, snapshotDay) {
    return buildDays.reduce((s, day) => s.replaceAll(day, snapshotDay), text);
}

// The session key that stops a second visit log in the same tab session.
// A snapshot shares the origin with the live site, so it gets its own key
// and can't stop the live site from logging a visit.
export function renameVisitKey(js) {
    return js.replaceAll('"__visited"', '"__visited_snapshot"');
}

// Matches @import url("…") and the minified @import"…" alike. The URL can
// hold a ";" of its own (ital,wght@0,100..900;1,100..900).
const GOOGLE_IMPORT_RE =
    /@import\s*(?:url\(\s*)?["']?(https:\/\/fonts\.googleapis\.com\/[^"')\s]+)["']?\s*\)?\s*;?/g;
const CHROME_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/**
 * Early versions load Montserrat from Google Fonts. Copy the font files into
 * the snapshot and inline their @font-face rules, so a snapshot makes no
 * request to another site.
 */
export async function vendorGoogleFonts(dir, basePath) {
    const fontsDir = path.join(dir, "fonts");
    let files = 0;

    for (const file of walk(dir).filter((f) => f.endsWith(".css"))) {
        const css = fs.readFileSync(file, "utf8");
        const imports = [...css.matchAll(GOOGLE_IMPORT_RE)];

        if (!imports.length) continue;

        let out = css;

        for (const [statement, url] of imports) {
            const res = await fetch(url.replaceAll("&amp;", "&"), {
                headers: { "User-Agent": CHROME_UA },
            });

            if (!res.ok)
                throw new Error(`Google Fonts ${res.status} for ${url}`);

            let faces = await res.text();

            for (const [, fontUrl] of faces.matchAll(
                /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g,
            )) {
                const name = fontUrl.split("/").slice(-2).join("-");
                const font = await fetch(fontUrl);

                if (!font.ok)
                    throw new Error(`Font ${font.status} for ${fontUrl}`);

                fs.mkdirSync(fontsDir, { recursive: true });
                fs.writeFileSync(
                    path.join(fontsDir, name),
                    Buffer.from(await font.arrayBuffer()),
                );
                faces = faces.replaceAll(fontUrl, `${basePath}/fonts/${name}`);
                files++;
            }

            out = out.replace(statement, faces);
        }

        fs.writeFileSync(file, out);
    }

    return files;
}

// GitHub Pages serves only the site-root 404.html, so every client-side
// route gets its own copy of the app shell. <route>.html rather than
// <route>/index.html: Pages serves /x from x.html as it is, while a folder
// redirects /x to /x/, which the old router's exact-match tabs miss.
export function writeRouteShells(dir, routes) {
    const shell = path.join(dir, "index.html");

    for (const route of routes) {
        const target = path.join(
            dir,
            route.replace(/^\/+|\/+$/g, "") + ".html",
        );

        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(shell, target);
    }
}

/**
 * Deletes files under media/ that no page, script or stylesheet mentions.
 * A commit can still carry a file its pages had stopped using, like a logo
 * for a role that was taken off the site; it shouldn't be reachable by URL.
 */
export function pruneUnreferencedMedia(dir) {
    const mediaDir = path.join(dir, "media");

    if (!fs.existsSync(mediaDir)) return [];

    const text = walk(dir)
        .filter((f) => TEXT_EXT.has(path.extname(f)))
        .map((f) => fs.readFileSync(f, "utf8"))
        .join("\n");
    const pruned = [];

    for (const file of walk(mediaDir)) {
        const rel = path.relative(dir, file).split(path.sep).join("/");

        if (text.includes(rel) || text.includes(encodeURI(rel))) continue;
        fs.rmSync(file);
        pruned.push(rel);
    }

    return pruned;
}

const WEBHOOK_RE = /discord(app)?\.com\/api\/webhooks\/\d{6,}\/[\w-]{20,}/;

export function findWebhookLeaks(dir) {
    return walk(dir).filter((f) =>
        WEBHOOK_RE.test(fs.readFileSync(f, "latin1")),
    );
}

/**
 * Runs every step on a build output already copied to `dir`. Throws if a
 * Discord webhook URL made it into the build.
 */
export async function postprocess(
    dir,
    { basePath, routes = [], buildDays = [], snapshotDay },
) {
    for (const name of ROOT_ONLY)
        fs.rmSync(path.join(dir, name), { recursive: true, force: true });

    const isFile = (p) => {
        try {
            return fs.statSync(path.join(dir, decodeURIComponent(p))).isFile();
        } catch {
            return false;
        }
    };
    let rewrites = 0;

    for (const file of walk(dir)) {
        const ext = path.extname(file);

        if (!TEXT_EXT.has(ext)) continue;

        const before = fs.readFileSync(file, "utf8");
        const rewritten = rewriteRootPaths(before, basePath, isFile);
        let s = rewritten.text;

        rewrites += rewritten.count;

        if (ext === ".js" || ext === ".mjs") s = renameVisitKey(s);
        if (ext === ".html" || ext === ".txt")
            s = redate(s, buildDays, snapshotDay);
        if (ext === ".html") s = injectHead(s);
        if (s !== before) fs.writeFileSync(file, s);
    }

    const fonts = await vendorGoogleFonts(dir, basePath);
    const pruned = pruneUnreferencedMedia(dir);

    writeRouteShells(dir, routes);

    const leaks = findWebhookLeaks(dir);

    if (leaks.length)
        throw new Error(`Webhook URL found in ${leaks.join(", ")}`);

    return { rewrites, fonts, pruned, routes: routes.length };
}
