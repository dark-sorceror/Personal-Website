import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: "export",
    images: {
        unoptimized: true,
    },
    trailingSlash: true,
    // Let a phone on the same network load the dev server by the Mac's
    // address. Next blocks other hosts by default, and the page then never
    // hydrates, so nothing interactive (the theme toggle, say) responds.
    allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
};

export default nextConfig;
