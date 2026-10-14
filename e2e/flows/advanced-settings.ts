/**
 * What every card on System > Advanced Settings has in common.
 */
import { expect, type Page } from '@playwright/test';
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
