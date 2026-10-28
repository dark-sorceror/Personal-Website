export interface Device {
    browser: string;
    os: string;
    device: "Desktop" | "Mobile" | "Tablet";
}

// Crawlers, and the headless browsers that mail scanners and previews open
// links in, run the page like anyone else. Their user agents say what they
// are; a real browser always sends one.
export function isBot(ua: string) {
    return !ua || /headless|bot[/;)-]|crawler|spider|lighthouse/i.test(ua);
}

export function parseUA(ua: string): Device {
    let browser = "Unknown Browser";

    if (/Edg\//.test(ua))
        browser = `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/OPR\//.test(ua))
        browser = `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/Chrome\//.test(ua) && !/Chromium\//.test(ua))
        browser = `Chrome ${ua.match(/Chrome\/([\d]+)/)?.[1] ?? ""}`;
    else if (/Firefox\//.test(ua))
        browser = `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ""}`;
    else if (/Safari\//.test(ua) && !/Chrome\//.test(ua))
        browser = `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? ""}`;
    else if (/MSIE |Trident\//.test(ua)) browser = "Internet Explorer";

    let os = "Unknown OS";

    if (/iPhone/.test(ua)) {
        const v = ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `iOS ${v} (iPhone)`;
    } else if (/iPad/.test(ua)) {
        const v = ua.match(/OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `iPadOS ${v}`;
    } else if (/Android/.test(ua)) {
        const v = ua.match(/Android ([\d.]+)/)?.[1] ?? "";
        const model =
            ua.match(/Android [\d.]+;\s*([^)]+)\)/)?.[1]?.trim() ?? "";
        os = `Android ${v}${model ? ` · ${model}` : ""}`;
    } else if (/Windows NT 10.0/.test(ua)) os = "Windows 10/11";
    else if (/Windows NT/.test(ua)) os = "Windows (older)";
    else if (/Mac OS X/.test(ua)) {
        const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
        os = `macOS ${v}`;
    } else if (/CrOS/.test(ua)) os = "ChromeOS";
    else if (/Linux/.test(ua)) os = "Linux";

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
    const device = /iPad/.test(ua) ? "Tablet" : isMobile ? "Mobile" : "Desktop";

    return { browser, os, device };
}
