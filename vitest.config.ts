import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      exclude: [
        "apps/dashboard/**",
        "vitest.config.ts",
        "index.ts",
        "**/node_modules/**",
        "**/dist/**",
        "**/.next/**",
      ],
    },
  },
});
