// A static server that resolves paths the way GitHub Pages does: the exact
// file, then a folder (redirecting /x to /x/ first) and its index.html,
// then x.html, else the site's 404.html with a 404 status.
//
//   node scripts/history/serve.mjs [root=out] [--port 3300] [--host ::]
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json",
    ".txt": "text/plain; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".woff2": "font/woff2",
    ".mp4": "video/mp4",
};

const isFile = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
const isDir = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();

/**
 * A request handler for `root`. `prefix` serves it under a sub-path, e.g.
 * "/history" so a snapshot cache can be loaded at the URLs it was built for.
 */
export function pagesHandler(root, { prefix = "", log = false } = {}) {
    const base = path.resolve(root);

    return (req, res) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        let rel = decodeURIComponent(url.pathname);

        const send = (file, status = 200) => {
            res.writeHead(status, {
                "Content-Type":
                    TYPES[path.extname(file)] ?? "application/octet-stream",
            });
            fs.createReadStream(file).pipe(res);
            if (log) console.log(status, req.url);
        };
        const notFound = () => {
            const page = path.join(base, "404.html");

            if (isFile(page)) return send(page, 404);
            res.writeHead(404).end("Not found");
            if (log) console.log(404, req.url);
        };

        if (prefix) {
            if (!rel.startsWith(prefix + "/")) return notFound();
            rel = rel.slice(prefix.length);
        }

        const p = path.join(base, rel);

        if (!p.startsWith(base)) return notFound();
        if (isFile(p)) return send(p);
        if (isDir(p) && !rel.endsWith("/")) {
            res.writeHead(301, {
                Location: url.pathname + "/" + url.search,
            }).end();
            if (log) console.log(301, req.url);
            return;
        }
        if (isFile(path.join(p, "index.html")))
            return send(path.join(p, "index.html"));
        if (isFile(p.replace(/\/$/, "") + ".html"))
            return send(p.replace(/\/$/, "") + ".html");
        notFound();
    };
}

export function createPagesServer(root, options) {
    return http.createServer(pagesHandler(root, options));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const flag = (name, fallback) => {
        const i = args.indexOf(name);

        return i === -1 ? fallback : args.splice(i, 2)[1];
    };
    const port = Number(flag("--port", "3300"));
    const host = flag("--host", "::");
    const root = args[0] ?? "out";

    // "::" without ipv6Only also takes IPv4, so one socket covers both
    createPagesServer(root, { log: true }).listen(
        { port, host, ipv6Only: false },
        () => console.log(`Serving ${root} on http://localhost:${port}/`),
    );
}
