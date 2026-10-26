// Suggests versions for history.json: the last commit before a quiet gap,
// on the idea that a pause means the site was in a state worth keeping.
//
//   node scripts/history/suggest.mjs [--gap 14]
//
// Prints every candidate, marks those already listed, and the entries to
// paste for the rest. It never edits history.json; what gets published is
// always a choice made there.
import { execFileSync } from "node:child_process";

import { ROOT, readVersions } from "./build.mjs";

const args = process.argv.slice(2);
const gapIndex = args.indexOf("--gap");
const gapDays = gapIndex === -1 ? 14 : Number(args[gapIndex + 1]);
const DAY = 24 * 60 * 60 * 1000;

const commits = execFileSync(
    "git",
    ["log", "--reverse", "--first-parent", "--format=%H%x09%aI%x09%s", "HEAD"],
    {
        cwd: ROOT,
        encoding: "utf8",
    },
)
    .trim()
    .split("\n")
    .map((line) => {
        const [sha, authored, subject] = line.split("\t");

        return { sha, authored, subject, time: Date.parse(authored) };
    });

const listed = new Map(readVersions().map((v) => [v.sha, v.key]));
const isListed = (sha) => [...listed.keys()].some((s) => sha.startsWith(s));

const candidates = commits
    .map((c, i) => ({
        ...c,
        gap:
            i + 1 < commits.length
                ? (commits[i + 1].time - c.time) / DAY
                : null,
    }))
    .filter((c) => c.gap === null || c.gap >= gapDays);

console.log(`Last commit before a gap of ${gapDays}+ days, oldest first:\n`);

for (const c of candidates) {
    const gap = c.gap === null ? "  live" : `${c.gap.toFixed(0).padStart(4)}d`;
    const mark =
        c.gap === null ? "(the site itself)" : isListed(c.sha) ? "listed" : "";

    console.log(
        `${c.authored.slice(0, 10)}  ${c.sha.slice(0, 7)}  gap ${gap}  ${mark.padEnd(8)}  ${c.subject}`,
    );
}

const missing = candidates.filter((c) => c.gap !== null && !isListed(c.sha));

if (missing.length) {
    console.log("\nNot in history.json yet:\n");
    for (const c of missing) {
        console.log(
            JSON.stringify({
                key: c.authored.slice(0, 10),
                sha: c.sha,
                label: c.subject,
            }) + ",",
        );
    }
}
