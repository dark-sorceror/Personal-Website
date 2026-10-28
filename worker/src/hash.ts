// The same visitor hashes the same all day, so unique visitors per day can
// be counted, but the salt keeps the address from being guessed back, and
// the date keeps a visitor from being followed from one day to the next
export async function hashIp(ip: string, salt: string, now: Date) {
    const day = now.toISOString().slice(0, 10);
    const data = new TextEncoder().encode(`${ip}|${day}|${salt}`);
    const digest = await crypto.subtle.digest("SHA-256", data);

    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}
