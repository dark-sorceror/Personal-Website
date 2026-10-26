import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

// Matches tsconfig's "@/*" path, so component tests can import like the app
export default defineConfig({
    resolve: {
        alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    // Agents' worktrees live under .claude/ with their own copies of the
    // tests, which belong to their branches, not this one
    test: { exclude: [...configDefaults.exclude, ".claude/**"] },
});
