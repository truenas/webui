import baseConfig from '@truenas/common-typescript/eslint.config';

// ESLint replaces a rule's options wholesale rather than merging them, so the base
// config's `no-restricted-syntax` entries have to be carried over explicitly. Read them
// out instead of hand-copying, or an entry added upstream would silently stop applying.
const baseRestrictedSyntax = baseConfig.flatMap((config) => {
  const rule = config.rules?.['no-restricted-syntax'];
  return Array.isArray(rule) ? rule.slice(1) : [];
});

// Project-specific overrides
const projectOverrides = {
  files: ['**/*.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      ...baseRestrictedSyntax,
      {
        // The .scss half of this is enforced by `selector-disallowed-list` in
        // .stylelintrc.json; this keeps the invariant from leaking through TypeScript
        // (spec queries, host bindings, class-name strings).
        selector: 'Literal[value=/tn-list-item__/], TemplateElement[value.raw=/tn-list-item__/]',
        message: '`.tn-list-item__*` is internal @truenas/ui-components markup, not public API. Style it through a mixin in src/assets/styles/mixins/tn-list.scss and select the public `tn-list-item` element instead. See "Known Library Gaps" in TRUENAS_UI_INTEGRATION.md.',
      },
    ],
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

/**
 * The Playwright suite is plain Node TypeScript, not Angular, so the base
 * config's Angular expectations do not apply to it.
 *
 * `angular-file-naming` in particular requires names like `*.component.ts` or
 * `*.service.ts`; the e2e suite is organised by role (`flows/`, `locators/`,
 * `fixtures/`) instead. The rules disabled here are about Angular's file and
 * class conventions only — correctness rules still apply.
 */
const e2eOverrides = {
  files: ['e2e/**/*.ts', 'playwright.config.ts'],
  rules: {
    'angular-file-naming/component-filename-suffix': 'off',
    'angular-file-naming/directive-filename-suffix': 'off',
    'angular-file-naming/service-filename-suffix': 'off',
    'angular-file-naming/module-filename-suffix': 'off',
    'angular-file-naming/pipe-filename-suffix': 'off',
    // Playwright's API is promise-heavy and its own `expect` is thenable;
    // the base config's Jest-oriented rules misread both.
    'jest/expect-expect': 'off',
    'jest/no-standalone-expect': 'off',
    'jest/no-conditional-expect': 'off',
    // `playwright.config.ts` must default-export its configuration; Playwright
    // reads no other shape.
    'import/no-default-export': 'off',
  },
};

export default [
  {
    // Generated test coverage reports; not ignored by the base config.
    ignores: ['coverage/'],
  },
  ...baseConfig,
  projectOverrides,
  e2eOverrides,
];