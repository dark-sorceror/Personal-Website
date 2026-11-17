// Profile the production export through interception; no server is started.
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "playwright";

const label = process.argv[2] || "current";
const destination = "/private/tmp/ascii-background-performance";
await fs.mkdir(destination, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
    for (const [scene, width, height] of [
        ["stars", 1440, 1000],
        ["stars", 2560, 1440],
    ]) {
        const context = await browser.newContext({
            viewport: { width, height },
            deviceScaleFactor: 2,
            reducedMotion: "no-preference",
        });
        await context.addInitScript(() => {
            const durations = [];
            let otherMs = 0;
            let longTasks = 0;
            new PerformanceObserver((entries) => {
                longTasks += entries.getEntries().length;
            }).observe({ type: "longtask", buffered: false });
            const request = window.requestAnimationFrame.bind(window);
            window.requestAnimationFrame = (callback) =>
                request((now) => {
                    const canvas = document.querySelector("canvas[data-scene]");
                    const before = canvas?.dataset.phase;
                    const start = performance.now();
                    callback(now);
                    const elapsed = performance.now() - start;
                    if (canvas && canvas.dataset.phase !== before)
                        durations.push(elapsed);
                    else otherMs += elapsed;
                });
            window.backgroundProfile = {
                reset() {
                    durations.length = 0;
                    otherMs = 0;
                    longTasks = 0;
                },
                read() {
                    return { durations: [...durations], otherMs, longTasks };
                },
            };
        });
        await context.route("**/*", async (route) => {
            const url = new URL(route.request().url());
            if (url.origin !== "http://site.local") return route.abort();
            let file = path.join(
                path.resolve("out"),
                decodeURIComponent(url.pathname),
            );
            if (url.pathname.endsWith("/"))
                file = path.join(file, "index.html");
            const type = {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".woff2": "font/woff2",
                ".webp": "image/webp",
                ".png": "image/png",
                ".svg": "image/svg+xml",
                ".json": "application/json",
            }[path.extname(file)];
            try {
                await route.fulfill({
                    body: await fs.readFile(file),
                    contentType: type || "application/octet-stream",
                });
            } catch {
                await route.fulfill({ status: 404 });
            }
        });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto("http://site.local/");
        await page.locator("canvas[data-ready='true']").waitFor();
        await page.waitForTimeout(1600);
        const client = await context.newCDPSession(page);
        await client.send("Performance.enable");
        await page.evaluate(() => window.backgroundProfile.reset());
        const before = await client.send("Performance.getMetrics");
        const start = Date.now();
        await page.waitForTimeout(5000);
        const seconds = (Date.now() - start) / 1000;
        const after = await client.send("Performance.getMetrics");
        const { durations, otherMs, longTasks } = await page.evaluate(() =>
            window.backgroundProfile.read(),
        );
        assert.deepEqual(
            errors,
            [],
            "Profile requires a page without runtime errors",
        );
        assert(durations.length > 0, "Expected animated ASCII frames");
        const metric = (metrics, name) =>
            metrics.metrics.find((metric) => metric.name === name).value;
        durations.sort((a, b) => a - b);
        const result = {
            scene,
            viewport: `${width}x${height}@2`,
            frames: durations.length,
            fps: +(durations.length / seconds).toFixed(1),
            meanFrameMs: +(
                durations.reduce((a, b) => a + b, 0) / durations.length
            ).toFixed(2),
            p95FrameMs:
                +durations[Math.floor(durations.length * 0.95)].toFixed(2),
            mainThreadMsPerSecond: +(
                ((metric(after, "TaskDuration") -
                    metric(before, "TaskDuration")) *
                    1000) /
                seconds
            ).toFixed(1),
            otherAnimationMsPerSecond: +(otherMs / seconds).toFixed(1),
            longTasks,
            errors,
        };
        results.push(result);
        console.log(JSON.stringify(result));
        await client.detach();
        await context.close();
    }
    await fs.writeFile(
        `${destination}/${label}.json`,
        JSON.stringify(results, null, 2) + "\n",
    );
} finally {
    await browser.close();
}
