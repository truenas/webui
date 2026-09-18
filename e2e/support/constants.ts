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
 * The error dialog's own container, for reading the message out.
 *
 * Role-based rather than `data-test`, so a documented exception to R5.1 on the
 * same grounds as {@link adminLayout}: this is diagnostic text extraction for
 * a failure message, not a test assertion or interaction.
 */
export const errorDialogRole = 'alertdialog';

/**
 * Title of the development build's concurrency diagnostic.
 *
 * `websocket-handler.service.ts` caps itself at 20 concurrent middleware calls
 * and raises this dialog when it saturates that window. The whole block is
 * wrapped in `if (!environment.production)`, so a shipped build cannot produce
 * it — it exists only under the `branch` profile, whose UI is a dev build.
 *
 * It is matched by text rather than by a `data-test` value because it has none
 * of its own: it is raised through the generic `DialogService.error`, so it
 * carries the same id as every other error dialog and only its words tell the
 * two apart. A dedicated id would be better and belongs upstream.
 *
 * Worth being clear about what dismissing it means. The dialog is a real signal
 * — the UI asked for more than the connection could retire, which is felt as
 * slowness on a loaded appliance — but it is a statement about the *page*, not
 * about the journey a test is asserting. Failing a sign-out test because the
 * dashboard is chatty conflates two findings and loses both. So the harness
 * dismisses it and carries on, and capturing it as a reportable signal is
 * deliberately left as its own piece of work rather than smuggled in here.
 */
export const concurrentCallsDialogTitle = 'Max Concurrent Calls';
