/**
 * Values shared across the harness.
 *
 * Note this is NOT the locator layer (R5.3) — that lives under `locators/` and
 * holds `data-test` values per screen. What lives here is infrastructure: the
 * structural selectors the auth and error-detection plumbing need before any
 * page object exists.
 */
/**
 * The app's root layout element: present only once authentication completes and the shell renders, so it's
 * the reliable "we are in" signal (a URL change can precede a usable page). A component selector, a deliberate
 * exception to R5.1: the layout is non-interactive harness plumbing with no test ID. Keep exceptions this rare.
 */
export const adminLayout = 'ix-admin-layout';

/**
 * Close button on webui's middleware error dialog (`ix-error-dialog`).
 *
 * Used as a detection signal rather than something to click: when a middleware
 * call fails, this dialog is what appears instead of the page you expected.
 * Racing an expected element against this turns "element not found" after a
 * 60 second timeout into an immediate failure quoting the actual error (R6.2).
 */
export const errorDialogClose = '[data-test="button-close-error-dialog"]';


/**
 * webui's error dialog, as a whole.
 *
 * The whole dialog: the shell's header carrying the title, the message block,
 * and the footer with Close. Anything scoping a dismissal to one dialog, or
 * reading what a dialog said, has to match here. A component selector, on the
 * same footing as {@link adminLayout}.
 */
export const errorDialog = 'ix-error-dialog';

/**
 * The two parts of an error dialog worth quoting in a failure.
 *
 * Together they are the title and the message and nothing else. Reading the
 * whole dialog instead drags in its chrome — the close glyph renders as literal
 * text, and the footer adds Close, Download Logs and any action labels — which
 * is noise in the one place a failure has to be legible (R6.2).
 */
export const errorDialogHeading = 'ix-error-dialog h2';
export const errorDialogBody = 'ix-error-dialog [role="alertdialog"]';

/**
 * The development build's concurrency diagnostic, raised by `websocket-handler.service.ts` when 20 calls are
 * in flight. Its `concurrent-calls` name is spelled there too with nothing linking them, so rename both.
 * Dev-build only (`!environment.production`), so only `branch` sees it. It's about the page, not the
 * journey, so the harness dismisses it rather than failing.
 */
export const concurrentCallsDialogTitleId = '[data-test="dialog-title-concurrent-calls"]';
