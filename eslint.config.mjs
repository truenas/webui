import baseConfig from '@truenas/common-typescript/eslint.config';

// ESLint replaces a rule's options wholesale rather than merging them, so the base
// config's `no-restricted-syntax` entries have to be carried over explicitly. Read them
// out instead of hand-copying, or an entry added upstream would silently stop applying.
const baseRestrictedSyntax = baseConfig.flatMap((config) => {
  const rule = config.rules?.['no-restricted-syntax'];
  return Array.isArray(rule) ? rule.slice(1) : [];
});

// Carried into the spec-only override below as well, for the same wholesale-replacement
// reason: an entry listed here has to be repeated anywhere `no-restricted-syntax` is set
// again, or it stops applying to those files.
const projectRestrictedSyntax = [
  {
    // The .scss half of this is enforced by `selector-disallowed-list` in
    // .stylelintrc.json; this keeps the invariant from leaking through TypeScript
    // (spec queries, host bindings, class-name strings).
    selector: 'Literal[value=/tn-list-item__/], TemplateElement[value.raw=/tn-list-item__/]',
    message: '`.tn-list-item__*` is internal @truenas/ui-components markup, not public API. Style it through a mixin in src/assets/styles/mixins/tn-list.scss and select the public `tn-list-item` element instead. See "Known Library Gaps" in TRUENAS_UI_INTEGRATION.md.',
  },
];

// Project-specific overrides
const projectOverrides = {
  files: ['**/*.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      ...baseRestrictedSyntax,
      ...projectRestrictedSyntax,
    ],
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            // `@angular/material` is gone from package.json entirely (NAS-141025), so a
            // stray import already fails to resolve. This keeps the failure legible — and
            // stops someone re-adding the dependency to "fix" it.
            //
            // Deliberately repo-wide rather than scoped to `src/app/modules/forms/**` plus
            // the migrated sections (NAS-142358): every section is migrated now, so a list
            // of paths would only be a list that goes stale. The `.scss` half is covered by
            // `selector-disallowed-list` in .stylelintrc.json, and `mat-*` elements in
            // templates are already a compile error now that the package is gone.
            group: ['@angular/material', '@angular/material/*'],
            message: "Angular Material has been fully replaced by @truenas/ui-components (NAS-141025). Use the `tn-*` equivalent; for dialogs, go through `DialogService` (app/modules/dialog/dialog.service.ts) or inject `TnDialog` from '@truenas/ui-components'.",
          },
        ],
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

/**
 * `data-test` exists for the Playwright suite under `e2e/`. Unit specs have component
 * harnesses instead, so locating an element by its test ID here couples the spec to a
 * string it does not own: regenerate or rename the ID and specs that have nothing to do
 * with the change go red, while a spec that bypasses the harness keeps passing after the
 * component is migrated to a different control.
 *
 * Only the *selector* form is banned — `[data-test="x"]`, and the `^= $= *= ~=` variants.
 * Asserting on the attribute (`toHaveAttribute('data-test', ...)`) and dumping the set of
 * IDs a row renders (`queryAll('[data-test]')`, snapshotted) are about the test ID rather
 * than lookups by it, so they stay legal.
 */
const specOverrides = {
  files: ['src/**/*.spec.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      ...baseRestrictedSyntax,
      ...projectRestrictedSyntax,
      {
        selector: 'Literal[value=/\\[data-test[\\^$*~|]?=/], TemplateElement[value.raw=/\\[data-test[\\^$*~|]?=/]',
        message: 'Do not locate elements by their `data-test` ID in unit specs — that attribute is for the e2e suite. Use a component harness (TnInputHarness, TnSelectHarness, TnTableHarness, TnMenuHarness, IxFormHarness, …), or failing that a semantic query: by role, by accessible name, by visible text, or by the component selector.',
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
  specOverrides,
  e2eOverrides,
];