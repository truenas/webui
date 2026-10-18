/**
 * The Interfaces card and the pending-changes card on System > Network, driven
 * through the UI.
 *
 * Only staging and reverting are here. Test Changes applies a staged edit to
 * the NIC the suite talks to, so nothing in this file presses it — see
 * `fixtures/interfaces.ts`.
 */
import { expect, type Page } from '@playwright/test';
import { saveInterface } from './ha';
import { goToNetwork } from './navigation';
import { confirmDestructiveAction, selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import {
  defaultGatewayDialogLocators, interfaceFormLocators, interfacesCardLocators, pendingChangesLocators,
} from '../locators/network-interfaces';

/** `interface.rollback` re-reads the configuration middleware holds before it answers. */
const revertTimeoutMs = 60_000;

export interface VlanSettings {
  name: string;
  description: string;
  /** The parent NIC's name, which is also its option's label. */
  parent: string;
  tag: number;
}

/** Opens "Add Interface" from the card, starting from the sidebar. */
export async function openAddInterfaceForm(page: Page): Promise<void> {
  await goToNetwork(page);
  await page.locator(interfacesCardLocators.add).click();
  await expect(page.locator(interfaceFormLocators.type)).toBeVisible();
}

/**
 * Fills the open "Add Interface" form as a VLAN with no addresses, and saves it.
 *
 * The type goes first: choosing it fills Name with the next free `vlanN`, which
 * would otherwise overwrite the name typed here, and it is what reveals the
 * VLAN Settings section.
 */
export async function addVlan(page: Page, vlan: VlanSettings): Promise<void> {
  const form = interfaceFormLocators;
  await selectOption(page, form.type, form.typeOption('VLAN'));
  await expect(page.locator(form.vlanParent)).toBeVisible();

  await page.locator(form.name).fill(vlan.name);
  await page.locator(form.description).fill(vlan.description);
  await selectOption(page, form.vlanParent, form.vlanParentOption(vlan.parent));
  await page.locator(form.vlanTag).fill(String(vlan.tag));

  // "Set Gateway and DNS" may follow; the spec answers it with
  // `answerGatewayDialog`, since only the API can say whether it will.
  await saveInterface(page, false);
}

/**
 * Answers "Set Gateway and DNS" after an interface save. `expected` is
 * `hasNetworkConfigToBeRemoved`, read after the save: the form opens the dialog
 * only when that names something. When it does, Skip: Register would write
 * DHCP's gateway and DNS into the network configuration as static values, and
 * every later run would then see no dialog at all.
 */
export async function answerGatewayDialog(page: Page, expected: boolean): Promise<void> {
  const gatewayDialog = defaultGatewayDialogLocators;
  if (!expected) {
    await expect(page.locator(gatewayDialog.title)).toHaveCount(0);
    return;
  }

  await expect(page.locator(gatewayDialog.title)).toBeVisible();
  await page.locator(gatewayDialog.skip).click();
  await expect(page.locator(gatewayDialog.title)).toBeHidden();
}

/** Opens an interface's action menu on the card. */
export async function openInterfaceActions(page: Page, name: string): Promise<void> {
  await page.locator(interfacesCardLocators.menu(name)).click();
  await expect(page.locator(interfacesCardLocators.edit(name))).toBeVisible();
}

/**
 * Revert Changes on the pending-changes card, through its confirmation, and
 * waits for the card to go: the page hides it only once `interface.rollback`
 * has answered.
 */
export async function revertNetworkChanges(page: Page): Promise<void> {
  await page.locator(pendingChangesLocators.revertChanges).click();
  await expect(page.locator(confirmDialogLocators.title)).toContainText('Revert Network Interface Changes');
  await confirmDestructiveAction(page);
  await expect(page.locator(pendingChangesLocators.revertChanges)).toBeHidden({ timeout: revertTimeoutMs });
}
