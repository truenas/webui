/**
 * Authentication setup project (T5).
 *
 * Runs once per run, before the authenticated projects, and proves that token
 * login works against this appliance — the earliest and clearest place for
 * that to fail. It no longer persists browser state: the authenticated tests
 * sign in per test through the `page` fixture in `support/fixtures.ts`, which
 * explains why a saved `storageState` cannot carry more than one test.
 *
 * S1 deliberately does NOT depend on this — it drives the real sign-in form, so
 * the bypass can never hide a broken login page (R4.2).
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
