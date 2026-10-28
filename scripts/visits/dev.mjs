// The visit counter Worker (worker/) with its local D1, over HTTPS on every
// interface, for the site's dev server to log visits to. Pass the same
// certs as history:dev, so a browser that accepts one accepts both; without
// them wrangler makes its own. With no webhook in worker/.dev.vars it's a
// dry run, logging the embeds it would have posted.
//
//   npm run visits:dev [-- --port 8788 --key key.pem --cert cert.pem]
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const WORKER = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../worker",
);

const args = process.argv.slice(2);
const flag = (name) => {
    const i = args.indexOf(name);

    return i === -1 ? undefined : args[i + 1];
};
const port = flag("--port");
const key = flag("--key");
const cert = flag("--cert");

// Nothing to do once the local database is up to date
const migrate = spawnSync("npm", ["--prefix", WORKER, "run", "migrate:local"], {
    stdio: "inherit",
});
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

// wrangler runs in worker/, so the cert paths are made absolute first
const dev = spawn(
    "npm",
    [
        "--prefix",
        WORKER,
        "run",
        "dev",
        "--",
        ...(port ? ["--port", port] : []),
        ...(key ? ["--https-key-path", path.resolve(key)] : []),
        ...(cert ? ["--https-cert-path", path.resolve(cert)] : []),
    ],
    { stdio: "inherit" },
);
dev.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => dev.kill(signal));
}
