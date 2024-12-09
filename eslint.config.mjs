import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import angular from "angular-eslint";
import stylistic from "@stylistic/eslint-plugin";
import { fixupPluginRules } from "@eslint/compat";
import rxjsAngular from "eslint-plugin-rxjs-angular";
import angularFileNaming from "eslint-plugin-angular-file-naming";
import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from 'eslint-plugin-unicorn';
import { eslintHtml } from './eslint/eslint-html.mjs'
import { eslintSpec } from "./eslint/eslint-spec.mjs";
import { fixLaterRules } from "./eslint/eslint-ts-rules-fix-later.mjs";
import { ruleOverrides } from "./eslint/eslint-ts-rules-overrides.mjs";
import { extraRules } from "./eslint/eslint-ts-rules-extra.mjs";
import rxjs from "@smarttools/eslint-plugin-rxjs";

export default tsEslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: "error"
    },
  },
  {
    ignores: [
      ".angular/",
      "debian/",
      "docker/",
      "tests/"
    ],
  },
  {
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      unicorn,
      rxjs,
      "rxjs-angular": fixupPluginRules(rxjsAngular),
      "angular-file-naming": fixupPluginRules(angularFileNaming),
      "unused-imports": unusedImports,
      "@stylistic/js": stylistic,
      "@stylistic/ts": stylistic,
    },
    extends: [
      eslint.configs.recommended,
      ...tsEslint.configs.strictTypeChecked,
      ...tsEslint.configs.stylisticTypeChecked,
      ...angular.configs.tsRecommended,
      stylistic.configs.customize({
        semi: true,
        jsx: false,
        braceStyle: '1tbs',
        arrowParens: 'always',
        quoteProps: 'as-needed'
      }),
      importPlugin.flatConfigs.recommended,
      sonarjs.configs.recommended,
      rxjs.configs.recommended,
    ],
    rules: {
      ...ruleOverrides,
      ...extraRules,
      ...fixLaterRules,
    }
  },
  eslintSpec,
  eslintHtml,
);
