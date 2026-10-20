/**
 * What every card on System > Advanced Settings has in common.
 */
import { expect, type Page } from '@playwright/test';
import type { FullListLink } from './data-protection';
import { goToAdvancedSettings } from './navigation';
import { infoDialogLocators } from '../locators/dialogs';

/**
 * Closes the warning Advanced Settings raises before the first form it opens.
 *
 * Waited for rather than probed: `FirstTimeWarningService` remembers it in
 * memory, so on the fresh page every test signs in to it is certain to appear
 * exactly once — and a probe made before it renders would skip it, leaving the
 * dialog over the form the next step tries to fill. That certainty is also the
 * limit of this helper: call it only for the first form a page opens.
 */
export async function closeFirstTimeWarning(page: Page): Promise<void> {
  await expect(page.locator(infoDialogLocators.title)).toBeVisible();
  await page.locator(infoDialogLocators.close).click();
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();
}

/**
 * Follows a card's title to its full list, starting from the sidebar.
 *
 * Cron Jobs, Tunable and Init/Shutdown Scripts each have one. The title changes
 * the route, so arriving is a URL, and the list's own Add is what says it has rendered.
 */
export async function openAdvancedSettingsList(page: Page, { link, route, arrived }: FullListLink): Promise<void> {
  await goToAdvancedSettings(page);

  await page.locator(link).click();
  await expect(page).toHaveURL(route);
  await expect(page.locator(arrived)).toBeVisible();
}
