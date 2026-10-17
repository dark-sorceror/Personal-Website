import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ExperienceList } from "@/components/Experience";

describe("ExperienceList", () => {
    it("keeps a dateless role's column cell so earlier roles stay aligned", () => {
        const html = renderToStaticMarkup(
            <ExperienceList
                entries={[
                    {
                        roles: [
                            { title: "Coach", start: "" },
                            {
                                title: "Assistant",
                                start: "Jan 2024",
                                end: "Mar 2024",
                            },
                        ],
                        company: "Club",
                        logo: "/logo.png",
                    },
                ]}
            />,
        );
        const grid =
            html.match(/<div class="grid[^"]*">(.*)<\/div><\/li>/)?.[1] ?? "";
        // Headline, its (empty) date cell, the earlier role, its dates
        const cells = grid.match(
            /^<div>.*?<\/div><span><\/span><div class="[^"]*">.*?<\/div><p class="[^"]*">Jan – Mar 2024<\/p>$/,
        );

        expect(cells).not.toBeNull();
    });
});
