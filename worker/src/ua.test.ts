import { describe, expect, it } from "vitest";

import { parseUA } from "./ua";

describe("parseUA", () => {
    it("reads Chrome on a Mac", () => {
        const ua =
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

        expect(parseUA(ua)).toEqual({
            browser: "Chrome 141",
            os: "macOS 10.15.7",
            device: "Desktop",
        });
    });

    it("tells Edge from the Chrome it's built on", () => {
        const ua =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.3537.57";

        expect(parseUA(ua)).toEqual({
            browser: "Edge 141.0.3537.57",
            os: "Windows 10/11",
            device: "Desktop",
        });
    });

    it("reads Safari on an iPhone", () => {
        const ua =
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1";

        expect(parseUA(ua)).toEqual({
            browser: "Safari 18.6",
            os: "iOS 18.6 (iPhone)",
            device: "Mobile",
        });
    });

    it("counts an iPad as a tablet", () => {
        const ua =
            "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

        expect(parseUA(ua)).toEqual({
            browser: "Safari 17.5",
            os: "iPadOS 17.5",
            device: "Tablet",
        });
    });

    it("names the Android phone's model", () => {
        const ua =
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

        expect(parseUA(ua)).toEqual({
            browser: "Chrome 141",
            os: "Android 14 · Pixel 8",
            device: "Mobile",
        });
    });

    it("reads Firefox on Linux", () => {
        const ua =
            "Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0";

        expect(parseUA(ua)).toEqual({
            browser: "Firefox 144",
            os: "Linux",
            device: "Desktop",
        });
    });

    it("falls back for agents it doesn't know, or none", () => {
        const unknown = {
            browser: "Unknown Browser",
            os: "Unknown OS",
            device: "Desktop",
        };

        expect(parseUA("curl/8.7.1")).toEqual(unknown);
        expect(parseUA("")).toEqual(unknown);
    });
});
