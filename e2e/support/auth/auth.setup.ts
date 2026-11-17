/**
 * Authentication setup project (T5). Runs once before the authenticated projects to prove token login works
 * here, the clearest place for it to fail. It persists no browser state: tests sign in per test through the
 * `page` fixture (`support/fixtures.ts` explains why). S1 deliberately doesn't depend on this, so the bypass
 * can never hide a broken login page (R4.2).
 */
import { expect, test as setup } from '@playwright/test';
import { withClient } from '../api/client';
import { loadTargetConfig } from '../config';
import { buildTokenLoginUrl, generateAuthToken } from './token';
import { adminLayout } from '../constants';

setup('authenticate', async ({ page }) => {
  const config = loadTargetConfig();

  const token = await withClient(config, (client) => generateAuthToken(client));

  await page.goto(buildTokenLoginUrl(config.uiBaseUrl, token));

  // The admin layout is the unambiguous signal that authentication completed
  // and the app has rendered — not a URL change, which happens earlier.
  await expect(page.locator(adminLayout)).toBeVisible({ timeout: 60_000 });
});
