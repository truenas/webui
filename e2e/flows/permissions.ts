/**
 * A dataset's owner, group and Unix mode, driven through the Unix Permissions Editor, and its
 * NFSv4 entries, presets and owner, driven through the ACL editor.
 */
import { expect, type Page } from '@playwright/test';
import { goToDatasets } from './navigation';
import { selectOption } from './storage';
import { datasetMountPath } from '../fixtures/storage';
import { permissionsLocators, type AccessRight, type AccessWho } from '../locators/permissions';
import { datasetDetailsLocators, datasetLocators } from '../locators/storage';

/** Saving runs `filesystem.setperm` as a job behind a progress dialog. */
const saveTimeoutMs = 90_000;

const editor = permissionsLocators.editor;

/**
 * Selects `dataset` in the tree and opens the editor from Edit on its Permissions card.
 *
 * The card belongs to whatever the tree has selected, and the page lands with the pool root
 * selected, so the details card's Path has to name `dataset` before Edit is clicked.
 *
 * Waits for the form to load. It opens with every Access Mode box clear and ticks them once the
 * mode has been read, in the same step that fills User and Group. A field changed before that would
 * be overwritten. Every mode a test starts from gives the owner Read, so that box is the signal.
 */
export async function openPermissionsEditor(page: Page, dataset: string): Promise<void> {
  await editFromPermissionsCard(page, dataset);
  await expect(page.locator(editor.access('user', 'read'))).toBeChecked();
}

/**
 * Selects `dataset` in the tree and opens the ACL editor from Edit on its Permissions card.
 *
 * The card sends a non-trivial ACL here directly. Use Preset is the signal that it is the ACL
 * editor and not the Unix one, which shows the same path.
 */
export async function openAclEditor(page: Page, dataset: string): Promise<void> {
  await editFromPermissionsCard(page, dataset);
  await expect(page.locator(permissionsLocators.aclEditor.usePreset)).toBeVisible();
}

/** The part both editors share: select `dataset`, press Edit, and wait for the path. */
async function editFromPermissionsCard(page: Page, dataset: string): Promise<void> {
  await goToDatasets(page);

  const node = page.locator(datasetLocators.treeNode(dataset));
  await expect(node).toBeVisible();
  await node.click();
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);

  await page.locator(permissionsLocators.card.edit).click();
  await expect(page.locator(editor.datasetPath)).toHaveText(datasetMountPath(dataset));
}

/**
 * Presses Set ACL in the Unix editor, and waits for the preset dialog.
 *
 * The ACL editor raises that dialog itself once it has read a trivial ACL, so it is
 * on screen before anything in the editor can be used.
 */
export async function setAclFromUnixEditor(page: Page): Promise<void> {
  await page.locator(editor.setAcl).click();
  await expect(page.locator(permissionsLocators.presetDialog.title)).toBeVisible();
}

/**
 * Chooses the preset `name` in the dialog already open, and continues.
 *
 * Works on both forms of the dialog. The one the editor raises itself starts on
 * "Select a preset ACL", and Use Preset's has no radios at all, so in both the
 * select is the only thing to fill. The preset replaces the form's entries and
 * nothing is saved yet.
 */
export async function choosePreset(page: Page, name: string): Promise<void> {
  const dialog = permissionsLocators.presetDialog;

  await expect(page.locator(dialog.title)).toBeVisible();
  await selectOption(page, dialog.preset, dialog.presetOption(name));
  await page.locator(dialog.continue).click();
  await expect(page.locator(dialog.title)).toBeHidden();
}

/**
 * Picks a new owner in the ACL editor's header, and sets Apply Owner to `apply`.
 *
 * The same autocomplete as {@link chooseOwner}: the row is what commits the value.
 */
export async function setAclOwner(page: Page, username: string, apply: boolean): Promise<void> {
  const aclEditor = permissionsLocators.aclEditor;

  await page.locator(aclEditor.owner).fill(username);
  await page.locator(aclEditor.ownerOption(username)).click();
  await page.locator(aclEditor.applyOwner).setChecked(apply);
}

/** Picks a new owner group in the ACL editor's header. The same shape as {@link setAclOwner}. */
export async function setAclGroup(page: Page, group: string, apply: boolean): Promise<void> {
  const aclEditor = permissionsLocators.aclEditor;

  await page.locator(aclEditor.ownerGroup).fill(group);
  await page.locator(aclEditor.ownerGroupOption(group)).click();
  await page.locator(aclEditor.applyGroup).setChecked(apply);
}

/**
 * Picks a new owner and ticks Apply User, without which the owner is not sent.
 *
 * The field is an autocomplete over a middleware query, so the row is not in the DOM until the
 * typed text has been answered. Clicking the row is what commits the value, not the text.
 */
export async function chooseOwner(page: Page, username: string): Promise<void> {
  await page.locator(editor.user).fill(username);
  await page.locator(editor.userOption(username)).click();
  await page.locator(editor.applyUser).setChecked(true);
}

/** Picks a new group and ticks Apply Group. The same shape as {@link chooseOwner}. */
export async function chooseGroup(page: Page, group: string): Promise<void> {
  await page.locator(editor.group).fill(group);
  await page.locator(editor.groupOption(group)).click();
  await page.locator(editor.applyGroup).setChecked(true);
}

/** Ticks or clears one box of the Access Mode table. */
export async function setAccess(page: Page, who: AccessWho, right: AccessRight, allowed: boolean): Promise<void> {
  await page.locator(editor.access(who, right)).setChecked(allowed);
}

/**
 * Adds an entry for `username` in the ACL editor, with the given basic permission.
 *
 * "Add Item" appends an entry for a user and selects it, so the entry form on
 * the right is the new entry's. Its flags stay at the default, Inherit.
 */
export async function addAclUserEntry(page: Page, username: string, permission: string): Promise<void> {
  const aclEditor = permissionsLocators.aclEditor;

  await page.locator(aclEditor.addItem).click();
  await page.locator(aclEditor.user).fill(username);
  await page.locator(aclEditor.userOption(username)).click();
  await selectOption(page, aclEditor.basicPermission, aclEditor.basicPermissionOption(permission));
}

/**
 * Saves the ACL and waits for the editor to close.
 *
 * Save stays disabled while any entry is invalid, and the user field is checked
 * asynchronously, so it waits for Save to be enabled first. Saving runs
 * `filesystem.setacl` as a job, and the editor navigates away only once it has
 * succeeded.
 */
export async function saveAcl(page: Page): Promise<void> {
  const save = page.locator(permissionsLocators.aclEditor.save);

  await expect(save).toBeEnabled();
  await save.click();
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Saves, and waits until the app is back on `dataset`.
 *
 * The editor returns to the Datasets page only once the job has succeeded. A failure leaves the
 * editor open behind an error.
 */
export async function savePermissions(page: Page, dataset: string): Promise<void> {
  await page.locator(editor.save).click();
  await expect(page.locator(editor.save)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(datasetDetailsLocators.path)).toHaveText(dataset);
}
