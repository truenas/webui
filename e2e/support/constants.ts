/**
 * Values shared across the harness.
 *
 * Note this is NOT the locator layer (R5.3) — that lives under `locators/` and
 * holds `data-test` values per screen. What lives here is infrastructure: the
 * structural selectors the auth and error-detection plumbing need before any
 * page object exists.
 */
/**
 * The app's root layout element. Present only once authentication has completed
 * and the shell has rendered, which makes it the reliable "we are in" signal —
 * a URL change happens earlier and can precede a usable page.
 *
 * This is a component selector rather than a `data-test` attribute, so it is a
 * deliberate exception to R5.1. It is justified: the layout is not an
 * interactive element and would not carry a test ID, and this is harness
 * plumbing rather than a test assertion. It should remain the only exception.
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
 * The development build's concurrency diagnostic, by its own test ID.
 *
 * `websocket-handler.service.ts` raises it when 20 middleware calls are in
 * flight at once, naming itself `concurrent-calls` there so its title carries
 * an id of its own — both open the same component. That name is spelled in both
 * places and nothing links them, so a rename there needs one here. Gated on `!environment.production`,
 * so only `branch` sees it.
 *
 * A real signal, but about the *page*, not the journey a test asserts, so the
 * harness dismisses it rather than failing.
 */
export const concurrentCallsDialogTitleId = '[data-test="dialog-title-concurrent-calls"]';
