/**
 * The Access card on System > Advanced Settings. The session timeout readout has a static `text` id holding the
 * duration alone; it is the account's own preference, and its "Preferences" link opens the form in `preferences.ts`.
 * Session row ids come from the card's `uniqueRowTag`, `session-<username>-<origin>`, via {@link kebabTestSegment}
 * (`session-e2e-session-admin-10-0-0-5-51234`). The origin is per connection, so read it from `auth.sessions`
 * (`fixtures/sessions.ts`); a token session carries its parent's username. Terminate is an inline icon button,
 * so its id has no `more-action`.
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

    username: (username: string, origin: string): string => {
      const tag = sessionRowTag(username, origin);
      return `[data-test="text-username-${tag}-row-text"]`;
    },

    /** Disabled on the browser's own session, which middleware reports as `current`. */
    terminate: (username: string, origin: string): string => {
      const tag = sessionRowTag(username, origin);
      return `[data-test="button-${tag}-mdi-exit-to-app-row-action"]`;
    },
  },
} as const;
