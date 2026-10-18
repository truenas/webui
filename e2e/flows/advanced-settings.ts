/**
 * What every card on System > Advanced Settings has in common.
 */
import { expect, type Page } from '@playwright/test';
import { infoDialogLocators } from '../locators/dialogs';

/** Pages whose app has shown the warning since it last loaded. */
const warnedPages = new WeakSet<Page>();

/** Pages already listening for a full load, which starts the app — and its memory — again. */
const watchedPages = new WeakSet<Page>();

/**
 * Closes the warning Advanced Settings raises before the first form it opens,
 * if this page's app has not shown it yet; otherwise does nothing.
 *
 * `FirstTimeWarningService` remembers it in memory, so it appears once per app
 * load — and the page an authenticated test gets is usually the one an earlier
 * test left signed in (`support/fixtures.ts`). So this remembers per page that
 * it closed it, and forgets on a full load (a reload, a fresh sign-in), when
 * the app starts again with nothing remembered.
 *
 * Waited for rather than probed whenever it is due: a probe made before it
 * renders would skip it, leaving the dialog over the form the next step tries
 * to fill. Call it after every click that could open a form, not only the
 * first; it is how it knows.
 */
export async function closeFirstTimeWarning(page: Page): Promise<void> {
  if (!watchedPages.has(page)) {
    watchedPages.add(page);
    page.on('load', () => warnedPages.delete(page));
  }
  if (warnedPages.has(page)) {
    return;
  }

  await expect(page.locator(infoDialogLocators.title)).toBeVisible();
  await page.locator(infoDialogLocators.close).click();
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();
  warnedPages.add(page);
}
