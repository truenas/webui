/**
 * Apps > Configuration > Manage Container Images: pulling an image, deleting one from its row, and
 * deleting the ticked rows from the Batch Operations toolbar.
 */
import { expect, type Page } from '@playwright/test';
import { openAppsConfigMenu } from './apps';
import { imagePullTimeoutMs } from '../fixtures/container-images';
import {
  containerImagesLocators, deleteImageDialogLocators, pullImageFormLocators,
} from '../locators/container-images';
import { slowCallTimeoutMs } from '../support/timeouts';

/** From Apps > Installed, opens Manage Container Images from the Configuration menu. */
export async function goToContainerImages(page: Page): Promise<void> {
  await openAppsConfigMenu(page);
  await page.locator(containerImagesLocators.menuItem).click();
  await expect(page).toHaveURL(/\/apps\/manage-container-images$/);
}

/**
 * Pull Image, fills the image and its tag, and saves. The panel closes once the `app.image.pull`
 * job has succeeded, and the list reloads behind it.
 */
export async function pullImage(page: Page, image: string, tag: string): Promise<void> {
  await page.locator(containerImagesLocators.pullImage).click();

  await page.locator(pullImageFormLocators.image).fill(image);
  await page.locator(pullImageFormLocators.tag).fill(tag);
  await page.locator(pullImageFormLocators.save).click();

  await expect(page.locator(pullImageFormLocators.save)).toBeHidden({ timeout: imagePullTimeoutMs });
}

/**
 * The image row's Delete, ticks Confirm and presses Delete. For a single image the dialog closes
 * once `app.image.delete` has succeeded, and the list reloads.
 */
export async function deleteImage(page: Page, id: string): Promise<void> {
  await page.locator(containerImagesLocators.image(id).delete).click();

  await expect(page.locator(deleteImageDialogLocators.title)).toBeVisible();
  await page.locator(deleteImageDialogLocators.confirm).click();
  await page.locator(deleteImageDialogLocators.delete).click();

  await expect(page.locator(deleteImageDialogLocators.title)).toBeHidden({ timeout: slowCallTimeoutMs });
}

/** The Batch Operations toolbar's Delete, for the rows already ticked. Returns once the dialog is open. */
export async function openBatchImageDelete(page: Page): Promise<void> {
  await page.locator(containerImagesLocators.batchDelete).click();
  await expect(page.locator(deleteImageDialogLocators.title)).toBeVisible();
}

/**
 * In the open delete dialog: checks Delete is disabled until Confirm is ticked, ticks it, leaves
 * Force as it is, and presses Delete. With more than one image the dialog stays open and reports
 * the outcome, which replaces Delete with Close once the `core.bulk` job has ended.
 */
export async function confirmBatchImageDelete(page: Page): Promise<void> {
  const deleteButton = page.locator(deleteImageDialogLocators.delete);

  await expect(deleteButton).toBeDisabled();
  await page.locator(deleteImageDialogLocators.confirm).click();
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();

  await expect(page.locator(deleteImageDialogLocators.close)).toBeVisible({ timeout: slowCallTimeoutMs });
}
