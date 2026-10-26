// Builds the site and every past version, puts them together in out/ the
// way the deploy does, and serves it the way GitHub Pages would.
//
//   npm run history:preview   (then open http://localhost:3300/history/)
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
    ROOT,
    assemble,
    buildAll,
    captureLive,
    snapshotEnv,
} from "./build.mjs";
import { createPagesServer } from "./serve.mjs";

const PORT = Number(process.env.PORT ?? 3300);
const cache = path.join(ROOT, ".history-cache");

const { versions } = await buildAll({ cache });

// No webhook here either, so browsing the preview logs no visits
const next = spawnSync("npx", ["next", "build"], {
    cwd: ROOT,
    env: snapshotEnv(),
    stdio: "inherit",
});

if (next.status !== 0) process.exit(next.status ?? 1);

const copied = assemble(cache, versions, path.join(ROOT, "out"));

console.log(`Copied ${copied.length} version(s) into out/history/`);
await captureLive(path.join(ROOT, "out"));

createPagesServer(path.join(ROOT, "out"), { log: true }).listen(
    { port: PORT, host: "::", ipv6Only: false },
    () => {
        console.log(
            `\nPreview: http://localhost:${PORT}/history/  (all interfaces; Ctrl-C to stop)`,
        );
    },
);
