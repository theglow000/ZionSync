import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

// Runtime globals, listed by hand rather than pulling in the `globals` package
const ro = (names) => Object.fromEntries(names.map((n) => [n, "readonly"]));

const runtimeGlobals = ro([
  // Shared by browser and Node 20
  "AbortController",
  "Blob",
  "URL",
  "URLSearchParams",
  "Response",
  "Request",
  "Headers",
  "FormData",
  "TextEncoder",
  "TextDecoder",
  "performance",
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "queueMicrotask",
  "structuredClone",
  // Browser
  "alert",
  "confirm",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "getComputedStyle",
  "matchMedia",
  "ResizeObserver",
  "IntersectionObserver",
  "HTMLElement",
  "Event",
  "CustomEvent",
  "File",
  "FileReader",
]);

const commonJsGlobals = ro([
  "module",
  "require",
  "exports",
  "__dirname",
  "global",
]);

const jestGlobals = ro([
  "jest",
  "describe",
  "it",
  "test",
  "expect",
  "beforeEach",
  "afterEach",
  "beforeAll",
  "afterAll",
]);

export default [
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx,mjs}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // Count JSX usage as use, otherwise every imported component is "unused"
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react/react-in-jsx-scope": "off",
      // A leading underscore marks an intentionally unused name
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "react/prop-types": "off",
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
        process: "readonly",
        console: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        ...runtimeGlobals,
      },
    },
  },
  {
    // Tests, mocks and the CommonJS config files
    files: [
      "**/*.test.{js,jsx}",
      "src/tests/**",
      "__mocks__/**",
      "jest.setup.js",
      "jest.config.js",
    ],
    languageOptions: {
      globals: { ...jestGlobals, ...commonJsGlobals },
    },
  },
  {
    files: ["**/*.cjs", "next.config.*", "postcss.config.*", "scripts/**"],
    languageOptions: { globals: commonJsGlobals },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "coverage/**",
    ],
  },
];
