/**
 * Overrides for rules in shareable configs.
 */
export const ruleOverrides = {
  "@typescript-eslint/no-deprecated": ["off"],
  "@typescript-eslint/unbound-method": ["off"],
  "@typescript-eslint/no-confusing-void-expression": ["error", {
    ignoreArrowShorthand: true,
  }],
  "@typescript-eslint/prefer-reduce-type-parameter": ["off"],
  "@stylistic/quotes": ["error", "single", {avoidEscape: true}],
  "@typescript-eslint/dot-notation": ["error", {allowIndexSignaturePropertyAccess: true}],
  "@typescript-eslint/restrict-template-expressions": ["error", {allowNumber: true, allowAny: true}],
  "@typescript-eslint/no-extraneous-class": ["off"],
  "@typescript-eslint/no-unsafe-return": ["off"],
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-unnecessary-type-parameters": "off",
  "@typescript-eslint/no-misused-promises": ["error", {checksVoidReturn: false}],
  "@typescript-eslint/no-empty-function": ["off"],

  "import/no-unresolved": ["off"],
  "import/named": ["off"],

  "sonarjs/no-duplicate-string": ["off"],
  "sonarjs/no-clear-text-protocols": ["off"],
  "sonarjs/todo-tag": ["off"],
  "sonarjs/no-hardcoded-ip": ["off"],
  "sonarjs/no-hardcoded-credentials": ["off"],
  "sonarjs/pseudo-random": ["off"],
  "sonarjs/new-cap": ["off"],
};
