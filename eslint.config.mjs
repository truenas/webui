import baseConfig from '@truenas/common-typescript/eslint.config';
import noExtraWhitespaceInLineContinuation from './eslint-rules/no-extra-whitespace-in-line-continuation.mjs';

const customRulesPlugin = {
  rules: {
    'no-extra-whitespace-in-line-continuation': noExtraWhitespaceInLineContinuation,
  },
};

// Project-specific overrides
const projectOverrides = {
  files: ['**/*.ts'],
  plugins: {
    'truenas': customRulesPlugin,
  },
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: '@angular/common',
            importNames: ['DatePipe'],
            message: "Do not use Angular's DatePipe directly. It bypasses user datetime format preferences. Use FormatDateTimePipe from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe' or LocaleService methods instead. For fixed formats (like filenames), use date-fns directly.",
          },
        ],
      },
    ],
    'truenas/no-extra-whitespace-in-line-continuation': 'error',
  },
};

export default [
  ...baseConfig,
  projectOverrides,
];