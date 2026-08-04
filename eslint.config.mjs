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

export default [
  {
    // Generated test coverage reports; not ignored by the base config.
    ignores: ['coverage/'],
  },
  ...baseConfig,
  projectOverrides,
];