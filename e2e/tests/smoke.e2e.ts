/**
 * Phase 0 walking skeleton.
 *
 * Deliberately minimal. This test exists to prove the rig — target profile
 * resolution, token generation, authenticated session reuse, and that the app
 * actually renders — not to cover a feature. Feature coverage starts at S1 in
 * Phase 4.
 *
 * If this passes in both profiles, every structural assumption in
 * `02-technology.md` has been validated against a real appliance.
 */
import { adminLayout } from '../support/constants';
import { expect, test } from '../support/fixtures';

test('the authenticated session loads the admin shell', async ({ page }) => {
  // Relative to the configured baseURL — never absolute (R5.5).
  await page.goto('./');

  await expect(page.locator(adminLayout)).toBeVisible();
});
