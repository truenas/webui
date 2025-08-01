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
  "@stylistic/no-multiple-empty-lines": ["error", {
    "max": 2,
  }],
  "@stylistic/quotes": ["error", "single", {avoidEscape: true}],
  "@typescript-eslint/dot-notation": ["error", {allowIndexSignaturePropertyAccess: true}],
  "@typescript-eslint/restrict-template-expressions": ["error", {allowNumber: true, allowAny: true}],
  "@typescript-eslint/no-extraneous-class": ["off"],
  "@typescript-eslint/no-unsafe-assignment": ["off"], // TODO: should be enabled
  "@typescript-eslint/no-unsafe-call": ["off"], // TODO: should be enabled
  "@typescript-eslint/no-unsafe-member-access": ["off"], // TODO:s hould be enabled
  "@typescript-eslint/no-unsafe-return": ["off"],
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/no-unnecessary-type-parameters": "off",
  "@typescript-eslint/no-misused-promises": ["error", {checksVoidReturn: false}],
  "@typescript-eslint/no-misused-spread": ["off"], // TODO: should be enabled
  "@typescript-eslint/no-empty-function": ["off"],

  "@angular-eslint/component-class-suffix": ["off"],

  "import/no-unresolved": ["off"],
  "import/named": ["off"],

  "sonarjs/aws-apigateway-public-api": ["off"],
  "sonarjs/aws-ec2-rds-dms-public": ["off"],
  "sonarjs/aws-ec2-unencrypted-ebs-volume": ["off"],
  "sonarjs/aws-efs-unencrypted": ["off"],
  "sonarjs/aws-iam-all-privileges": ["off"],
  "sonarjs/aws-iam-privilege-escalation": ["off"],
  "sonarjs/aws-iam-public-access": ["off"],
  "sonarjs/aws-opensearchservice-domain": ["off"],
  "sonarjs/aws-rds-unencrypted-databases": ["off"],
  "sonarjs/aws-restricted-ip-admin-access": ["off"],
  "sonarjs/aws-s3-bucket-granted-access": ["off"],
  "sonarjs/aws-s3-bucket-insecure-http": ["off"],
  "sonarjs/aws-s3-bucket-public-access": ["off"],
  "sonarjs/aws-s3-bucket-versioning": ["off"],
  "sonarjs/aws-sagemaker-unencrypted-notebook": ["off"],
  "sonarjs/aws-sns-unencrypted-topics": ["off"],
  "sonarjs/aws-sqs-unencrypted-queue": ["off"],
  "sonarjs/new-cap": ["off"],
  "sonarjs/no-clear-text-protocols": ["off"],
  "sonarjs/no-deprecated-react": ["off"],
  "sonarjs/no-duplicate-string": ["off"],
  "sonarjs/no-hardcoded-credentials": ["off"],
  "sonarjs/no-hardcoded-ip": ["off"],
  "sonarjs/no-hardcoded-passwords": ["off"], // catches in .spec.ts files
  "sonarjs/no-redundant-assignments": ["off"],
  "sonarjs/pseudo-random": ["off"],
  "sonarjs/todo-tag": ["off"],
  "sonarjs/unused-import": ["off"],
  "sonarjs/xml-parser-xxe": ["off"],

  "@smarttools/rxjs/no-ignored-takewhile-value": ["off"],

  // Fix compatibility issues with ESLint 9
  "@typescript-eslint/no-unused-expressions": ["error", {
    allowShortCircuit: false,
    allowTernary: false
  }],
};
