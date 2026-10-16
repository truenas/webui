/**
 * Setting HA up through the UI, and failing over: the steps the HA suite's
 * journeys are built from.
 */
import { expect, type Page } from '@playwright/test';
import { closeFirstTimeWarning } from './advanced-settings';
import { goToAdvancedSettings, goToDashboard, goToGeneralSettings, goToNetwork } from './navigation';
import { confirmDestructiveAction, selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import {
  failoverLocators, haInterfaceLocators, haStatusLocators, licenseLocators,
} from '../locators/ha';

/**
 * Pasting a license and saving it ends in a reload of the whole app, which
 * signs in again and can be slow on a pair that has just been licensed.
 */
const reloadTimeoutMs = 2 * 60_000;

/** A network change's commit restarts the interface under the UI's own socket. */
const networkChangeTimeoutMs = 2 * 60_000;

/**
 * Uploads `license` from the Support card and takes the reload the app asks
 * for, which is how the rest of the UI learns the system is now HA licensed.
 *
 * The reload's dialog cannot be dismissed any other way (`disableClose`, no
 * cancel), so it is waited for rather than probed.
 */
export async function uploadLicense(page: Page, license: string): Promise<void> {
  await goToGeneralSettings(page);
  await page.locator(licenseLocators.setLicense).click();
  await page.locator(licenseLocators.license).fill(license);
  await page.locator(licenseLocators.save).click();

  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: reloadTimeoutMs });
  await page.locator(confirmDialogLocators.confirm).click();
}

/** "I Agree" on the EULA the app raises once an Enterprise license is on TrueNAS hardware. */
export async function acceptEula(page: Page): Promise<void> {
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible({ timeout: reloadTimeoutMs });
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
}

/** Opens an interface's edit form from its row on System > Network. */
export async function openInterfaceForm(page: Page, name: string): Promise<void> {
  await goToNetwork(page);
  await page.locator(haInterfaceLocators.menu(name)).click();
  await page.locator(haInterfaceLocators.edit(name)).click();
  await expect(page.locator(haInterfaceLocators.form.save)).toBeVisible();
}

export interface HaAddresses {
  /** This controller's address. */
  address: string;
  netmask: number;
  /** The other controller's. */
  failoverAddress: string;
  vip: string;
}

/**
 * Turns the open interface form from DHCP to one static address with the HA
 * pair's other two beside it, and makes the interface critical for failover
 * in `group`. The form has no alias row while DHCP is on, so one is added.
 */
export async function setHaAddresses(page: Page, addresses: HaAddresses, group: number): Promise<void> {
  const form = haInterfaceLocators.form;
  await page.locator(form.staticAddresses).click();
  await page.locator(form.addAddress).click();

  await page.locator(form.address).fill(addresses.address);
  await selectOption(page, form.netmask, form.netmaskOption(addresses.netmask));
  await page.locator(form.failoverAddress).fill(addresses.failoverAddress);
  await page.locator(form.virtualAddress).fill(addresses.vip);

  await page.locator(form.critical).setChecked(true);
  await selectOption(page, form.group, form.groupOption(group));
}

/**
 * Saves the interface form. `keepsGateway` says whether the change drops a
 * gateway or DNS servers DHCP had given, which is when the form follows up
 * with "Set Gateway and DNS", prefilled with them: Register keeps them.
 */
export async function saveInterface(page: Page, keepsGateway: boolean): Promise<void> {
  await page.locator(haInterfaceLocators.form.save).click();
  await expect(page.locator(haInterfaceLocators.form.save)).toBeHidden();

  if (keepsGateway) {
    const dialog = haInterfaceLocators.gatewayDialog;
    await expect(page.locator(dialog.gateway)).toBeVisible();
    await expect(page.locator(dialog.gateway)).not.toHaveValue('');
    await page.locator(dialog.register).click();
    await expect(page.locator(dialog.gateway)).toBeHidden();
  }
}

/**
 * Test Changes, then Save Changes: the Network page applies a change on
 * trial, rolls it back unless it is kept within the check-in timeout, and
 * keeps it on Save. Test asks for the Confirm box; Save does not.
 */
export async function testAndSaveNetworkChanges(page: Page): Promise<void> {
  const pending = haInterfaceLocators.pending;
  await page.locator(pending.testChanges).click();
  await confirmDestructiveAction(page);

  await expect(page.locator(pending.saveChanges)).toBeEnabled({ timeout: networkChangeTimeoutMs });
  await page.locator(pending.saveChanges).click();
  await expect(page.locator(confirmDialogLocators.confirm)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(pending.saveChanges)).toBeHidden({ timeout: networkChangeTimeoutMs });
}

/**
 * Opens the Failover form from its card on Advanced Settings. `firstOnPage`
 * is whether it is the first form this page load opens, which is the one
 * Advanced Settings puts its warning in front of.
 */
export async function openFailoverForm(page: Page, firstOnPage: boolean): Promise<void> {
  await goToAdvancedSettings(page);
  await page.locator(failoverLocators.card.configure).click();
  if (firstOnPage) {
    await closeFirstTimeWarning(page);
  }
  await expect(page.locator(failoverLocators.form.save)).toBeVisible();
}

/** Sets "Enable Automatic Failover" in the open Failover form, and saves it. */
export async function saveAutomaticFailover(page: Page, enabled: boolean): Promise<void> {
  await page.locator(failoverLocators.form.enabled).setChecked(enabled);
  await page.locator(failoverLocators.form.save).click();
  await expect(page.locator(failoverLocators.form.save)).toBeHidden();
  await expect(page.locator(failoverLocators.card.enabled)).toHaveText(enabled ? 'Enabled' : 'Disabled');
}

/**
 * Sync To Peer from the open Failover form: this controller's configuration
 * onto the other, rebooting it onto that when `restartStandby`.
 */
export async function syncToPeer(page: Page, restartStandby: boolean): Promise<void> {
  await page.locator(failoverLocators.form.syncToPeer).click();
  await expect(page.locator(confirmDialogLocators.checkbox)).toBeVisible();
  await page.locator(confirmDialogLocators.checkbox).setChecked(true);
  await page.locator(confirmDialogLocators.secondaryCheckbox).setChecked(restartStandby);
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
  // Enabled again once the sync has answered.
  await expect(page.locator(failoverLocators.form.syncToPeer)).toBeEnabled({ timeout: networkChangeTimeoutMs });
}

/**
 * Initiate Failover, on the Dashboard's standby widget, and its confirmation.
 * The app then takes the page to its "failing over" splash on its own.
 */
export async function initiateFailover(page: Page): Promise<void> {
  await goToDashboard(page);
  const initiate = page.locator(haStatusLocators.initiateFailover);
  await expect(initiate).toBeEnabled();
  await initiate.click();
  await confirmDestructiveAction(page);
}
