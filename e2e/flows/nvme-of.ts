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
import type { TcpPort } from '../fixtures/nvme-of';
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
