import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      ".output",
      ".vinxi",
      "coverage",
      "playwright-report",
      "test-results",
      ".playwright-cli",
      "output/playwright",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          property: "toMatchSnapshot",
          message:
            "Criterion S11.4: Snapshot tests are strictly forbidden. Use explicit semantic assertions (toBe, toEqual, invariants) instead.",
        },
        {
          property: "toMatchInlineSnapshot",
          message:
            "Criterion S11.4: Snapshot tests are strictly forbidden. Use explicit semantic assertions (toBe, toEqual, invariants) instead.",
        },
        {
          property: "toMatchFileSnapshot",
          message:
            "Criterion S11.4: Snapshot tests are strictly forbidden. Use explicit semantic assertions (toBe, toEqual, invariants) instead.",
        },
        {
          property: "toThrowErrorMatchingSnapshot",
          message:
            "Criterion S11.4: Snapshot tests are strictly forbidden. Use explicit semantic assertions (toBe, toEqual, invariants) instead.",
        },
        {
          property: "toThrowErrorMatchingInlineSnapshot",
          message:
            "Criterion S11.4: Snapshot tests are strictly forbidden. Use explicit semantic assertions (toBe, toEqual, invariants) instead.",
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintPluginPrettier,
);
