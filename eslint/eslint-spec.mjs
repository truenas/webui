import jest from "eslint-plugin-jest";

export const eslintSpec = {
  files: ['**/*.spec.ts'],
  extends: [
    jest.configs['flat/recommended'],
    jest.configs['flat/style']
  ],
  rules: {
    "jest/no-large-snapshots": ["error"],
    "jest/prefer-equality-matcher": ["error"],
    "jest/prefer-lowercase-title": ["error", {"ignore": ["describe"]}],
    "jest/expect-expect": [
      "error",
      {
        "assertFunctionNames": ["expect", "expectObservable"],
      }
    ]
  },
};
