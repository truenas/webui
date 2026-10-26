/**
 * The Interfaces card and the pending-changes card on System > Network, driven
 * through the UI.
 *
 * Staging and reverting are safe on any appliance. Test Changes and Save
 * Changes apply a staged edit to every NIC, the one the suite talks to
 * included, so only `network-interfaces-commit.e2e.ts` presses them, on an
 * appliance with a spare NIC. See `fixtures/interfaces.ts`.
 */
import { expect, type Page } from '@playwright/test';
import { saveInterface } from './ha';
import { goToNetwork } from './navigation';
import { confirmDestructiveAction, selectOption } from './storage';
import { confirmDialogLocators } from '../locators/dialogs';
import { haInterfaceLocators } from '../locators/ha';
import {
  defaultGatewayDialogLocators, interfaceFormLocators, interfacesCardLocators, pendingChangesLocators,
} from '../locators/network-interfaces';

/** `interface.rollback` re-reads the configuration middleware holds before it answers. */
const revertTimeoutMs = 60_000;

/** `interface.commit` and `interface.checkin` re-apply every interface before they answer. */
const commitTimeoutMs = 2 * 60_000;

/** One static address: the bare address and its prefix length. */
export interface StaticAddress {
  address: string;
  netmask: number;
}

export interface VlanSettings {
  name: string;
  description: string;
  /** The parent NIC's name, which is also its option's label. */
  parent: string;
  tag: number;
  /** Left out, the VLAN gets no address. */
  alias?: StaticAddress;
}

/**
 * Adds one static address to the open interface form. The form has no address
 * row while DHCP is on, so this picks static addresses first.
 */
export async function addStaticAddress(page: Page, { address, netmask }: StaticAddress): Promise<void> {
  const form = haInterfaceLocators.form;
  await page.locator(form.staticAddresses).click();
  await page.locator(form.addAddress).click();
  await page.locator(form.address).fill(address);
  await selectOption(page, form.netmask, form.netmaskOption(netmask));
}

/** Opens "Add Interface" from the card, starting from the sidebar. */
export async function openAddInterfaceForm(page: Page): Promise<void> {
  await goToNetwork(page);
  await page.locator(interfacesCardLocators.add).click();
  await expect(page.locator(interfaceFormLocators.type)).toBeVisible();
}

/**
 * Fills the open "Add Interface" form as a VLAN, with `alias` when given, and saves it.
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
  if (vlan.alias) {
    await addStaticAddress(page, vlan.alias);
  }

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

/**
 * Picks the open "Add Interface" form's type, and returns the name the form
 * filled in for it: the next free `brN`, `bondN` or `vlanN`. The type goes
 * before anything else is filled, since choosing it overwrites Name.
 */
export async function chooseInterfaceType(
  page: Page,
  label: 'Bridge' | 'Link Aggregation' | 'VLAN',
): Promise<string> {
  const form = interfaceFormLocators;
  await selectOption(page, form.type, form.typeOption(label));
  await expect(page.locator(form.name)).not.toHaveValue('');

  return page.locator(form.name).inputValue();
}

/** Opens one of the form's selects, so its options can be read and clicked. */
export async function openFormSelect(page: Page, select: string): Promise<void> {
  await page.locator(select).click();
}

/**
 * Closes an open select without picking anything; a multiple one stays open
 * between clicks and needs this too. Escape is what closes it. The side panel
 * also closes on Escape, so the name field is asserted still there: a panel that
 * took the key would fail here, not at Save.
 */
export async function closeFormSelect(page: Page, options: string): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.locator(options)).toHaveCount(0);
  await expect(page.locator(interfaceFormLocators.name)).toBeVisible();
}

/**
 * Fills the open "Add Interface" form as a bridge over `members`, with `alias`
 * when given and Enable Learning left as it is, and saves it. An empty
 * `members` leaves the select untouched: middleware accepts a bridge with none.
 */
