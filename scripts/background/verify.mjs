// Stream the static export into an isolated browser without opening a server.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium, webkit } from "playwright";

const engine = process.argv.includes("--webkit") ? webkit : chromium;
const browser = await engine.launch();
const folder = `/private/tmp/deep-space-review/${process.argv.includes("--webkit") ? "webkit" : "chromium"}`;
await fs.mkdir(folder, { recursive: true });
const types = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".ico": "image/x-icon",
    ".gif": "image/gif",
    ".txt": "text/plain",
};
const viewports = process.argv.includes("--mobile")
    ? [
          [320, 568, true],
          [360, 800, true],
          [390, 844, true],
          [430, 932, true],
          [844, 390, true],
      ]
    : [
          [1440, 1000, false],
          [2560, 1440, false],
          [1024, 768, false],
          [390, 844, true],
          [320, 568, true],
      ];
const errors = [];

async function appearance(page, mode) {
    await page.waitForFunction((mode) => {
        const root = document.documentElement;
        const canvas = document.querySelector("canvas[data-scene]");
        return (
            root.dataset.theme === mode &&
            canvas?.dataset.palette === mode &&
            !root.hasAttribute("data-theme-fading")
        );
    }, mode);
    assert.equal(
        await page.evaluate(
            () => getComputedStyle(document.body).backgroundColor,
        ),
        mode === "dark" ? "rgb(13, 13, 13)" : "rgb(247, 245, 240)",
    );
    assert.equal(await page.locator('canvas[data-scene="stars"]').count(), 1);
    assert.equal(
        await page
            .getByRole("button", { name: /^(Previous|Next) background$/ })
            .count(),
        0,
    );
    assert.equal(
        await page.getByRole("group", { name: "Background controls" }).count(),
        0,
    );
    assert.equal(
        await page
            .getByRole("link", { name: "LinkedIn", exact: true })
            .getAttribute("href"),
        "https://www.linkedin.com/in/haoyan160/",
    );
    assert(
        await page.evaluate(
            () =>
                document.documentElement.scrollWidth <=
                document.documentElement.clientWidth,
        ),
    );
}

