import Link from "next/link";

// Replaces Next's built-in 404, whose own full-height black panel ignored the
// theme and, under the desktop zoom, only covered part of the window.
export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-col items-center justify-center gap-[18px] px-[24px] text-center font-[family-name:var(--font-serif),Georgia,serif]">
            <p className="font-[system-ui] text-sm font-semibold uppercase tracking-[0.12em] text-(--text-muted)">
                404
            </p>
            <h1 className="m-0 text-[32px] leading-[1.2] font-bold text-(--link-color)">
                Nothing lives here.
            </h1>
            <p className="text-lg text-(--text-muted)">
                Like a lonely cell in the background, this page didn&apos;t
                survive.
            </p>
            <Link
                href="/"
                className="mt-[6px] text-lg font-medium text-(--link-color) underline decoration-(--link-color)/40 decoration-[3px] underline-offset-[6px] transition-[text-decoration-color] duration-300 hover:decoration-(--link-color)"
            >
                Back to Hao Yan
            </Link>
        </main>
    );
}
