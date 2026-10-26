// Builds the past versions listed in history.json into a local cache, once
// each, and copies them into the site's out/history/.
//
//   node scripts/history/build.mjs [--cache .history-cache] [--out out] [--strict]
//
// A version is rebuilt only when its cache folder is missing or was built
// from another commit. A version that fails to build is logged and skipped,
// so one broken old commit can't stop a deploy (--strict makes it fatal).
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createPagesServer } from "./serve.mjs";
import { formatDay, postprocess } from "./snapshot.mjs";

export const ROOT = fileURLToPath(new URL("../..", import.meta.url));

// Bump when the build or post-processing changes, so cached snapshots made
// the old way get rebuilt
const PIPELINE = 1;

const KEY_RE = /^[a-z0-9][a-z0-9-]*$/i;
const SHA_RE = /^[0-9a-f]{7,40}$/;

export function readVersions(file = path.join(ROOT, "history.json")) {
    const versions = JSON.parse(fs.readFileSync(file, "utf8"));
    const keys = new Set();

    for (const v of versions) {
        if (!KEY_RE.test(v.key) || !SHA_RE.test(v.sha) || !v.label) {
            throw new Error(`history.json: bad entry ${JSON.stringify(v)}`);
        }
        if (keys.has(v.key))
            throw new Error(`history.json: duplicate key ${v.key}`);
        keys.add(v.key);
    }

    return versions;
}

// Old builds must never see the visitor-log webhook, or any other public
// build-time variable from the calling shell
export function snapshotEnv(extra = {}) {
    const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...extra };

    for (const name of Object.keys(env)) {
        if (/WEBHOOK/i.test(name) || /^(NEXT_PUBLIC_|VITE_)/.test(name))
            delete env[name];
    }

    return env;
}

