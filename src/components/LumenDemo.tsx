"use client";

import { LumenFrame } from "@/components/LumenFrame";
import { useReplayClock, type Timing } from "@/components/useReplayClock";
import styles from "./LumenDemo.module.css";

// A preview of Lumen's Drew on line, which is still being built. The card
// opens up the model's context like Lumen's "What takes the room" map:
// everything Claude Code held for one reply, as tiles roughly sized by
// tokens and grouped by where they came from. Then the few the reply drew
// on light up, each for evidence Lumen saw itself: a file the agent
// opened, a command it ran, a passage it quoted word for word. The rest
// recede under a hatch, the key for what it didn't draw on.
type Tile = {
    name: string;
    // Who put it there, which picks its tint
    from: "instr" | "tools" | "added" | "you" | "work";
    tokens: number;
    // How many of the context's items it stands for
    items: number;
    // When it lands, in ms
    at: number;
    // For the tiles the reply drew on, its place in the Drew on line
    drew?: number;
};

// The map is laid out by hand rather than squarified, so every label fits:
// three columns, each as wide as its tokens, and in each a tile over a row
// of smaller ones. The rows are never shorter than their labels need and
// share what's left: evenly on a desktop's wide card, 2:3 on a phone's,
// where the row that lights up gets the room. Heights aren't to scale.
type Column = { top: Tile; below: Tile[] };

// The timeline, in ms. What it already held lands tile by tile, by where
// it came from; then your message types in, the agent opens a file and
// runs the tests, and the reply streams. Then what it drew on lights up in
// the Drew on line's order; the rest recede as the line above the map
// closes on the tally.
const FILL_AT = 200;
const EVERY_MS = 280;
const GROW_MS = 300;
const MESSAGE_AT = 2_500;
const TYPE_MS = 900;
const OPEN_AT = 3_700;
const RUN_AT = 4_150;
const REPLY_AT = 4_600;
const STREAM_MS = 1_300;
const LIGHTS = [6_300, 6_900, 7_500];
const LIGHT_MS = 350;
const CLOSE_AT = 8_100;
const CLOSE_MS = 500;
const TIMING: Timing = {
    fadeAt: 12_900,
    loop: 13_500,
    // From the tally on to the fade nothing moves
    still: CLOSE_AT + CLOSE_MS,
};

const landing = (i: number) => FILL_AT + i * EVERY_MS;

// 41 items, 22,310 tokens, in eight tiles. The tiles the reply drew on sit
// in the bottom row. Your message gets a tile of its own, so the one that
// lights is that message; at about 30 tokens it's drawn as big as its
// label needs, not to scale.
const COLUMNS: Column[] = [
    {
        top: {
            name: "How to work",
            from: "instr",
            tokens: 7_000,
            items: 1,
            at: landing(0),
        },
        below: [
            {
                name: "4 earlier messages",
                from: "you",
                tokens: 1_470,
                items: 4,
                at: landing(3),
            },
            {
                name: "Your message",
                from: "you",
                tokens: 30,
                items: 1,
                at: MESSAGE_AT,
                drew: 2,
            },
        ],
    },
    {
        top: {
            name: "Bash, Read and 14 more",
            from: "tools",
            tokens: 5_000,
            items: 16,
            at: landing(1),
        },
        below: [
            {
                name: "CLAUDE.md",
                from: "added",
                tokens: 1_200,
                items: 1,
                at: landing(2),
            },
        ],
    },
    {
        top: {
            name: "Its replies and 12 results",
            from: "work",
            tokens: 5_610,
            items: 16,
            at: landing(4),
        },
        below: [
            {
                name: "retry.ts",
                from: "work",
                tokens: 1_200,
                items: 1,
                at: OPEN_AT,
                drew: 0,
            },
            {
                name: "pnpm test",
                from: "work",
                tokens: 800,
                items: 1,
                at: RUN_AT,
                drew: 1,
            },
        ],
    },
];

const tilesOf = (column: Column) => [column.top, ...column.below];
const TILES = COLUMNS.flatMap(tilesOf);
// The columns' widths, by tokens
const WIDTHS = COLUMNS.map(
    (column) =>
        `${tilesOf(column).reduce((sum, tile) => sum + tile.tokens, 0)}fr`,
).join(" ");

const MESSAGE =
    "why does the retry test time out? backoff should be in seconds";
const REPLY =
    "As you said, backoff should be in seconds. backoff() returns milliseconds, so each retry waits 1000× too long.";
// Said in both, word for word
const QUOTE = "backoff should be in seconds";
// The Drew on line, each item led by the tag its tile gets
const DREW = [
    ["Opened", "retry.ts"],
    ["Ran", "pnpm test"],
    ["Quotes", "your message"],
];

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const ease = (t: number) => 1 - (1 - t) ** 3;
const size = (tokens: number) =>
    tokens < 500 ? `≈${tokens}` : `≈${(tokens / 1000).toFixed(1)}k`;

