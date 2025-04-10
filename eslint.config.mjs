// @ts-check

// Created following https://typescript-eslint.io/

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["dist/**", "eslint.config.mjs"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  reactHooks.configs["recommended-latest"],
  reactRefresh.configs.recommended,
  reactCompiler.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
);
