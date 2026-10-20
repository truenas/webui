/**
 * Driving System > Update.
 */
import type { Page } from '@playwright/test';
import { updateLocators } from '../locators/update';
import { confirmTaskRun } from './data-protection';
import { selectOption } from './storage';

/** Picks a profile in the Update Profile card's select, by the `name` it is labelled with. */
export async function chooseUpdateProfile(page: Page, name: string): Promise<void> {
  await selectOption(page, updateLocators.profile.select, updateLocators.profile.option(name));
}

/**
 * Picks a profile, presses Apply and answers Continue in the confirm it raises.
 *
 * The card raises the same `hideCheckbox` confirm a Data Protection list's Run does, with a snackbar
 * for an answer, so {@link confirmTaskRun} answers it. The caller reads the outcome from the appliance.
 */
export async function applyUpdateProfile(page: Page, name: string): Promise<void> {
  await chooseUpdateProfile(page, name);
  await page.locator(updateLocators.profile.apply).click();
  await confirmTaskRun(page);
}