try {
    for (const [width, height, mobile] of viewports) {
        for (const saved of ["dark", "light"]) {
            const context = await browser.newContext({
                viewport: { width, height },
                deviceScaleFactor: 2,
                isMobile: mobile,
                hasTouch: mobile,
                colorScheme: "light",
                reducedMotion: "no-preference",
            });
            await context.addInitScript((mode) => {
                if (localStorage.getItem("theme") === null)
                    localStorage.setItem("theme", mode);
                // Former experiment selections must not change the only backdrop.
                localStorage.setItem(
                    "haoyan.space-studies.v1",
                    JSON.stringify({ scene: "polar-jet" }),
                );
            }, saved);
            await context.route("**/*", async (route) => {
                const url = new URL(route.request().url());
                if (url.origin !== "http://site.local") return route.abort();
                if (
                    /^\/history\/[^/]+\/thumbnail-(dark|light)\.jpg$/.test(
                        url.pathname,
                    )
                ) {
                    return route.fulfill({
                        contentType: "image/png",
                        body: Buffer.from(
                            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
                            "base64",
                        ),
                    });
                }
                const file = path.join(
                    path.resolve("out"),
                    decodeURIComponent(url.pathname),
                    url.pathname.endsWith("/") ? "index.html" : "",
                );
                try {
                    await route.fulfill({
                        body: await fs.readFile(file),
                        contentType:
                            types[path.extname(file)] ||
                            "application/octet-stream",
                    });
                } catch {
                    errors.push(`Missing asset: ${url.pathname}`);
                    await route.fulfill({ status: 404 });
                }
            });
            const page = await context.newPage();
            page.on("pageerror", (error) => errors.push(error.message));
            page.on("console", (message) => {
                if (message.type() === "error") errors.push(message.text());
            });
            await page.goto("http://site.local/");
            await page.locator('canvas[data-ready="true"]').waitFor();
            await appearance(page, saved);
            const canvas = page.locator("canvas[data-scene]");
            assert.equal(
                await canvas.getAttribute("data-animated"),
                String(!mobile),
            );
            if (!mobile) {
                const phase = await canvas.getAttribute("data-phase");
                await page.waitForFunction(
                    (phase) =>
                        document.querySelector("canvas[data-scene]").dataset
                            .phase !== phase,
                    phase,
                );
            }
            // Freeze motion to prove theme changes recolor the same composition.
            await page.emulateMedia({ reducedMotion: "reduce" });
            await page.waitForFunction(
                () =>
                    document.querySelector("canvas[data-scene]").dataset
                        .animated === "false",
            );
            if (width === 1440 && saved === "dark") {
                const paused = await canvas.getAttribute("data-phase");
                await page.waitForTimeout(120);
                assert.equal(await canvas.getAttribute("data-phase"), paused);
                await page.emulateMedia({ reducedMotion: "no-preference" });
                await page.waitForFunction(
                    (phase) =>
                        document.querySelector("canvas[data-scene]").dataset
                            .phase !== phase,
                    paused,
                );
                await page.emulateMedia({ reducedMotion: "reduce" });
                await page.waitForFunction(
                    () =>
                        document.querySelector("canvas[data-scene]").dataset
                            .animated === "false",
                );
            }
            const stars = page.locator('[data-space-layer="stars"]');
            const before = await stars.evaluate((canvas) => canvas.toDataURL());
            const other = saved === "dark" ? "light" : "dark";
            const toggle = page.getByRole("button", {
                name: "Toggle theme",
                exact: true,
            });
            if (mobile) {
                const box = await toggle.boundingBox();
                assert(
                    box.width >= 44 && box.height >= 44,
                    "Theme toggle needs a 44px touch target",
                );
                const art = await canvas.boundingBox();
                const reading = await page
                    .locator("main > section")
                    .first()
                    .boundingBox();
                assert(
                    art.y + art.height <= reading.y - 16,
                    "Phone art must finish before reading content",
                );
            }
            await toggle.click();
            await appearance(page, other);
            assert.notEqual(
                await stars.evaluate((canvas) => canvas.toDataURL()),
                before,
                "The stars must also change palette",
            );
            assert.equal(
                await page.evaluate(() => localStorage.getItem("theme")),
                other,
            );
            await page.screenshot({
                path: `${folder}/${width}x${height}-${other}.png`,
            });
            await page.reload();
            await page.locator('canvas[data-ready="true"]').waitFor();
            await appearance(page, other);
            await toggle.focus();
            await page.keyboard.press("Enter");
            await appearance(page, saved);
            // Rapid clicks retain the original toggle's synchronization.
            await toggle.click();
            await toggle.click();
            await appearance(page, saved);
            const phase = await canvas.getAttribute("data-phase");
            await page.waitForTimeout(120);
            assert.equal(
                await canvas.getAttribute("data-phase"),
                phase,
                "Reduced motion must stay static",
            );
            await page.locator("footer").scrollIntoViewIfNeeded();
            const footer = await page.evaluate(() => {
                const quote = document.querySelector("footer figure");
                const range = document.createRange();
                range.selectNodeContents(quote);
                return {
                    position: getComputedStyle(quote).position,
                    bottom: range.getBoundingClientRect().bottom,
                    dockTop: document
                        .querySelector(".sidebar")
                        .getBoundingClientRect().top,
                };
            });
            assert.equal(footer.position, "static");
            if (mobile)
                assert(
                    footer.bottom < footer.dockTop - 8,
                    "Dock must not cover the quote",
                );
            await page.screenshot({
                path: `${folder}/${width}x${height}-${saved}-footer.png`,
            });
            if (width === 1440 && saved === "dark") {
                await page.goto("http://site.local/history/");
                await page.waitForFunction(
                    () => document.querySelector("body > canvas").width > 1,
                );
                assert.equal(
                    await page.locator("canvas[data-scene]").count(),
                    0,
                );
                await page
                    .getByRole("button", { name: "Toggle theme", exact: true })
                    .click();
                await page.waitForFunction(
                    () => document.documentElement.dataset.theme === "light",
                );
            }
            await context.close();
        }
    }
    assert.deepEqual(errors, []);
    console.log(
        `Verified one star-field background, no arrows, original theme toggle, both palettes, saved preferences, keyboard access, reduced motion, mobile layout and footer. Screenshots: ${folder}`,
    );
} finally {
    await browser.close();
}
