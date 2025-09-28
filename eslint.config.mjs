import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      // Unused variables as warnings
      "@typescript-eslint/no-unused-vars": "warn",
      "no-unused-vars": "warn",

      // Spacing rules for better readability
      "padding-line-between-statements": [
        "error",
        // Empty line before return statements
        { blankLine: "always", prev: "*", next: "return" },
        // Empty line before block statements (if, for, while, etc.)
        { blankLine: "always", prev: "*", next: "block-like" },
        // Empty line after variable declarations
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        {
          blankLine: "any",
          prev: ["const", "let", "var"],
          next: ["const", "let", "var"],
        },
        // Empty line before function declarations
        { blankLine: "always", prev: "*", next: "function" },
        // Empty line before class declarations
        { blankLine: "always", prev: "*", next: "class" },
        // Empty line before export statements
        { blankLine: "always", prev: "*", next: "export" },
        // Empty line after import statements
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
        // Empty line before try/catch blocks
        { blankLine: "always", prev: "*", next: "try" },
      ],

      // Additional spacing rules
      "lines-between-class-members": ["error", "always"],
      "newline-before-return": "error",
      "object-curly-spacing": ["error", "always"],
      "array-bracket-spacing": ["error", "never"],
      "space-before-blocks": "error",
      "keyword-spacing": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
