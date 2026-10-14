/**
 * Virtual machines, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToVirtualMachines } from './navigation';
import { selectFirstOption, selectOption } from './storage';
import { virtualMachinesLocators } from '../locators/virtual-machines';

/**
 * The wizard's Save creates the VM and then each device, the disk's zvol among them, one call
 * after another. The edit form's Save is one call. Both get the same room.
 */
const saveTimeoutMs = 90_000;

/** What the wizard is told to make. Everything else is left at its default. */
export interface NewVm {
  name: string;
  description: string;
  /** As typed into the size input, e.g. `1 GiB`. */
  memory: string;
  /** The dataset the new zvol goes under, by full name. */
  datastore: string;
  /** As typed into the size input, e.g. `1 GiB`. */
  volsize: string;
}

/**
 * Leaves the current wizard step for the next one.
 *
 * Every step has a Next with the same id, so `current` is a field of the step being left and
 * `next` one of the step being entered. Exactly one Next may be visible when it is clicked: the
 * collapsed steps keep theirs in the page, hidden, and two visible would mean a step had not
 * finished collapsing. Next is disabled until the step is valid, which is the first thing to fail
 * when a value typed into it did not reach the form.
 */
async function goToNextWizardStep(page: Page, current: string, next: string): Promise<void> {
  const { wizard } = virtualMachinesLocators;
  const visibleNext = page.locator(wizard.next).filter({ visible: true });

  await expect(page.locator(current)).toBeVisible();
  await expect(visibleNext).toHaveCount(1);
  await expect(visibleNext).toBeEnabled();
  await visibleNext.click();
  await expect(page.locator(next)).toBeVisible();
}

/**
 * Creates a Linux VM with the wizard, from the sidebar, on a new disk.
 *
 * Start on Boot and the VNC display are both turned off. The first would start the machine the
 * next time the appliance boots, and the second opens a listening port that nothing here uses.
 * The NIC attaches to whichever interface the appliance lists first, since a run cannot know
 * their names.
 */
export async function createVmWithWizard(page: Page, vm: NewVm): Promise<void> {
  const { wizard } = virtualMachinesLocators;
  await goToVirtualMachines(page);
  await page.locator(virtualMachinesLocators.add).click();

  // Operating System. Picking the OS resets the memory and disk size to its defaults, so it
  // goes first and those two are set on their own steps afterwards.
  await expect(page.locator(wizard.os)).toBeVisible();
  await selectOption(page, wizard.os, wizard.osOption('Linux'));
  await page.locator(wizard.name).fill(vm.name);
  await page.locator(wizard.description).fill(vm.description);
  await page.locator(wizard.autostart).click();
  await page.locator(wizard.enableVnc).click();
  await goToNextWizardStep(page, wizard.name, wizard.memory);

  // CPU And Memory. Leaving the size input is part of the entry, as on the zvol form.
  await page.locator(wizard.memory).fill(vm.memory);
  await page.locator(wizard.memory).blur();
  await goToNextWizardStep(page, wizard.memory, wizard.datastore);

  // Disks.
  await selectOption(page, wizard.datastore, wizard.datastoreOption(vm.datastore));
  await page.locator(wizard.volsize).fill(vm.volsize);
  await page.locator(wizard.volsize).blur();
  await goToNextWizardStep(page, wizard.volsize, wizard.nicAttach);

  // Network Interface.
  await selectFirstOption(page, wizard.nicAttach, wizard.nicAttachOptions);
  await goToNextWizardStep(page, wizard.nicAttach, wizard.uploadImage);

  // Installation Media and GPU. Nothing on either is required.
  await goToNextWizardStep(page, wizard.uploadImage, wizard.hideFromMsr);
  await goToNextWizardStep(page, wizard.hideFromMsr, wizard.save);

  // Confirm Options. The panel closing is the app's own signal that every call succeeded.
  await page.locator(wizard.save).click();
  await expect(page.locator(wizard.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Expands a VM's row to reveal its actions, from the sidebar.
 *
 * Clicks the Name cell, never the row as a whole: the row also holds the Running toggle, and a
 * click that landed there would start the machine.
 *
 * Waits on Edit, which every VM's detail row renders, as the sign the row has really opened.
 */
export async function expandVmRow(page: Page, name: string, id: number): Promise<void> {
  await goToVirtualMachines(page);
  await page.locator(virtualMachinesLocators.row.name(name)).click();
  await expect(page.locator(virtualMachinesLocators.rowAction.edit(id))).toBeVisible();
}

/**
 * Opens the Edit VM form for a VM.
 *
 * The form fills itself from the row it was opened on, so the name already being in its field is
 * the sign it has loaded.
 */
export async function openEditVmForm(page: Page, name: string, id: number): Promise<void> {
  await expandVmRow(page, name, id);
  await page.locator(virtualMachinesLocators.rowAction.edit(id)).click();
  await expect(page.locator(virtualMachinesLocators.editForm.name)).toHaveValue(name);
}

/** Saves the open Edit VM form and waits for the panel to close. A refusal leaves it open. */
export async function saveEditVmForm(page: Page): Promise<void> {
  await page.locator(virtualMachinesLocators.editForm.save).click();
  await expect(page.locator(virtualMachinesLocators.editForm.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a VM from its row, typing its name into the confirmation, and waits for the dialog to go.
 *
 * "Delete Virtual Machine Data?" and "Force Delete?" are both left unticked.
 */
export async function deleteVmFromList(page: Page, name: string, id: number): Promise<void> {
  const { deleteDialog } = virtualMachinesLocators;

  await expandVmRow(page, name, id);
  await page.locator(virtualMachinesLocators.rowAction.delete(id)).click();
  await expect(page.locator(deleteDialog.title)).toBeVisible();

  await page.locator(deleteDialog.confirmName).fill(name);
  await expect(page.locator(deleteDialog.delete)).toBeEnabled();
  await page.locator(deleteDialog.delete).click();
  await expect(page.locator(deleteDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}
