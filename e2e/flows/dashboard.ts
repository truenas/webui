/**
 * Editing the Dashboard layout in Configure mode, through the UI.
 *
 * Nothing here is persisted until {@link saveDashboard}: adding and deleting change only the layout
 * on screen, and {@link cancelConfigure} puts back the one the store holds.
 */
import { expect, type Locator, type Page } from '@playwright/test';
import { selectOption } from './storage';
import { dashboardLocators } from '../locators/dashboard';
import { confirmDialogLocators } from '../locators/dialogs';

/** The save is one `auth.set_attribute` call and a re-read of `auth.me`. */
const saveTimeoutMs = 30_000;

/**
 * How far the pointer moves before it heads for the target. CDK starts a drag only once the pointer
 * has travelled past its threshold, 5 px, from where it went down.
 */
const dragStartDistancePx = 10;

/** Pointer moves on the way to the target. CDK re-sorts the list on each move, not on the drop. */
const dragSteps = 10;

async function centreOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`${locator.toString()} has no bounding box, so it cannot be dragged to or from.`);
  }

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

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
 * Drags the group at `fromIndex` by its handle onto the handle of the group at `toIndex`.
 *
 * Pointer steps rather than `locator.dragTo`, which goes straight from one point to the other: CDK
 * needs the pointer to pass its drag threshold first, and moves in between to sort the list. Both
 * handles have to be on screen, so a spec gives itself a viewport tall enough for both groups.
 */
export async function dragCardGroup(page: Page, fromIndex: number, toIndex: number): Promise<void> {
  const from = await centreOf(page.locator(dashboardLocators.edit.dragHandle(fromIndex)));
  const to = await centreOf(page.locator(dashboardLocators.edit.dragHandle(toIndex)));

  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y - dragStartDistancePx, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: dragSteps });
  await page.mouse.up();
}

/** Moves a group one place down with its Move down button, which only phone width shows. */
export async function moveCardGroupDown(page: Page, index: number): Promise<void> {
  await page.locator(dashboardLocators.edit.moveGroupDown(index)).click();
}

/** Restores the default cards on screen through Reset and its confirm. Nothing is saved yet. */
export async function resetDashboard(page: Page): Promise<void> {
  await page.locator(dashboardLocators.edit.reset).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
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
