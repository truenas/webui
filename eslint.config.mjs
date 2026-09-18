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
        // `[ixTest]` and its `TestDirective` were deleted in NAS-143893; the library's
        // `[tnTestId]` is the one directive that writes a `data-test`. Only the spellings that
        // would actually revive it are rejected: an attribute or selector that assigns a value
        // (`ixTest="…"`, `[ixTest="…"]`) and a bare `'ixTest'`. A prose `[ixTest]` with no `=`
        // is left alone — several strings and test names legitimately name the directive they
        // replaced — and `\b` stops before `ixTestOverride`, an unrelated
        // `<ix-table-pager-show-more>` input. Templates are covered by `scripts/check-test-ids.ts`.
        selector: "Literal[value=/\\bixTest=|^ixTest$/], TemplateElement[value.raw=/\\bixTest=/], Identifier[name='ixTest']",
        message: '`ixTest` is retired (NAS-143893). Tag elements with the library\'s `[tnTestId]` + `tnTestIdType`, and pre-normalize dynamic values with `normalizeTestIdString` / `normalizeTestIdParts` from app/modules/test-id/normalize-test-id.utils.ts.',
      },
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
 * `angular-test-ids/require-test-id` comes from the shared base config, where it is still keyed to
 * the `ixTest` attribute NAS-143893 retired. It enforces nothing either way — the plugin's selector
 * (`Element$1[name=…]`) no longer matches the node type angular-eslint 20's template parser emits,
 * so the rule matches no element at all — but leaving it pointed at a deleted directive would make
 * it demand `ixTest` back the day the plugin is fixed. It is also the wrong shape for tn-*: those
 * carry their id on a component `testId` input the plugin cannot see. `scripts/check-test-ids.ts`
 * is the gate that actually runs, over exactly the elements that need one.
 */
const templateOverrides = {
  files: ['**/*.html'],
  rules: {
    'angular-test-ids/require-test-id': ['off'],
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
  templateOverrides,
  e2eOverrides,
];