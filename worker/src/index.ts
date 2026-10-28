import { buildEmbed, type Embed, type Visit } from "./embed";
import { hashIp } from "./hash";
import {
    cleanSteps,
    cleanVia,
    cleanVisitor,
    referrerHost,
    sessionColumns,
    text,
} from "./input";
import { isBot, parseUA } from "./ua";

interface Env {
    DB: D1Database;
    ENVIRONMENT: string;
    // The site, the one origin the deploy takes visits from
    ALLOWED_ORIGIN?: string;
    DISCORD_WEBHOOK_URL?: string;
    SALT?: string;
}

// Posted as the site, the way the browser used to post it
const SENDER = {
    username: "haoyan.ca",
    avatar_url: "https://avatars.githubusercontent.com/u/dark-sorceror",
};

const SESSION = /^\/visit\/(\d+)\/session$/;

export default {
    async fetch(request, env, ctx) {
        const { pathname } = new URL(request.url);
        const session = SESSION.exec(pathname);

        if (request.method !== "POST" || (pathname !== "/visit" && !session))
            return new Response("Not found", { status: 404 });

        const origin = request.headers.get("Origin");
        if (!allowed(origin, env))
            return new Response("Forbidden", { status: 403 });

        const res = session
            ? await updateSession(request, env, ctx, Number(session[1]))
            : await logVisit(request, env, ctx);

        if (origin) res.headers.set("Access-Control-Allow-Origin", origin);

        return res;
    },
} satisfies ExportedHandler<Env>;

// Any origin in development, so localhost and the LAN address both work
function allowed(origin: string | null, env: Env) {
    return isDev(env) || origin === env.ALLOWED_ORIGIN;
}

async function logVisit(request: Request, env: Env, ctx: ExecutionContext) {
    const body = await readBody(request);
    if (!body) return new Response("Bad request", { status: 400 });

    const ua = request.headers.get("User-Agent") ?? "";
    // Not a visitor, so not counted, and nothing to send a session to
    if (isBot(ua)) return new Response(null, { status: 204 });

    const cf = request.cf;
    const ip = request.headers.get("CF-Connecting-IP");
    const { browser, os, device } = parseUA(ua);
    const now = new Date();
    const referrer = text(body.referrer);

    const row = {
        created_at: now.toISOString(),
        country: cf?.country ?? null,
        region: cf?.region ?? null,
        city: cf?.city ?? null,
        timezone: cf?.timezone ?? null,
        asn: cf?.asn ?? null,
        org: cf?.asOrganization ?? null,
        // Without a salt the hash could be guessed back, so none is kept
        ip_hash: ip && env.SALT ? await hashIp(ip, env.SALT, now) : null,
        device,
        browser,
        os,
        language: text(body.language),
        entry: text(body.entry),
        referrer,
        referrer_host: referrerHost(referrer),
        via: cleanVia(body.via),
        visitor: cleanVisitor(body.visitor),
        edit_token: crypto.randomUUID(),
        updated_at: now.toISOString(),
    };
    const columns = Object.keys(row);

    // The new row's id is the visitor number
    const visit = await env.DB.prepare(
        `INSERT INTO visits (${columns.join(", ")})
         VALUES (${columns.map(() => "?").join(", ")})
         RETURNING *`,
    )
        .bind(...Object.values(row))
        .first<Visit>();
    if (!visit) throw new Error("The visit wasn't saved");

    // The page has its visit back at once, to send its session to; the
    // post carries on without it
    ctx.waitUntil(announce(env, visit, ip));

    return Response.json({ id: visit.id, token: visit.edit_token });
}

// Posts the visit, keeping the message's id for the session to edit
async function announce(env: Env, visit: Visit, ip: string | null) {
    const messageId = await post(env, buildEmbed(visit, ip, isDev(env)));
    if (!messageId) return;

    const saved = await env.DB.prepare(
        "UPDATE visits SET message_id = ? WHERE id = ? RETURNING *",
    )
        .bind(messageId, visit.id)
        .first<Visit>();

    // A session that came in before there was a message to edit is put
    // in now
    if (saved && saved.updated_at !== visit.updated_at)
        await edit(env, messageId, buildEmbed(saved, ip, isDev(env)));
}

async function updateSession(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    id: number,
) {
    const body = await readBody(request);
    const steps = cleanSteps(body?.steps);
    if (!body || !steps) return new Response("Bad request", { status: 400 });

    const { session, pages, galleries, duration_ms } = sessionColumns(steps);
    // Only the page holding the visit's token can update it, and a beacon
    // that arrives after a newer one changes nothing
    const visit = await env.DB.prepare(
        `UPDATE visits SET session = ?1, pages = ?2, galleries = ?3,
            duration_ms = ?4, updated_at = ?5
         WHERE id = ?6 AND edit_token = ?7
            AND (duration_ms IS NULL OR duration_ms <= ?4)
         RETURNING *`,
    )
        .bind(
            session,
            pages,
            galleries,
            duration_ms,
            new Date().toISOString(),
            id,
            typeof body.token === "string" ? body.token : "",
        )
        .first<Visit>();
    if (!visit) return new Response("Forbidden", { status: 403 });

    // The IP isn't stored, so the embed shows the one this update came
    // from, which is the same visitor's
    const embed = buildEmbed(
        visit,
        request.headers.get("CF-Connecting-IP"),
        isDev(env),
    );
    // The page is likely closing; the edit carries on without it
    ctx.waitUntil(edit(env, visit.message_id, embed));

    return new Response(null, { status: 204 });
}

// Sent as text/plain, so the browser makes a simple request with no CORS
// preflight. Nothing in it is trusted.
async function readBody(request: Request) {
    try {
        const body = await request.json();

        return body && typeof body === "object"
            ? (body as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

function isDev(env: Env) {
    return env.ENVIRONMENT === "development";
}

// Returns the message's id, to edit it as the visit goes on
async function post(env: Env, embed: Embed) {
    const message = await discord<{ id: string }>(env, "POST", "?wait=true", {
        ...SENDER,
        embeds: [embed],
    });

    return message?.id ?? null;
}

async function edit(env: Env, messageId: string | null, embed: Embed) {
    // A dry run has no message, but still shows the edit
    if (messageId || !env.DISCORD_WEBHOOK_URL)
        await discord(env, "PATCH", `/messages/${messageId}`, {
            embeds: [embed],
        });
}

// Through the webhook, and quietly: the visit still counts when Discord is
// down. Without one, as when trying it locally, it logs what it would have
// sent.
async function discord<T>(
    env: Env,
    method: "POST" | "PATCH",
    path: string,
    payload: object,
) {
    if (!env.DISCORD_WEBHOOK_URL) {
        console.log(`[dry run] ${method}`, JSON.stringify(payload, null, 2));
        return null;
    }

    try {
        const res = await fetch(`${env.DISCORD_WEBHOOK_URL}${path}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

        return await res.json<T>();
    } catch (err) {
        console.error(`Discord ${method} failed:`, err);
        return null;
    }
}
