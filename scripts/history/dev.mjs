// One local server for the whole site while working on it: next dev for
// the site itself, with every past version under /history/<key>/ served
// from the snapshot cache, the way the deploy will. Build the past
// versions first (npm run history:build).
//
//   npm run history:dev [-- --port 3100 --key key.pem --cert cert.pem]
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pagesHandler } from "./serve.mjs";

const ROOT = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
);
const cache = path.join(ROOT, ".history-cache");

const args = process.argv.slice(2);
const flag = (name, fallback) => {
    const i = args.indexOf(name);

    return i === -1 ? fallback : args[i + 1];
};
const port = Number(flag("--port", "3100"));
const key = flag("--key");
const cert = flag("--cert");
// next dev runs out of sight on the next port, behind this one
const nextPort = port + 1;

const next = spawn(
    "npx",
    ["next", "dev", "--port", String(nextPort), "--hostname", "127.0.0.1"],
    { cwd: ROOT, stdio: "inherit" },
);
next.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => next.kill(signal));
}

// A past version is a folder in the cache; /history/ itself is the page
const PAST = /^\/history\/([^/]+)(?:\/|$)/;
const isPast = (pathname) => {
    const match = PAST.exec(pathname);

    return match !== null && fs.existsSync(path.join(cache, match[1]));
};

const servePast = pagesHandler(cache, { prefix: "/history" });

const toNext = (req, res) => {
    const upstream = http.request(
        {
            host: "127.0.0.1",
            port: nextPort,
            method: req.method,
            path: req.url,
            headers: req.headers,
        },
        (reply) => {
            res.writeHead(reply.statusCode ?? 502, reply.headers);
            reply.pipe(res);
        },
    );
    upstream.on("error", () => {
        if (!res.headersSent) res.writeHead(502);
        res.end("next dev isn't up yet; try again in a moment");
    });
    req.pipe(upstream);
};

const handler = (req, res) => {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");

    if (isPast(decodeURIComponent(pathname))) return servePast(req, res);
    toNext(req, res);
};

const server =
    key && cert
        ? https.createServer(
              { key: fs.readFileSync(key), cert: fs.readFileSync(cert) },
              handler,
          )
        : http.createServer(handler);

// Hot reload's websocket goes straight through to next dev
server.on("upgrade", (req, socket, head) => {
    const upstream = net.connect(nextPort, "127.0.0.1", () => {
        const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
            lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
        }
        upstream.write(lines.join("\r\n") + "\r\n\r\n");
        if (head?.length) upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
    });
    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
});

// "::" without ipv6Only also takes IPv4, so one socket covers both
server.listen({ port, host: "::", ipv6Only: false }, () => {
    const scheme = key && cert ? "https" : "http";
    console.log(
        `\nSite and history on ${scheme}://localhost:${port}/ (past versions under /history/)`,
    );
});
