/**
 * Authentication setup project (T5).
 *
 * Runs once per run, before the authenticated projects. Logs in with a token
 * and persists browser state so no other test pays the ~15 second sign-in cost
 * (R4.1).
 *
 * S1 deliberately does NOT depend on this — it drives the real sign-in form, so
 * the bypass can never hide a broken login page (R4.2).
 */
import { expect, test as setup } from '@playwright/test';
import { withClient } from '../api/client';
import { loadTargetConfig } from '../config';
import { buildTokenLoginUrl, generateAuthToken } from './token';
import { adminLayout, storageStatePath } from '../constants';

setup('authenticate', async ({ page }) => {
  const config = loadTargetConfig();

  const token = await withClient(config, (client) => generateAuthToken(client));

  await page.goto(buildTokenLoginUrl(config.uiBaseUrl, token));

  // The admin layout is the unambiguous signal that authentication completed
  // and the app has rendered — not a URL change, which happens earlier.
  await expect(page.locator(adminLayout)).toBeVisible({ timeout: 60_000 });

  await page.context().storageState({ path: storageStatePath });
});
