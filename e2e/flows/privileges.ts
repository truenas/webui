/**
 * Privileges, driven through the UI from Credentials > Privileges.
 */
import { expect, type Page } from '@playwright/test';
import { goToPrivileges } from './navigation';
import { confirmDialogLocators } from '../locators/dialogs';
import { privilegeLocators } from '../locators/privileges';

/** Creating, updating and deleting a privilege are middleware calls, not instant. */
const saveTimeoutMs = 60_000;

/** Opens the add form from the list, starting from the sidebar. */
export async function openAddPrivilegeForm(page: Page): Promise<void> {
  await goToPrivileges(page);

  await page.locator(privilegeLocators.list.add).click();
  await expect(page.locator(privilegeLocators.form.name)).toBeVisible();
}

/**
 * Opens the edit form from the privilege's row, starting from the sidebar, and
 * waits until it holds that privilege's name — the form patches every field from
 * the row in the same step, so the name is the signal that the roles are in too.
 */
export async function openEditPrivilegeForm(page: Page, name: string): Promise<void> {
  await goToPrivileges(page);

  await page.locator(privilegeLocators.list.edit(name)).click();
  await expect(page.locator(privilegeLocators.form.name)).toHaveValue(name);
}

/**
 * Clicks each of these roles, by label, in the open form's Roles select. A click
 * toggles a role, so this both picks and drops.
 *
 * The select is multiple, so its panel stays open between clicks and has to be
 * closed before anything else on the form is reached. Escape is what closes it.
 * The side panel also closes on Escape, so the name field is asserted still there
 * afterwards: a panel that took the key would fail here rather than at Save.
 */
export async function toggleRoles(page: Page, labels: string[]): Promise<void> {
  const { form } = privilegeLocators;
  await page.locator(form.roles).click();

  for (const label of labels) {
    await page.locator(form.roleOption(label)).click();
  }

  await page.keyboard.press('Escape');
  await expect(page.locator(form.roleOption(labels[0]))).toBeHidden();
  await expect(page.locator(form.name)).toBeVisible();
}

/**
 * Saves the form and waits for the panel to close.
 *
 * The panel closing is the app's own signal that the save succeeded — a refusal
 * leaves it open with the error attached.
 */
export async function savePrivilegeForm(page: Page): Promise<void> {
  await page.locator(privilegeLocators.form.save).click();
  await expect(page.locator(privilegeLocators.form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a privilege from its row, through webui's shared confirm, starting from
 * the sidebar, and waits for its row to go.
 *
 * `confirmDelete` does not pass `hideCheckbox`, so Delete stays **disabled** until
 * the box is ticked — asserted on the way, so a dialog that lost its gate fails here
 * rather than passing a test that never needed it.
 */
export async function deletePrivilege(page: Page, name: string): Promise<void> {
  await goToPrivileges(page);
  await page.locator(privilegeLocators.list.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();

  const confirm = page.locator(confirmDialogLocators.confirm);
  await expect(confirm).toBeDisabled();
  await page.locator(confirmDialogLocators.checkbox).click();
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.locator(privilegeLocators.list.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}
