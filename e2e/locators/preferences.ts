/**
 * The Preferences form, reached from the user menu in the topbar.
 *
 * One form for everything the signed-in account can set about its own view of
 * the appliance — theme, session timeout, language, date and time format. It is
 * a side panel, so its Save belongs to the panel rather than to the form.
 *
 * The two ids that open it — the topbar trigger and the menu entry — live in
 * `topbar.ts` with the rest of that menu, not here.
 *
 * Only what the specs select on: the session timeout, language, date and time
 * format controls are on this form and deliberately absent below, because an
 * entry here reads as a verified fact about the screen and an unexercised one is
 * only a guess at it. Two warnings for whoever adds them. **Session Timeout
 * drops an idle session** — a test that lowers it and does not put it back ends
 * every later test in the run at the sign-in page. **Language translates the
 * whole app**, which is survivable for `data-test` selectors and not for any
 * assertion on text.
 *
 * See `signin.ts` for a note on the type-prefixing that produces these values.
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
     * A theme option, by the label shown on screen.
     *
     * **By label, not by value** — `tn-select` derives an option's id from its
     * label and falls back to the value only for labelless options. It matters
     * here more than anywhere else in the suite, because the two disagree for
     * most themes: `Dark` is stored as `ix-dark`, `Blue` as `ix-blue`, and a
     * locator built from the stored value would never match. (`Paper`,
     * `Dracula` and `Nord` happen to agree, which is what makes the mistake
     * survivable right up until it isn't.)
     */
    themeOption: (label: string): string => `[data-test="option-theme-${kebabTestSegment(label)}"]`,

    save: '[data-test="button-save"]',
    /** The panel's dismiss control; raises the unsaved-changes confirmation. */
    close: '[data-test="button-close-side-panel"]',
  },
} as const;

/**
 * The class `<html>` carries for a theme stored under the given name.
 *
 * **The two names are not the same**, and assuming they were cost a failing
 * test: webui stores `ix-dark` and the document reads `tn-dark`. The stored name
 * is webui's (`theme.constants.ts`), the class is the library's `TnTheme`, and
 * `webuiToComponentLibraryThemeMap` in `theme.service.ts` is what joins them.
 * Mirrored here as a map rather than a string rule — the `ix-` prefix is dropped
 * for two themes and absent from the other six, so any rule inferred from that
 * is a coincidence waiting to be a bug, and a map fails loudly on a theme nobody
 * added here.
 *
 * `<html>` is also the only place worth reading. It is the live value, updating
 * on preview as well as on save. **Not `<body>`**, which carries `ix-dark`
 * written statically into `src/index.html` so the first paint is not unstyled,
 * and which nothing ever updates — it still reads `ix-dark` after saving a light
 * theme and reloading, so a test asserting on it would pass against any theme at
 * all.
 *
 * A class rather than a `data-test`, which the suite otherwise forbids — but
 * that rule is about *selecting* elements and this selects nothing: it reads an
 * attribute off the document element to ask what theme is showing. There is no
 * other observable, and a `data-test` mirroring a CSS class would be a second
 * source of truth for one fact.
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
