// Builds the past versions listed in history.json into a local cache, once
// each, and copies them into the site's out/history/.
//
//   node scripts/history/build.mjs [--cache .history-cache] [--out out]
//                                  [--no-build] [--strict]
//
// A version is rebuilt only when its cache folder is missing or was built
// from another commit. A version that fails to build is logged and skipped,
// so one broken old commit can't stop a deploy (--strict makes it fatal).
// Run it before the site's build, which hashes the cached screenshots into
// /history/'s image URLs, then with --out --no-build after it.
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
const PIPELINE = 2;

const KEY_RE = /^[a-z0-9][a-z0-9-]*$/i;
const SHA_RE = /^[0-9a-f]{7,40}$/;

export function readVersions(file = path.join(ROOT, "history.json")) {
    const versions = JSON.parse(fs.readFileSync(file, "utf8"));
    const keys = new Set();

    for (const v of versions) {
        // "live" is where the live site's own thumbnails go
        if (
            !KEY_RE.test(v.key) ||
            v.key === "live" ||
            !SHA_RE.test(v.sha) ||
            !v.label
        ) {
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
    // Type errors don't change the output, and a draft that never shipped
    // may not have passed the type check
    const patched = code.replace(
        /export default (\w+);?/,
        "export default { ...$1, basePath: process.env.HISTORY_BASE_PATH, typescript: { ...$1.typescript, ignoreBuildErrors: true } };",
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
            // Straight to Vite, past the script's "tsc -b": type errors don't
            // change the output, and the 2026-01-23 draft never type-checked
            run("npx", ["vite", "build", `--base=${basePath}/`], {
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

export const THEMES = ["dark", "light"];

const hasThumbnails = (dir) =>
    THEMES.every((t) => fs.existsSync(path.join(dir, `thumbnail-${t}.jpg`)));

async function launchBrowser() {
    let chromium;

    try {
        ({ chromium } = await import("playwright"));
    } catch {
        return null;
    }

    // Playwright's own Chromium, else the Chrome a CI runner already has
    for (const options of [{}, { channel: "chrome" }]) {
        try {
            return await chromium.launch(options);
        } catch {
            // try the next one
        }
    }

    return null;
}

/**
 * Screenshots `url` once per theme into `<dir>/thumbnail-<theme>.jpg`.
 * Each version kept its theme its own way: "theme" in the Next.js site,
 * "darkMode" in the first draft, the system setting in the rest, so all
 * three are set. Requests to other sites are refused: the live site's
 * visitor log must not fire, and old builds have nothing to fetch.
 */
async function screenshotThemes(browser, url, dir) {
    const origin = new URL(url).origin;

    for (const theme of THEMES) {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            colorScheme: theme,
        });

        await context.route("**/*", (route) =>
            route.request().url().startsWith(origin)
                ? route.continue()
                : route.abort(),
        );
        await context.addInitScript((t) => {
            try {
                localStorage.setItem("theme", t);
                localStorage.setItem("darkMode", String(t === "dark"));
            } catch {
                // storage blocked; the default look is fine
            }
        }, theme);

        try {
            const page = await context.newPage();

            await page.goto(url, { waitUntil: "networkidle" });
            // Let fade-ins and the dot grid settle
            await page.waitForTimeout(2500);
            await page.screenshot({
                path: path.join(dir, `thumbnail-${theme}.jpg`),
                type: "jpeg",
                quality: 80,
            });
        } finally {
            await context.close();
        }
    }
}

async function withServer(root, options, run) {
    const server = createPagesServer(root, options);

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    try {
        return await run(`http://127.0.0.1:${server.address().port}`);
    } finally {
        server.close();
    }
}

/** Screenshots each built version that has no thumbnails yet. */
export async function captureThumbnails(cache, versions) {
    const todo = versions.filter(
        (v) => isBuilt(cache, v) && !hasThumbnails(path.join(cache, v.key)),
    );

    if (!todo.length) return 0;

    const browser = await launchBrowser();

    if (!browser) {
        warn("No browser for Playwright; skipping thumbnails");
        return 0;
    }

    let count = 0;

    try {
        await withServer(cache, { prefix: "/history" }, async (base) => {
            for (const v of todo) {
                const dir = path.join(cache, v.key);

                try {
                    await screenshotThemes(
                        browser,
                        `${base}/history/${v.key}/`,
                        dir,
                    );
                    // From before there was one per theme
                    fs.rmSync(path.join(dir, "thumbnail.jpg"), { force: true });
                    count++;
                } catch (err) {
                    warn(`Thumbnail for ${v.key} failed: ${err.message}`);
                }
            }
        });
    } finally {
        await browser.close();
    }

    return count;
}

/**
 * Screenshots the freshly built live site in `out` into
 * `<out>/history/live/`. It changes with every deploy, so it isn't cached.
 * /history/ falls back to the link preview card if this is skipped.
 */
export async function captureLive(out) {
    const browser = await launchBrowser();

    if (!browser) {
        warn("No browser for Playwright; skipping the live thumbnails");
        return false;
    }

    const dir = path.join(out, "history", "live");

    fs.mkdirSync(dir, { recursive: true });

    try {
        await withServer(out, {}, (base) =>
            screenshotThemes(browser, `${base}/`, dir),
        );
        return true;
    } catch (err) {
        warn(`Live thumbnails failed: ${err.message}`);
        return false;
    } finally {
        await browser.close();
    }
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

    // --no-build only copies what's cached, for after the site's own build
    const { versions } = args.includes("--no-build")
        ? { versions: readVersions() }
        : await buildAll({ cache, strict: args.includes("--strict") });

    if (out) {
        const copied = assemble(cache, versions, path.resolve(ROOT, out));

        console.log(
            `Copied ${copied.length} version(s) into ${out}/history/: ${copied.join(", ")}`,
        );
        if (await captureLive(path.resolve(ROOT, out))) {
            console.log("Captured the live site's thumbnails");
        }
    }
}
