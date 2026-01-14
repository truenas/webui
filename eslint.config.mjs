import baseConfig from '@truenas/common-typescript/eslint.config';

// Project-specific overrides
const projectOverrides = {
  files: ['**/*.ts'],
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
  },
};

export default [
  ...baseConfig,
  projectOverrides,
];