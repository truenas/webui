/**
 * Phase 0 walking skeleton.
 *
 * Deliberately minimal. This test exists to prove the rig — target profile
 * resolution, token generation, and that the app actually renders — not to
 * cover a feature.
 *
 * The `page` fixture has already signed in through the token URL by the time
 * the body runs, so what this adds is the reload: a plain navigation to the app
 * root has to come back to the shell on the reconnect token the app stored,
 * not the sign-in page. That is the session every other journey's navigation
 * rests on. If this passes in both profiles, every structural assumption the
 * harness makes has been validated against a real appliance.
 */
import { adminLayout } from '../support/constants';
import { expect, test } from '../support/fixtures';

test('the authenticated session loads the admin shell', async ({ page }) => {
  // Relative to the configured baseURL — never absolute (R5.5).
  await page.goto('./');

  await expect(page.locator(adminLayout)).toBeVisible();
});
