import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Stitch skills are external examples, not part of the app
    "stitch-skills/**",
    // Playwright report and E2E test artifacts
    "playwright-report/**",
    "test-results/**",
    "e2e/**",
  ]),
]);

export default eslintConfig;
