/**
 * Alert class settings, driven through the UI from the Category card on
 * System > Alert Settings.
 */
import { expect, type Page } from '@playwright/test';
import { goToAlertSettings } from './navigation';
import { selectOption } from './storage';
import type { AlertClassPick } from '../fixtures/alert-classes';
import { alertClassLocators } from '../locators/alert-classes';

/**
 * Shows a class's row, starting from the sidebar: the card opens on the first
 * category, so this picks the class's category from the header menu.
 *
 * The card renders its rows only once it has loaded the categories and the
 * stored settings, and fills every select from those in the same step, so the
 * class's title being visible says its selects hold what the appliance has.
 */
export async function openAlertClass(page: Page, cls: AlertClassPick): Promise<void> {
  await goToAlertSettings(page);

  await page.locator(alertClassLocators.categories).click();
  await page.locator(alertClassLocators.category(cls.categoryId)).click();
  await expect(page.locator(alertClassLocators.categories)).toContainText(cls.categoryTitle);
  await expect(page.locator(alertClassLocators.title(cls.title))).toBeVisible();
}

/** Picks a level by its wire value — `CRITICAL`, which is also its label. */
export async function chooseAlertClassLevel(page: Page, classTitle: string, level: string): Promise<void> {
  await selectOption(page, alertClassLocators.level(classTitle), alertClassLocators.levelOption(classTitle, level));
}

/** Picks a frequency by its wire value — `HOURLY`, which is also its label. */
export async function chooseAlertClassPolicy(page: Page, classTitle: string, policy: string): Promise<void> {
  await selectOption(page, alertClassLocators.policy(classTitle), alertClassLocators.policyOption(classTitle, policy));
}

/**
 * Presses the card's Save.
 *
 * The card reports success only in a snackbar and stays where it is, so there
 * is nothing on the page that says the save landed. The spec polls the appliance
 * for that instead.
 */
export async function saveAlertClasses(page: Page): Promise<void> {
  await page.locator(alertClassLocators.save).click();
}
