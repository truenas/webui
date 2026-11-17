/**
 * The Preferences form from the topbar's user menu (theme, session timeout, language, date/time format), a side
 * panel whose Save belongs to the panel; the opening ids live in `topbar.ts`. Only what specs select on, as an
 * entry reads as a verified fact. Language translates the whole app, which breaks text assertions and the few
 * ids built from translated strings (e.g. Date Created in `locators/boot-environments.ts`). Session Timeout
 * drops idle sessions, so a test that lowers it must restore it or every later test lands on sign-in.
 */
import { kebabTestSegment } from './test-id';

export const preferencesLocators = {
  form: {
    /**
     * Swaps the single Theme select for a Light/Dark pair. A `@if` in the
     * template, so the controls are absent rather than disabled.
     */
    syncThemeWithOs: '[data-test="checkbox-sync-theme-with-os"]',
    theme: '[data-test="select-theme"]',
    lightTheme: '[data-test="select-light-theme"]',
    darkTheme: '[data-test="select-dark-theme"]',

    /**
     * A theme option, by its on-screen label, never the stored value: `tn-select` derives option ids from labels,
     * and most themes disagree (`Dark` is stored as `ix-dark`). `Paper`, `Dracula` and `Nord` happen to agree,
     * which hides the mistake until it doesn't.
     */
    themeOption: (label: string): string => `[data-test="option-theme-${kebabTestSegment(label)}"]`,

    /**
     * In minutes, though the preference is stored in seconds. No `testId`, so
     * the id falls back to the control name, `token_lifetime`.
     */
    sessionTimeout: '[data-test="input-token-lifetime"]',

    /**
     * `<tn-autocomplete [testId]="'language'">`: the input is
     * `autocomplete-language` and its rows are `option-language-<label>`. A
     * label is the language's own name and its code, `Deutsch (de)`.
     */
    language: '[data-test="autocomplete-language"]',
    languageOption: (label: string): string => `[data-test="option-language-${kebabTestSegment(label)}"]`,

    /** No `testId`, so the id falls back to the control name, `date_format`. */
    dateFormat: '[data-test="select-date-format"]',

    /**
     * A date format option, by its label, which is today's date in that format and the appliance's timezone, so
     * the id changes daily; `monthDayYearLabel` in `flows/preferences.ts` builds it. Ids can collide:
     * `MM/dd/yyyy` and `dd/MM/yyyy` when day equals month, and `dd/MM/yyyy` and `dd.MM.yyyy` always, so a spec
     * picking one takes the first match, the earlier format in the list.
     */
    dateFormatOption: (label: string): string => `[data-test="option-date-format-${kebabTestSegment(label)}"]`,

    save: '[data-test="button-save"]',
    /** The panel's dismiss control; raises the unsaved-changes confirmation. */
    close: '[data-test="button-close-side-panel"]',
  },
} as const;

/**
 * The `<html>` class for a theme stored under the given name. They differ (`ix-dark` is stored, `tn-dark` shown),
 * joined by `webuiToComponentLibraryThemeMap` in `theme.service.ts`; mirrored as a map, not a prefix rule, which
 * would only hold by coincidence. Read `<html>`, the live value; never `<body>`, whose static `ix-dark` from
 * `src/index.html` never updates, so asserting on it passes for any theme. A class, not a `data-test`, because
 * this reads the document element rather than selecting anything, and there is no other observable.
 */
export const themeClassByStoredName: Record<string, string> = {
  'ix-dark': 'tn-dark',
  'ix-blue': 'tn-blue',
  dracula: 'tn-dracula',
  nord: 'tn-nord',
  paper: 'tn-paper',
  'solarized-dark': 'tn-solarized-dark',
  midnight: 'tn-midnight',
  'high-contrast': 'tn-high-contrast',
};

export function themeClass(storedName: string): string {
  const className = themeClassByStoredName[storedName];

  if (!className) {
    throw new Error(
      `No document class is known for the theme "${storedName}". Add it to `
      + 'themeClassByStoredName in e2e/locators/preferences.ts, matching '
      + 'webuiToComponentLibraryThemeMap in theme.service.ts.',
    );
  }

  return className;
}
