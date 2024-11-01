import angular from "angular-eslint";
import testIds from "eslint-plugin-angular-test-ids";

export const eslintHtml = {
  files: ['**/*.html'],
  extends: [
    ...angular.configs.templateRecommended,
    ...angular.configs.templateAccessibility,
  ],
  plugins: {
    "angular-test-ids": testIds,
  },
  rules: {
    "angular-test-ids/require-test-id": ["error", {
      "attribute": "ixTest",
      "addElements": ["a", "mat-row", "mat-slider", "table"]
    }],

    "@angular-eslint/template/attributes-order": ["error"],
    "@angular-eslint/template/no-duplicate-attributes": ["error"],
    "@angular-eslint/template/no-interpolation-in-attributes": ["error"],
    "@angular-eslint/template/prefer-control-flow": ["error"],
    "@angular-eslint/template/no-positive-tabindex": ["error"],

    // TODO: To enable later.
    "@angular-eslint/template/no-negated-async": ["off"],
    "@angular-eslint/template/click-events-have-key-events": ["off"],
    "@angular-eslint/template/interactive-supports-focus": ["off"],
    "@angular-eslint/template/alt-text": ["off"],
    "@angular-eslint/template/label-has-associated-control": ["off"],
  },
};
