/**
 * Virtual machines, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToVirtualMachines } from './navigation';
import { selectFirstOption, selectOption } from './storage';
import { virtualMachinesLocators } from '../locators/virtual-machines';

/**
 * The wizard's Save creates the VM and then each device, the disk's zvol among them, one call
 * after another. The edit form's Save is one call, as are the device form's and the device delete
 * dialog's. All of them get the same room.
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

/**
 * Clones a VM from its row, under `cloneName` or, when that is omitted, under whatever name
 * middleware picks, and waits for the dialog to go. A refused `vm.clone` leaves it open.
 */
export async function cloneVmFromList(page: Page, name: string, id: number, cloneName?: string): Promise<void> {
  const { cloneDialog } = virtualMachinesLocators;

  await expandVmRow(page, name, id);
  await page.locator(virtualMachinesLocators.rowAction.clone(id)).click();
  await expect(page.locator(cloneDialog.title)).toBeVisible();

  if (cloneName) {
    await page.locator(cloneDialog.name).fill(cloneName);
  }
  await page.locator(cloneDialog.clone).click();
  await expect(page.locator(cloneDialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens a VM's Devices page from its row, from the sidebar.
 *
 * Waits on Add, which the page header always renders, as the sign the page has loaded.
 */
export async function openVmDevices(page: Page, name: string, id: number): Promise<void> {
  await expandVmRow(page, name, id);
  await page.locator(virtualMachinesLocators.rowAction.devices(id)).click();
  await expect(page.locator(virtualMachinesLocators.devices.add)).toBeVisible();
}

/** A row of the Devices list, by what it is keyed on, and the device it shows. */
export interface DeviceRow {
  /** The device's id, which keys the row's menu items. */
  id: number;
  dtype: string;
  order: number;
}

/**
 * Opens a device row's actions menu and clicks one of its items.
 *
 * The menu trigger has the same id on every row, so it is reached through the row. Each item is
 * keyed by the device id, so the click cannot land on another device's item.
 */
async function clickDeviceAction(page: Page, device: DeviceRow, item: string): Promise<void> {
  const { devices } = virtualMachinesLocators;
  await page.locator(devices.row(device.dtype, device.order)).locator(devices.actions).click();
  await page.locator(item).click();
}

/**
 * Adds a NIC from the open Devices page and returns the MAC address it was saved with.
 *
 * Picking NIC as the type fills the MAC in by itself, so Generate is pressed after that, and the
 * field must change for the press to count. The NIC attaches to whichever interface the appliance
 * lists first, since a run cannot know their names.
 */
export async function addNicFromDevicesPage(page: Page, adapterLabel: string): Promise<string> {
  const form = virtualMachinesLocators.deviceForm;
  await page.locator(virtualMachinesLocators.devices.add).click();

  await expect(page.locator(form.deviceType)).toBeVisible();
  await selectOption(page, form.deviceType, form.deviceTypeOption('NIC'));

  const mac = page.locator(form.mac);
  await expect(mac).not.toHaveValue('');
  const filledIn = await mac.inputValue();
  await page.locator(form.generateMac).click();
  await expect(mac).not.toHaveValue(filledIn);

  await selectOption(page, form.nicType, form.nicTypeOption(adapterLabel));
  await selectFirstOption(page, form.nicAttach, form.nicAttachOptions);
  const generated = await mac.inputValue();

  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
  return generated;
}

/**
 * Changes a NIC's adapter type through its row's Edit, and waits for the panel to close.
 *
 * The form fills itself from the device, so the NIC's own MAC being in the field is the sign it
 * has loaded.
 */
export async function changeNicType(page: Page, nic: DeviceRow, mac: string, adapterLabel: string): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await clickDeviceAction(page, nic, virtualMachinesLocators.devices.edit(nic.id));
  await expect(page.locator(form.mac)).toHaveValue(mac);

  await selectOption(page, form.nicType, form.nicTypeOption(adapterLabel));
  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Deletes a device through its row's Delete, and waits for the dialog to go.
 *
 * With `zvolName`, "Delete zvol device" is ticked and that name typed into the confirmation, so the
 * disk's zvol goes too. Without it, nothing is ticked. Force is never ticked: the VM is stopped.
 */
export async function deleteDeviceFromList(page: Page, device: DeviceRow, zvolName?: string): Promise<void> {
  const dialog = virtualMachinesLocators.deleteDeviceDialog;
  await clickDeviceAction(page, device, virtualMachinesLocators.devices.delete(device.id));
  await expect(page.locator(dialog.title)).toBeVisible();

  if (zvolName) {
    await page.locator(dialog.zvol).click();
    await page.locator(dialog.zvolConfirm).fill(zvolName);
  }

  await expect(page.locator(dialog.delete)).toBeEnabled();
  await page.locator(dialog.delete).click();
  await expect(page.locator(dialog.title)).toBeHidden({ timeout: saveTimeoutMs });
}
