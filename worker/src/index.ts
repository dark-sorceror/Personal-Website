import { buildEmbed, type Embed, type Visit } from "./embed";
import { hashIp } from "./hash";
import { cleanGalleries, cleanVia, referrerHost, text } from "./input";
import { parseUA } from "./ua";

interface Env {
    DB: D1Database;
    ENVIRONMENT: string;
    ALLOWED_ORIGINS: string;
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
            : await logVisit(request, env);

        if (origin) res.headers.set("Access-Control-Allow-Origin", origin);

        return res;
    },
} satisfies ExportedHandler<Env>;

// Any origin in development, so localhost and the LAN address both work
function allowed(origin: string | null, env: Env) {
    if (env.ENVIRONMENT === "development") return true;

    const origins = env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

    return origin !== null && origins.includes(origin);
}

async function logVisit(request: Request, env: Env) {
    const body = await readBody(request);
    if (!body) return new Response("Bad request", { status: 400 });

    const cf = request.cf;
    const ip = request.headers.get("CF-Connecting-IP");
    const { browser, os, device } = parseUA(
        request.headers.get("User-Agent") ?? "",
    );
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

    const messageId = await post(env, buildEmbed(visit, ip, isDev(env)));

    if (messageId) {
        await env.DB.prepare("UPDATE visits SET message_id = ? WHERE id = ?")
            .bind(messageId, visit.id)
            .run();
    }

    return Response.json({ id: visit.id, token: visit.edit_token });
}

async function updateSession(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
    id: number,
) {
    const body = await readBody(request);
    const session = text(body?.session);
    if (!body || !session) return new Response("Bad request", { status: 400 });

    const visit = await env.DB.prepare("SELECT * FROM visits WHERE id = ?")
        .bind(id)
        .first<Visit>();
    if (!visit || body.token !== visit.edit_token)
        return new Response("Forbidden", { status: 403 });

    await env.DB.prepare(
        "UPDATE visits SET session = ?, galleries = ?, updated_at = ? WHERE id = ?",
    )
        .bind(
            session,
            cleanGalleries(body.galleries),
            new Date().toISOString(),
            id,
        )
        .run();

    // The IP isn't stored, so the embed shows the one this update came
    // from, which is the same visitor's
    const embed = buildEmbed(
        { ...visit, session },
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

// Returns the message's id, to edit it as the visit goes on. Without a
// webhook, as when trying it locally, it logs what it would have sent.
async function post(env: Env, embed: Embed) {
    const payload = { ...SENDER, embeds: [embed] };

    if (!env.DISCORD_WEBHOOK_URL) {
        console.log("[dry run] POST", JSON.stringify(payload, null, 2));
        return null;
    }

    try {
        const res = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);

        return (await res.json<{ id: string }>()).id;
    } catch (err) {
        // The visit still counts when Discord is down
        console.error("Discord post failed:", err);
        return null;
    }
}

async function edit(env: Env, messageId: string | null, embed: Embed) {
    const payload = { embeds: [embed] };

    if (!env.DISCORD_WEBHOOK_URL) {
        console.log("[dry run] PATCH", JSON.stringify(payload, null, 2));
        return;
    }
    if (!messageId) return;

    try {
        const res = await fetch(
            `${env.DISCORD_WEBHOOK_URL}/messages/${messageId}`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            },
        );
        if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    } catch (err) {
        console.error("Discord edit failed:", err);
    }
}