function run(cmd, args, { cwd, env, log }) {
    const res = spawnSync(cmd, args, {
        cwd,
        env,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
    const output = `$ ${cmd} ${args.join(" ")}\n${res.stdout ?? ""}${res.stderr ?? ""}\n`;

    if (log) fs.appendFileSync(log, output);
    if (res.status !== 0) {
        const tail = output.trim().split("\n").slice(-25).join("\n");

        throw new Error(`${cmd} ${args[0]} failed\n${tail}`);
    }

    return res.stdout;
}

function readMarker(dir) {
    try {
        return JSON.parse(
            fs.readFileSync(path.join(dir, "snapshot.json"), "utf8"),
        );
    } catch {
        return null;
    }
}

export function isBuilt(cache, v) {
    const dir = path.join(cache, v.key);
    const marker = readMarker(dir);
    // history.json may hold a short or a full SHA
    const sameCommit =
        marker &&
        (v.sha.startsWith(marker.sha) || marker.sha.startsWith(v.sha));

    return Boolean(
        sameCommit &&
        marker.pipeline === PIPELINE &&
        fs.existsSync(path.join(dir, "index.html")),
    );
}

function sourceFiles(dir) {
    return fs
        .readdirSync(dir, { recursive: true })
        .map((f) => path.join(dir, String(f)))
        .filter((f) => /\.[jt]sx?$/.test(f) && fs.statSync(f).isFile());
}

// React Router reads location.pathname, so it has to be told the sub-path
function patchViteRouter(src) {
    for (const file of sourceFiles(path.join(src, "src"))) {
        const code = fs.readFileSync(file, "utf8");

        if (!code.includes("BrowserRouter")) continue;

        const basename =
            'basename={import.meta.env.BASE_URL.replace(/\\/$/, "")}';
        const patched = code.replace(
            /<(Router|BrowserRouter)>/g,
            `<$1 ${basename}>`,
        );

        if (patched === code)
            throw new Error(`Unrecognised router setup in ${file}`);
        fs.writeFileSync(file, patched);
    }
}

function viteRoutes(src) {
    const routes = new Set();

    for (const file of sourceFiles(path.join(src, "src"))) {
        for (const [, route] of fs
            .readFileSync(file, "utf8")
            .matchAll(/<Route\s+path="(\/[a-z0-9-]+)"/gi)) {
            routes.add(route);
        }
    }

    return [...routes];
}

function patchNextConfig(src) {
    const file = ["next.config.ts", "next.config.mjs", "next.config.js"]
        .map((f) => path.join(src, f))
        .find(fs.existsSync);
    const code = fs.readFileSync(file, "utf8");
    const patched = code.replace(
        /export default (\w+);?/,
        "export default { ...$1, basePath: process.env.HISTORY_BASE_PATH };",
    );

    if (patched === code)
        throw new Error(`Unrecognised ${path.basename(file)}`);
    fs.writeFileSync(file, patched);
}

/** Builds one version into `<cache>/<key>/`, replacing what was there. */
export async function buildVersion(cache, v) {
    const basePath = `/history/${v.key}`;
    const work = fs.mkdtempSync(path.join(os.tmpdir(), `history-${v.key}-`));
    const log = path.join(work, "build.log");
    const src = path.join(work, "src");
    const env = snapshotEnv({ HISTORY_BASE_PATH: basePath });

    try {
        fs.mkdirSync(src);
        run(
            "git",
            [
                "archive",
                "--format=tar",
                "-o",
                path.join(work, "src.tar"),
                v.sha,
            ],
            { cwd: ROOT, log },
        );
        run("tar", ["-xf", path.join(work, "src.tar"), "-C", src], {
            cwd: work,
            log,
        });

        const authored = run("git", ["log", "-1", "--format=%aI", v.sha], {
            cwd: ROOT,
        }).trim();
        const hasLock = fs.existsSync(path.join(src, "package-lock.json"));

        run(
            "npm",
            [
                hasLock ? "ci" : "install",
                "--no-audit",
                "--no-fund",
                "--loglevel=error",
            ],
            { cwd: src, env, log },
        );

        const buildDays = [formatDay(new Date())];
        let era;
        let output;
        let routes = [];

        if (fs.readdirSync(src).some((f) => /^vite\.config\./.test(f))) {
            era = "vite";
            patchViteRouter(src);
            routes = viteRoutes(src);
            run("npm", ["run", "build", "--", `--base=${basePath}/`], {
                cwd: src,
                env,
                log,
            });
            output = path.join(src, "dist");
        } else if (fs.readdirSync(src).some((f) => /^next\.config\./.test(f))) {
            era = "next";
            patchNextConfig(src);
            run("npm", ["run", "build"], { cwd: src, env, log });
            output = path.join(src, "out");
        } else {
            throw new Error("Neither a Vite nor a Next.js project");
        }

        buildDays.push(formatDay(new Date()));

        const partial = path.join(cache, `.${v.key}.partial`);
        const target = path.join(cache, v.key);

        fs.rmSync(partial, { recursive: true, force: true });
        fs.cpSync(output, partial, { recursive: true });

        const stats = await postprocess(partial, {
            basePath,
            routes,
            buildDays: [...new Set(buildDays)],
            // The author's own calendar day, as the footer showed it then
            snapshotDay: formatDay(
                new Date(authored.slice(0, 10) + "T00:00:00Z"),
                "UTC",
            ),
        });

        fs.writeFileSync(
            path.join(partial, "snapshot.json"),
            JSON.stringify(
                {
                    key: v.key,
                    sha: v.sha,
                    era,
                    authored,
                    pipeline: PIPELINE,
                    built: new Date().toISOString(),
                },
                null,
                4,
            ) + "\n",
        );
        fs.rmSync(target, { recursive: true, force: true });
        fs.renameSync(partial, target);

        return { era, ...stats };
    } finally {
        fs.rmSync(work, { recursive: true, force: true });
    }
}

/** Screenshots each built version that has no thumbnail yet. */
export async function captureThumbnails(cache, versions) {
    const todo = versions.filter(
        (v) =>
            isBuilt(cache, v) &&
            !fs.existsSync(path.join(cache, v.key, "thumbnail.jpg")),
    );

    if (!todo.length) return 0;

    let chromium;

    try {
        ({ chromium } = await import("playwright"));
    } catch {
        console.warn("Playwright isn't installed; skipping thumbnails");
        return 0;
    }

    const server = createPagesServer(cache, { prefix: "/history" });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    const { port } = server.address();
    const browser = await chromium.launch();
    let count = 0;

    try {
        for (const v of todo) {
            const page = await browser.newPage({
                viewport: { width: 1280, height: 800 },
            });

            try {
                await page.goto(`http://127.0.0.1:${port}/history/${v.key}/`, {
                    waitUntil: "networkidle",
                });
                // Let fade-ins and the dot grid settle
                await page.waitForTimeout(2500);
                await page.screenshot({
                    path: path.join(cache, v.key, "thumbnail.jpg"),
                    type: "jpeg",
                    quality: 80,
                });
                count++;
            } catch (err) {
                console.warn(`Thumbnail for ${v.key} failed: ${err.message}`);
            } finally {
                await page.close();
            }
        }
    } finally {
        await browser.close();
        server.close();
    }

    return count;
}

/** Copies the listed, built versions into `<out>/history/`. */
export function assemble(cache, versions, out) {
    const dest = path.join(out, "history");
    const copied = [];

    for (const v of versions) {
        if (!isBuilt(cache, v)) continue;

        fs.rmSync(path.join(dest, v.key), { recursive: true, force: true });
        fs.cpSync(path.join(cache, v.key), path.join(dest, v.key), {
            recursive: true,
        });
        copied.push(v.key);
    }

    return copied;
}

function warn(message) {
    // Shows up as an annotation on the workflow run
    console.warn(
        process.env.GITHUB_ACTIONS
            ? `::warning::${message.replaceAll("\n", "%0A")}`
            : message,
    );
}

export async function buildAll({ cache, strict = false }) {
    const versions = readVersions();
    const failed = [];

    fs.mkdirSync(cache, { recursive: true });

    for (const v of versions) {
        if (isBuilt(cache, v)) {
            console.log(`${v.key}: cached`);
            continue;
        }

        const started = Date.now();

        try {
            const stats = await buildVersion(cache, v);

            console.log(
                `${v.key}: built (${stats.era}) in ${Math.round((Date.now() - started) / 1000)}s`,
                stats,
            );
        } catch (err) {
            failed.push(v.key);
            warn(
                `${v.key} (${v.sha.slice(0, 7)}) did not build and was skipped: ${err.message}`,
            );
        }
    }

    const thumbs = await captureThumbnails(cache, versions);

    if (thumbs) console.log(`Captured ${thumbs} thumbnail(s)`);
    if (failed.length && strict)
        throw new Error(`Failed: ${failed.join(", ")}`);

    return { versions, failed };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const args = process.argv.slice(2);
    const flag = (name, fallback) => {
        const i = args.indexOf(name);

        return i === -1 ? fallback : args[i + 1];
    };
    const cache = path.resolve(ROOT, flag("--cache", ".history-cache"));
    const out = flag("--out", null);

    const { versions } = await buildAll({
        cache,
        strict: args.includes("--strict"),
    });

    if (out) {
        const copied = assemble(cache, versions, path.resolve(ROOT, out));

        console.log(
            `Copied ${copied.length} version(s) into ${out}/history/: ${copied.join(", ")}`,
        );
    }
}
