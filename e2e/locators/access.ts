/**
 * The Access card on System > Advanced Settings.
 *
 * The session timeout readout is tagged `tnTestIdType="text"`, so the id is
 * static, and it holds the duration alone, without its label. The "Preferences"
 * link in the hint below it is a plain `<button>` tagged `tnTestIdType="button"`.
 *
 * The timeout is not an Access setting: it is the signed-in account's own
 * preference, and the link opens the Preferences form. That form's ids are in
 * `preferences.ts`.
 *
 * Every id on a session row is built from the card's own `uniqueRowTag`,
 * `session-<username>-<origin>`, through the library's normalizer, which
 * {@link kebabTestSegment} replicates: `e2e_session_admin` from `10.0.0.5:51234`
 * tags its row `session-e2e-session-admin-10-0-0-5-51234`. The origin is per
 * connection, so a spec reads it from `auth.sessions` (`fixtures/sessions.ts`).
 * A token session is tagged with its parent's username, as the card shows it.
 *
 * Terminate session is the row's only action, an inline icon button, so its id
 * has no `more-action`.
 */
import { kebabTestSegment } from './test-id';

function sessionRowTag(username: string, origin: string): string {
  return kebabTestSegment(`session-${username}-${origin}`);
}

export const accessLocators = {
  card: {
    /** `formatDuration` of the stored lifetime, e.g. `10 minutes` or `2 hours`. */
    sessionTimeout: '[data-test="text-access-session-timeout"]',
    /** Opens the Preferences form, the only place the timeout is edited. */
    openPreferences: '[data-test="button-access-open-preferences"]',
  },

  sessions: {
    /** `<tn-button [testId]="['sessions', 'terminate']">` in the card footer. */
    terminateOthers: '[data-test="button-sessions-terminate"]',

    /**
     * The card's pager, `<ix-table-pager-show-more [testId]="['access']">`. View
     * All renders only while there are more sessions than the card lists, and
     * Collapse only once it was pressed.
     */
    viewAll: '[data-test="button-access-show-more"]',
    collapse: '[data-test="button-access-show-less"]',

    row: (username: string, origin: string): string => `[data-test="row-${sessionRowTag(username, origin)}"]`,

    username: (username: string, origin: string): string =>
      `[data-test="text-username-${sessionRowTag(username, origin)}-row-text"]`,

    /** Disabled on the browser's own session, which middleware reports as `current`. */
    terminate: (username: string, origin: string): string =>
      `[data-test="button-${sessionRowTag(username, origin)}-mdi-exit-to-app-row-action"]`,
  },
} as const;
