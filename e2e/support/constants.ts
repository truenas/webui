/**
 * Values shared across the harness.
 *
 * Note this is NOT the locator layer (R5.3) — that arrives in Phase 2 under
 * `locators/` and holds `data-test` values per screen. What lives here is
 * infrastructure: paths and the one structural selector the auth flow needs
 * before any page object exists.
 */

/**
 * Where the authenticated browser state is persisted by the setup project.
 *
 * Under `e2e/` rather than the repository root so the suite keeps its artifacts
 * to itself. Gitignored — it holds a live session token.
 */
export const storageStatePath = 'e2e/.auth/storage-state.json';

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
