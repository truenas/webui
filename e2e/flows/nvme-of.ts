/**
 * NVMe-oF, driven through the UI.
 *
 * Everything starts from the NVMe-oF Subsystems card on the Shares dashboard: its
 * Add opens the Add Subsystem form, a row's View opens that subsystem's details
 * page, a row's Delete removes it, and the card's title opens the full page whose
 * header holds Global Configuration.
 */
import { expect, type Page } from '@playwright/test';
import { goToShares } from './navigation';
import { formSettleTimeoutMs } from './smb';
import { selectOption } from './storage';
import type { TcpPort } from '../fixtures/nvme-of';
import { confirmDialogLocators } from '../locators/dialogs';
import { nvmeOfLocators } from '../locators/nvme-of';

/** The add form makes one call per namespace, port and host after the subsystem, then asks about the service. */
const saveTimeoutMs = 90_000;

/** What the add form is told to make. Ports and hosts are existing ones, picked from the Add menus. */
export interface NvmeOfSubsystemForm {
  name: string;
  /** The zvol for the one namespace, as `pool/child`. */
  zvol: string;
  port: TcpPort;
  hostnqn: string;
}

/** Opens a menu behind an Add button and picks one item from it. */
async function pickFromAddMenu(page: Page, trigger: string, item: string): Promise<void> {
  await expect(page.locator(trigger)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(trigger).click();
  await expect(page.locator(item)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(item).click();
}

/**
 * Types a zvol into the namespace form's picker and leaves it, which is what hands
 * the value to the form — see `fillNfsSharePath`.
 */
async function fillZvolPath(page: Page, zvol: string): Promise<void> {
  const devicePath = page.locator(nvmeOfLocators.namespaceForm.devicePath);
  await expect(devicePath).toBeVisible({ timeout: formSettleTimeoutMs });
  await devicePath.fill(`/dev/zvol/${zvol}`);
  await devicePath.blur();
}

/**
 * Creates a subsystem with the Add Subsystem form from the dashboard card: one zvol
 * namespace, only the named host allowed, listening on the named port.
 *
 * Declines the offer to start the service at the end: service state is global, and
 * the offer only appears while the service is stopped, which every caller
 * establishes in `beforeEach`.
 */
export async function createNvmeOfSubsystem(page: Page, subsystem: NvmeOfSubsystemForm): Promise<void> {
  const { card, addForm, namespaceForm } = nvmeOfLocators;
  await goToShares(page);

  await expect(page.locator(card.add)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(card.add).click();

  // What To Share.
  await expect(page.locator(addForm.name)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(addForm.name).fill(subsystem.name);

  // The namespace panel stacks over this one, and both render a `button-save`:
  // this form's own, in its Access step, and the panel's footer. The panel is the
  // later of the two in the page, so the last match is the one in front.
  await page.locator(addForm.addNamespace).click();
  await fillZvolPath(page, subsystem.zvol);
  const namespaceSave = page.locator(namespaceForm.save).last();
  await expect(namespaceSave).toBeEnabled({ timeout: formSettleTimeoutMs });
  await namespaceSave.click();
  await expect(page.locator(namespaceForm.devicePath)).toBeHidden({ timeout: formSettleTimeoutMs });

  await expect(page.locator(addForm.next)).toBeEnabled();
  await page.locator(addForm.next).click();

  // Access.
  await expect(page.locator(addForm.allowAnyHost)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(addForm.allowAnyHost).uncheck();
  await pickFromAddMenu(page, nvmeOfLocators.addHost, nvmeOfLocators.addHostOption(subsystem.hostnqn));
  await pickFromAddMenu(page, nvmeOfLocators.addPort, nvmeOfLocators.addPortOption(subsystem.port));

  const declineStart = page.locator(nvmeOfLocators.declineStartService);
  await expect(page.locator(addForm.save)).toBeEnabled();
  await page.locator(addForm.save).click();
  await expect(declineStart).toBeVisible({ timeout: saveTimeoutMs });
  await declineStart.click();

  await expect(page.locator(addForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens a subsystem's row menu on the dashboard card and clicks one of its items. */
async function openFromCardRow(page: Page, name: string, item: string): Promise<void> {
  await goToShares(page);

  const trigger = page.locator(nvmeOfLocators.card.rowMenu(name));
  await expect(trigger).toBeVisible({ timeout: formSettleTimeoutMs });
  await trigger.click();
  await page.locator(item).click();
}

/** Opens a subsystem's details page through View on its dashboard card row. */
export async function openNvmeOfSubsystemDetails(page: Page, name: string): Promise<void> {
  await openFromCardRow(page, name, nvmeOfLocators.card.rowMenuView(name));

  await expect(page.locator(nvmeOfLocators.details.name)).toHaveText(name, { timeout: formSettleTimeoutMs });
}

/**
 * Deletes a subsystem from its row menu on the dashboard card, ticking Force, and
 * waits for its row to go.
 */
export async function deleteNvmeOfSubsystemFromCard(page: Page, name: string): Promise<void> {
  const { card, deleteDialog } = nvmeOfLocators;
  await openFromCardRow(page, name, card.rowMenuDelete(name));

  await expect(page.locator(deleteDialog.force)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(deleteDialog.force).check();
  await page.locator(deleteDialog.delete).click();

  await expect(page.locator(card.row(name))).toBeHidden({ timeout: saveTimeoutMs });
}

/** On the details page: adds a namespace on a zvol (`pool/child`) through the namespace form. */
export async function addNamespaceOnDetails(page: Page, zvol: string): Promise<void> {
  await page.locator(nvmeOfLocators.details.addNamespace).click();
  await fillZvolPath(page, zvol);

  const save = page.locator(nvmeOfLocators.namespaceForm.save);
  await expect(save).toBeEnabled({ timeout: formSettleTimeoutMs });
  await save.click();
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
}

/** On the details page: deletes a namespace, by the path middleware stores for it. */
export async function deleteNamespaceOnDetails(page: Page, devicePath: string): Promise<void> {
  const { details } = nvmeOfLocators;
  await page.locator(details.deleteNamespace(devicePath)).click();
  await page.locator(details.confirmDeleteNamespace).click();

  await expect(page.locator(details.deleteNamespace(devicePath))).toBeHidden({ timeout: saveTimeoutMs });
}

/** On the details page: links an existing port from the Ports card's Add menu. */
export async function addPortOnDetails(page: Page, port: TcpPort): Promise<void> {
  await pickFromAddMenu(page, nvmeOfLocators.addPort, nvmeOfLocators.addPortOption(port));

  await expect(page.locator(nvmeOfLocators.details.removePort(port))).toBeVisible({ timeout: saveTimeoutMs });
}

/** On the details page: unlinks a port. */
export async function removePortOnDetails(page: Page, port: TcpPort): Promise<void> {
  const remove = page.locator(nvmeOfLocators.details.removePort(port));
  await remove.click();

  await expect(remove).toBeHidden({ timeout: saveTimeoutMs });
}

/** On the details page: links an existing host from the Associated Hosts card's Add menu. */
export async function addHostOnDetails(page: Page, hostnqn: string): Promise<void> {
  await pickFromAddMenu(page, nvmeOfLocators.addHost, nvmeOfLocators.addHostOption(hostnqn));

  await expect(page.locator(nvmeOfLocators.details.host(hostnqn))).toBeVisible({ timeout: saveTimeoutMs });
}

/** On the details page: unlinks a host. */
export async function removeHostOnDetails(page: Page, hostnqn: string): Promise<void> {
  await page.locator(nvmeOfLocators.details.removeHost(hostnqn)).click();

  await expect(page.locator(nvmeOfLocators.details.host(hostnqn))).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * On the details page: creates a host through Create New in the Associated Hosts
 * card's Add menu, with Require Host Authentication on and a key the form generates.
 *
 * The menu, rather than a bare Add button, is guaranteed only while the subsystem
 * does not allow any host: then the menu also offers "Allow all hosts".
 */
export async function createAuthenticatedHostOnDetails(page: Page, hostnqn: string): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await pickFromAddMenu(page, nvmeOfLocators.addHost, nvmeOfLocators.createNewHost);

  await expect(page.locator(hostForm.hostnqn)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(hostForm.hostnqn).fill(hostnqn);
  await page.locator(hostForm.requireAuthentication).check();

  // The key arrives from `nvmet.host.generate_key` after the click; saving before
  // it lands would save a host with no key.
  await page.locator(hostForm.generateHostKey).click();
  await expect(page.locator(hostForm.hostKey)).toHaveValue(/^DHHC-1:/, { timeout: formSettleTimeoutMs });

  await page.locator(hostForm.save).click();
  await expect(page.locator(hostForm.save)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(nvmeOfLocators.details.host(hostnqn))).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * On the details page: opens the port form through Create New in the Ports card's
 * Add menu, and waits for it.
 *
 * The Add button is a menu only while some port exists; a test opening this has
 * always provisioned one.
 */
export async function openNewPortFormOnDetails(page: Page): Promise<void> {
  await pickFromAddMenu(page, nvmeOfLocators.addPort, nvmeOfLocators.createNewPort);

  await expect(page.locator(nvmeOfLocators.portForm.serviceId)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * In the port form Create New opened: sets the service id and picks the address,
 * keeping the transport it opened on, then saves. Waits for the panel to close and
 * for the Ports card to list the new port, which the card links after the create.
 */
export async function saveNewTcpPortOnDetails(page: Page, port: TcpPort): Promise<void> {
  const { portForm } = nvmeOfLocators;
  await page.locator(portForm.serviceId).fill(String(port.port));
  await selectOption(page, portForm.address, portForm.addressOption(port.address));

  await expect(page.locator(portForm.save)).toBeEnabled();
  await page.locator(portForm.save).click();
  await expect(page.locator(portForm.save)).toBeHidden({ timeout: saveTimeoutMs });
  await expect(page.locator(nvmeOfLocators.details.removePort(port))).toBeVisible({ timeout: saveTimeoutMs });
}

/**
 * On the details page: opens Manage Ports from the Ports card's Add menu.
 *
 * The Add button is a menu only while some port exists; a test opening this has
 * always provisioned one.
 */
export async function openManagePorts(page: Page): Promise<void> {
  await pickFromAddMenu(page, nvmeOfLocators.addPort, nvmeOfLocators.managePorts);

  await expect(page.locator(nvmeOfLocators.manageDialog.title)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/**
 * On the details page: opens Manage Hosts from the Associated Hosts card's Add menu.
 *
 * The Add button is a menu only while some host exists or the subsystem is
 * restricted to its hosts; a test opening this has always provisioned one.
 */
export async function openManageHosts(page: Page): Promise<void> {
  await pickFromAddMenu(page, nvmeOfLocators.addHost, nvmeOfLocators.manageHosts);

  await expect(page.locator(nvmeOfLocators.manageDialog.title)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/** Closes whichever Manage dialog is open, back to the details page. */
export async function closeManageDialog(page: Page): Promise<void> {
  const { manageDialog } = nvmeOfLocators;
  await page.locator(manageDialog.close).click();

  await expect(page.locator(manageDialog.title)).toBeHidden({ timeout: formSettleTimeoutMs });
}

/**
 * In Manage Ports: opens Edit on a TCP port, changes only its service id, and saves.
 *
 * Address is left as it loaded. Its select lists only the appliance's static IPs,
 * but `tn-select` keeps a value that is not among its options, so a port on
 * `0.0.0.0` is saved back on `0.0.0.0`.
 */
export async function changeManagedPortServiceId(page: Page, port: TcpPort, serviceId: number): Promise<void> {
  const { managePortsDialog, portForm } = nvmeOfLocators;
  await page.locator(managePortsDialog.edit(port)).click();

  // The form patches the port in on init; typing before that would be overwritten.
  const serviceIdInput = page.locator(portForm.serviceId);
  await expect(serviceIdInput).toHaveValue(String(port.port), { timeout: formSettleTimeoutMs });
  await serviceIdInput.fill(String(serviceId));

  await page.locator(portForm.save).click();
  await expect(page.locator(portForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/** In Manage Hosts: opens Edit on a host and waits for the form to hold it. */
export async function openManagedHostEdit(page: Page, hostnqn: string): Promise<void> {
  await page.locator(nvmeOfLocators.manageHostsDialog.edit(hostnqn)).click();

  await expect(page.locator(nvmeOfLocators.hostForm.hostnqn)).toHaveValue(hostnqn, { timeout: formSettleTimeoutMs });
}

/** In the open host form: turns on Require Host Authentication and generates both keys. */
export async function generateHostKeys(page: Page): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await page.locator(hostForm.requireAuthentication).check();

  // Each key arrives from `nvmet.host.generate_key` after its click; saving before
  // it lands would save without it.
  await page.locator(hostForm.generateHostKey).click();
  await expect(page.locator(hostForm.hostKey)).toHaveValue(/^DHHC-1:/, { timeout: formSettleTimeoutMs });
  await page.locator(hostForm.generateTrueNasKey).click();
  await expect(page.locator(hostForm.trueNasKey)).toHaveValue(/^DHHC-1:/, { timeout: formSettleTimeoutMs });
}

/** Saves the open host form and waits for its panel to close. */
export async function saveHostForm(page: Page): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await page.locator(hostForm.save).click();
  await expect(page.locator(hostForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * In the open host form: sets the description, turns on Require Host Authentication,
 * generates both keys, and saves.
 */
export async function saveHostWithGeneratedKeys(page: Page, description: string): Promise<void> {
  await page.locator(nvmeOfLocators.hostForm.description).fill(description);
  await generateHostKeys(page);
  await saveHostForm(page);
}

/**
 * In the open host form, with Diffie–Hellman ticked: picks a DH group.
 *
 * DH Group is an inline editable, so the select is not on screen until the readout is
 * clicked. The editable closes itself on the next click outside it, which is Save.
 */
export async function pickHostDhGroup(page: Page, group: string): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await page.locator(hostForm.dhGroupValue).click();
  await expect(page.locator(hostForm.dhGroup)).toBeVisible({ timeout: formSettleTimeoutMs });
  await selectOption(page, hostForm.dhGroup, hostForm.dhGroupOption(group));
}

/** Closes the host form unchanged. Nothing was edited, so the panel asks nothing. */
export async function closeHostForm(page: Page): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await page.locator(hostForm.closePanel).click();
  await expect(page.locator(hostForm.hostnqn)).toBeHidden({ timeout: formSettleTimeoutMs });
}

/**
 * In the open host form: replaces the Host NQN, leaves the field so it is validated,
 * and presses Enter in it — a submit attempt, so a check that nothing was saved
 * afterwards means something.
 */
export async function tryHostNqn(page: Page, hostnqn: string): Promise<void> {
  const field = page.locator(nvmeOfLocators.hostForm.hostnqn);
  await field.fill(hostnqn);
  await field.press('Enter');
  await field.blur();
}

/** Closes the host form without saving. It has been edited, so the panel asks first. */
export async function discardHostForm(page: Page): Promise<void> {
  const { hostForm } = nvmeOfLocators;
  await page.locator(hostForm.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible({ timeout: formSettleTimeoutMs });
  await discard.click();
  await expect(page.locator(hostForm.hostnqn)).toBeHidden({ timeout: formSettleTimeoutMs });
}

/** In a Manage dialog: clicks a row's Delete and waits for the delete dialog. */
export async function openPortOrHostDelete(page: Page, deleteButton: string): Promise<void> {
  await page.locator(deleteButton).click();

  await expect(page.locator(nvmeOfLocators.portOrHostDeleteDialog.title)).toBeVisible({
    timeout: formSettleTimeoutMs,
  });
}

/** In the open delete dialog: confirms, and waits for the row it was opened from to go. */
export async function confirmPortOrHostDelete(page: Page, row: string): Promise<void> {
  const { portOrHostDeleteDialog } = nvmeOfLocators;
  await page.locator(portOrHostDeleteDialog.delete).click();

  await expect(page.locator(portOrHostDeleteDialog.title)).toBeHidden({ timeout: formSettleTimeoutMs });
  await expect(page.locator(row)).toBeHidden({ timeout: saveTimeoutMs });
}

/** In the open delete dialog: cancels. */
export async function cancelPortOrHostDelete(page: Page): Promise<void> {
  const { portOrHostDeleteDialog } = nvmeOfLocators;
  await page.locator(portOrHostDeleteDialog.cancel).click();

  await expect(page.locator(portOrHostDeleteDialog.title)).toBeHidden({ timeout: formSettleTimeoutMs });
}

/** Opens the NVMe-oF Global Configuration from the full page the dashboard card's title leads to. */
export async function openNvmeOfGlobalConfiguration(page: Page): Promise<void> {
  await goToShares(page);

  await expect(page.locator(nvmeOfLocators.card.openFullPage)).toBeVisible({ timeout: formSettleTimeoutMs });
  await page.locator(nvmeOfLocators.card.openFullPage).click();
  await page.locator(nvmeOfLocators.page.globalConfiguration).click();

  await expect(page.locator(nvmeOfLocators.globalConfig.basenqn)).toBeVisible({ timeout: formSettleTimeoutMs });
}

/** In the open Global Configuration: sets the base NQN and saves. */
export async function saveNvmeOfBaseNqn(page: Page, basenqn: string): Promise<void> {
  const { globalConfig } = nvmeOfLocators;
  // The form patches in the saved config once it loads; filling before that would be overwritten.
  await expect(page.locator(globalConfig.basenqn)).not.toHaveValue('', { timeout: formSettleTimeoutMs });
  await page.locator(globalConfig.basenqn).fill(basenqn);

  await page.locator(globalConfig.save).click();
  await expect(page.locator(globalConfig.save)).toBeHidden({ timeout: saveTimeoutMs });
}