export async function addBridge(
  page: Page,
  { description, members, alias }: { description: string; members: string[]; alias?: StaticAddress },
): Promise<void> {
  const form = interfaceFormLocators;
  await page.locator(form.description).fill(description);

  if (members.length > 0) {
    await openFormSelect(page, form.bridgeMembers);
    for (const member of members) {
      await page.locator(form.bridgeMemberOption(member)).click();
    }
    await closeFormSelect(page, form.bridgeMembersOptions);
  }
  if (alias) {
    await addStaticAddress(page, alias);
  }

  await saveInterface(page, false);
}

/**
 * Fills the open "Add Interface" form, already set to Link Aggregation, as a
 * FAILOVER LAGG over `ports`, and saves it. FAILOVER shows its ports as an
 * ordered list of switches rather than a select, and the order is the failover
 * order.
 */
export async function addFailoverLagg(page: Page, ports: string[]): Promise<void> {
  const form = interfaceFormLocators;
  await selectOption(page, form.lagProtocol, form.lagProtocolOption('FAILOVER'));
  await expect(page.locator(form.lagPorts)).toHaveCount(0);

  for (const port of ports) {
    await page.locator(form.lagFailoverPort(port)).click();
    await expect(page.locator(form.lagFailoverPortCheckbox(port))).toBeChecked();
  }

  await saveInterface(page, false);
}

/**
 * Test Changes on the pending-changes card, with `checkinTimeoutSeconds` in its
 * field, through the Confirm box. Waits for the commit to land: Save Changes
 * replaces Test Changes once `interface.commit` has answered.
 */
export async function testNetworkChanges(page: Page, checkinTimeoutSeconds: number): Promise<void> {
  const pending = pendingChangesLocators;
  await page.locator(pending.checkinTimeout).fill(String(checkinTimeoutSeconds));
  await page.locator(pending.testChanges).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await confirmDestructiveAction(page);

  await expect(page.locator(pending.saveChanges)).toBeVisible({ timeout: commitTimeoutMs });
}

/**
 * Save Changes while a commit waits for its check-in, and the box that follows.
 * The box has no Confirm checkbox. Waits for the pending-changes card to go,
 * which it does once `interface.checkin` has answered.
 */
export async function saveNetworkChanges(page: Page): Promise<void> {
  const pending = pendingChangesLocators;
  await page.locator(pending.saveChanges).click();
  await expect(page.locator(confirmDialogLocators.confirm)).toBeVisible();
  await page.locator(confirmDialogLocators.confirm).click();

  await expect(page.locator(pending.saveChanges)).toBeHidden({ timeout: commitTimeoutMs });
  await expect(page.locator(pending.revertChanges)).toBeHidden();
}

/** Opens an existing interface's "Edit Interface" from the card, starting from the sidebar. */
export async function openEditInterfaceForm(page: Page, name: string): Promise<void> {
  await goToNetwork(page);
  await openInterfaceActions(page, name);
  await page.locator(interfacesCardLocators.edit(name)).click();
  await expect(page.locator(interfaceFormLocators.name)).toHaveValue(name);
}

/** Closes the interface form without saving. A pristine form asks nothing on the way out. */
export async function closeInterfaceForm(page: Page): Promise<void> {
  await page.locator(interfaceFormLocators.closePanel).click();
  await expect(page.locator(interfaceFormLocators.name)).toBeHidden();
}

/**
 * Delete from an interface's menu on the card, through "Delete Interface" and
 * its Confirm box. Waits for the dialog to go, which it does once
 * `interface.delete` has answered.
 */
export async function deleteInterfaceFromCard(page: Page, name: string): Promise<void> {
  await openInterfaceActions(page, name);
  await page.locator(interfacesCardLocators.delete(name)).click();
  await expect(page.locator(confirmDialogLocators.title)).toHaveText('Delete Interface');
  await confirmDestructiveAction(page);
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
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
