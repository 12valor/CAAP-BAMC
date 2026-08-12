import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    files: [
      "src/app/(admin)/admin/loans/actions.ts",
      "src/app/(admin)/admin/rebates/actions.ts",
      "src/app/(admin)/admin/settings/actions.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["src/app/(admin)/admin/settings/settings-manager.tsx"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    files: ["src/app/(admin)/admin/loans/loan-manager.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { ignoreRestSiblings: true }],
    },
  },
  globalIgnores([
    ".next/**",
    "build/**",
    "coverage/**",
    "out/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
  ]),
]);