export function LumenDemo({
    onOpenGallery,
    held = false,
}: {
    onOpenGallery: () => void;
    // Something is covering the page, like the diagrams' lightbox
    held?: boolean;
}) {
    const clock = useReplayClock(TIMING, held);
    const { t, fade } = clock;

    // How far each tile has landed, and how lit each drawn-on one is
    const grown = (tile: Tile) => ease(clamp((t - tile.at) / GROW_MS));
    const lit = (drew?: number) =>
        drew === undefined ? 0 : ease(clamp((t - LIGHTS[drew]) / LIGHT_MS));
    const closed = ease(clamp((t - CLOSE_AT) / CLOSE_MS));

    // The tally counts up as the tiles land
    const count = (of: (tile: Tile) => number) =>
        Math.round(
            TILES.reduce((sum, tile) => sum + of(tile) * grown(tile), 0),
        );
    const items = count((tile) => tile.items);
    const tokens = count((tile) => tile.tokens);

    // A tile wipes in from the left as it lands. If the reply drew on it,
    // it then goes to its full colour with an outline, and its size gives
    // way to its tag, the one label fading out before the other fades in.
    // Both share one cell, so lighting moves nothing. If not, it recedes
    // under the hatch as the tally closes.
    const draw = (tile: Tile) => {
        const l = lit(tile.drew);
        const rest = tile.drew === undefined ? closed : 0;
        return (
            <span
                key={tile.name}
                className={`${styles.tile} ${styles[tile.from]}`}
                style={{
                    flexGrow: tile.tokens,
                    clipPath: `inset(0 ${(1 - grown(tile)) * 100}% 0 0)`,
                    opacity: 1 - 0.5 * rest,
                    ["--lit" as string]: l,
                    ["--rest" as string]: rest,
                }}
            >
                <span
                    className={styles.label}
                    style={{ opacity: clamp(1 - 2 * l) }}
                >
                    <span>{tile.name}</span>
                    <span className={styles.size}>{size(tile.tokens)}</span>
                </span>
                {tile.drew !== undefined && (
                    <span
                        className={`${styles.label} ${styles.litLabel}`}
                        style={{ opacity: clamp(2 * l - 1) }}
                    >
                        <span>{tile.name}</span>
                        <span className={styles.tag}>{DREW[tile.drew][0]}</span>
                    </span>
                )}
            </span>
        );
    };

    // Text typed out to n characters. The rest is laid out but hidden, so
    // each line wraps to its full height from the first frame and the map
    // above never moves; the quoted passage is marked once the Quotes light
    // comes on.
    const typed = (text: string, n: number) => {
        const i = text.indexOf(QUOTE);
        const cuts = [0, i, i + QUOTE.length, text.length];
        const quoted = lit(2) > 0.5;
        return cuts.slice(1).map((end, k) => {
            const shown = Math.max(cuts[k], Math.min(end, n));
            return (
                <span
                    key={k}
                    className={k === 1 && quoted ? styles.quote : undefined}
                >
                    {text.slice(cuts[k], shown)}
                    <span className={styles.untyped}>
                        {text.slice(shown, end)}
                    </span>
                </span>
            );
        });
    };
    const typedMessage = Math.ceil(
        clamp((t - MESSAGE_AT) / TYPE_MS) * MESSAGE.length,
    );
    const streamed = Math.ceil(
        clamp((t - REPLY_AT) / STREAM_MS) * REPLY.length,
    );

    return (
        <LumenFrame
            clock={clock}
            caption="Preview · Drew on"
            onOpenGallery={onOpenGallery}
            className={styles.card}
        >
            <p className="sr-only">
                A preview of Lumen&apos;s Drew on line, still being built. For
                one reply, Claude Code had 41 items in its context, 22,310
                tokens in all, drawn as a map of tiles as wide as their tokens:
                its instructions on how to work, its tools, CLAUDE.md, your 4
                earlier messages and this one, and its own work, the files it
                read, the commands it ran and its replies. You asked: why does
                the retry test time out? backoff should be in seconds. It opened
                src/retry.ts and ran pnpm test, then replied: As you said,
                backoff should be in seconds. backoff() returns milliseconds, so
                each retry waits 1000× too long. Under the reply, Lumen shows
                what it drew on: Opened retry.ts, Ran pnpm test, Quotes your
                message. It drew on 3 items and didn&apos;t draw on the other
                38, which the map hatches.
            </p>

            <div
                className={styles.body}
                style={{ opacity: fade }}
                aria-hidden="true"
            >
                <p
                    className={styles.takeaway}
                    style={{ ["--closed" as string]: closed }}
                >
                    Had <b>{items}</b> items
                    <span className={styles.swap}>
                        <span className={styles.tokens}>
                            {"\u00a0· "}
                            <b>{tokens.toLocaleString("en-US")}</b> tokens
                        </span>
                        <span style={{ opacity: closed }}>
                            {"\u00a0· "}
                            <span className={styles.drewKey} />
                            drew on <b>3</b> ·{" "}
                            <span className={styles.restKey} />
                            didn&apos;t draw on <b>38</b>
                        </span>
                    </span>
                </p>

                <div
                    className={styles.map}
                    style={{ gridTemplateColumns: WIDTHS }}
                >
                    {COLUMNS.map((column) => draw(column.top))}
                    {COLUMNS.map((column, i) => (
                        <span key={i} className={styles.row}>
                            {column.below.map(draw)}
                        </span>
                    ))}
                </div>

                <div className={styles.talk}>
                    <p className={styles.message}>
                        <span className={t < MESSAGE_AT ? styles.untyped : ""}>
                            ›{" "}
                        </span>
                        {typed(MESSAGE, typedMessage)}
                    </p>
                    <p className={styles.reply}>{typed(REPLY, streamed)}</p>
                    <p className={styles.drew}>
                        <span style={{ opacity: lit(0) }}>Drew on </span>
                        {DREW.map(([tag, what], i) => (
                            <span key={tag} style={{ opacity: lit(i) }}>
                                {i > 0 && " · "}
                                <b>
                                    {tag} {what}
                                </b>
                            </span>
                        ))}
                    </p>
                </div>
            </div>
        </LumenFrame>
    );
}
