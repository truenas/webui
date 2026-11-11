/**
 * Phase 0 walking skeleton: proves the rig (target profile resolution, token generation, the app rendering), not a
 * feature. The `page` fixture has already signed in via the token URL, so what this adds is the reload: navigating
 * to the root must come back to the shell on the stored reconnect token, not the sign-in page. Every other
 * journey's navigation rests on that session.
 */
import { adminLayout } from '../support/constants';
import { expect, test } from '../support/fixtures';

test('the authenticated session loads the admin shell', async ({ page }) => {
  // Relative to the configured baseURL — never absolute (R5.5).
  await page.goto('./');

  await expect(page.locator(adminLayout)).toBeVisible();
});
