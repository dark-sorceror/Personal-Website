// A shared link can carry a tag (?via=code) saying which one it was. It's
// taken off the address, so a link copied from there doesn't carry it on.
export function takeVia(href: string) {
    const url = new URL(href);
    const via = url.searchParams.get("via");

    url.searchParams.delete("via");

    return { via, href: url.href };
}
