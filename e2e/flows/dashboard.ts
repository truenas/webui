/**
 * Editing the Dashboard layout in Configure mode, through the UI.
 *
 * Nothing here is persisted until {@link saveDashboard}: adding and deleting change only the layout
 * on screen, and {@link cancelConfigure} puts back the one the store holds.
 */
import { expect, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { dashboardLocators } from '../locators/dashboard';

/** The save is one `auth.set_attribute` call and a re-read of `auth.me`. */
const saveTimeoutMs = 30_000;

/** The card group the Card Editor is asked to build: one locator for each choice it makes. */
export interface CardGroupChoice {
  layoutToggle: string;
  category: string;
  type: string;
}

/** Enters Configure mode and waits for its page controls. */
export async function enterConfigureMode(page: Page): Promise<void> {
  await page.locator(dashboardLocators.configure).click();
  await expect(page.locator(dashboardLocators.edit.save)).toBeVisible();
}

/**
 * Adds a one-card group through the Card Editor and waits for the panel to close.
 *
 * The layout toggle is clicked only when it is not already the selected one. The toggles are a
 * single-select group, and clicking the selected toggle there deselects it, which leaves the
 * editor with no layout. Full is the editor's default, so a blind click would undo it.
 */
export async function addCardGroup(page: Page, choice: CardGroupChoice): Promise<void> {
  await page.locator(dashboardLocators.edit.add).click();
  const panel = page.locator(dashboardLocators.cardEditor.panel);
  await expect(panel).toBeVisible();

  const layoutToggle = panel.locator(choice.layoutToggle);
  await expect(layoutToggle).toBeVisible();
  if (await layoutToggle.getAttribute('aria-pressed') !== 'true') {
    await layoutToggle.click();
  }
  await expect(layoutToggle).toHaveAttribute('aria-pressed', 'true');

  await panel.locator(dashboardLocators.cardEditor.firstSlot).click();
  await selectOption(page, dashboardLocators.cardEditor.category, choice.category);
  await selectOption(page, dashboardLocators.cardEditor.type, choice.type);

  await page.locator(dashboardLocators.cardEditor.save).click();
  // The panel is torn down on close, so the card's preview inside it is gone with it.
  await expect(panel).toBeHidden();
}

/** Deletes a group by its index. It goes after a 300 ms animation, with no confirm. */
export async function deleteCardGroup(page: Page, index: number): Promise<void> {
  await page.locator(dashboardLocators.edit.deleteGroup(index)).click();
}

/**
 * Saves the layout. Configure appearing again is the app's signal that the save landed: it leaves
 * edit mode only once `auth.set_attribute` has answered and `auth.me` has been re-read.
 */
export async function saveDashboard(page: Page): Promise<void> {
  await page.locator(dashboardLocators.edit.save).click();
  await expect(page.locator(dashboardLocators.configure)).toBeVisible({ timeout: saveTimeoutMs });
}

/** Leaves Configure mode without saving. */
export async function cancelConfigure(page: Page): Promise<void> {
  await page.locator(dashboardLocators.edit.cancel).click();
  await expect(page.locator(dashboardLocators.configure)).toBeVisible();
}
