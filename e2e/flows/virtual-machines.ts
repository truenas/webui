/**
 * Virtual machines, driven through the UI.
 */
import { expect, type Page } from '@playwright/test';
import { goToVirtualMachines } from './navigation';
import { selectFirstOption, selectOption } from './storage';
import { confirmDialogLocators, infoDialogLocators } from '../locators/dialogs';
import { jobDialogLocators } from '../locators/encryption';
import { virtualMachinesLocators } from '../locators/virtual-machines';

/**
 * The wizard's Save creates the VM and then each device, the disk's zvol among them, one call
 * after another. The edit form's Save is one call, as are the device form's and the device delete
 * dialog's. All of them get the same room.
 */
const saveTimeoutMs = 90_000;

/**
 * A ceiling on the `vm.stop` job. A guest with no operating system ignores the shutdown request,
 * so the job waits out the VM's whole shutdown timeout before it forces the machine off.
 */
const stopTimeoutMs = 120_000;

/** One attempt at a row action's click. Short, so a row that closed under it is opened again soon. */
const rowActionAttemptMs = 5_000;

/** A ceiling on a row action becoming clickable: the VM reaching the state that shows it. */
const rowActionTimeoutMs = 120_000;

/** What the wizard is told to make, whichever disk it gets. Everything else is left at its default. */
interface WizardVm {
  name: string;
  description: string;
  /** As typed into the size input, e.g. `1 GiB`. */
  memory: string;
  /**
   * With a password, Enable Display (VNC) stays ticked, on its default Bind of `0.0.0.0`, and this
   * is typed in. Without one, the display is turned off.
   */
  vncPassword?: string;
}

/** A VM on a new zvol, which the wizard creates. */
export interface NewVm extends WizardVm {
  /** The dataset the new zvol goes under, by full name. */
  datastore: string;
  /** As typed into the size input, e.g. `1 GiB`. */
  volsize: string;
  /**
   * A disk image file to import, by its full path. Import Image is ticked and this typed into
   * Image Source, so the wizard converts it into the new zvol before it creates the VM.
   */
  importImage?: string;
}

/** A VM on a zvol that already exists, which the wizard attaches and does not create. */
export interface VmOnExistingZvol extends WizardVm {
  /** The zvol's full name, `pool/…/zvol`. */
  existingZvol: string;
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
 * Opens the wizard from the sidebar and fills in its first two steps, leaving it on Disks.
 *
 * Start on Boot is turned off, since it would start the machine the next time the appliance boots.
 * The VNC display is turned off too unless `vncPassword` is given, because it opens a listening
 * port that only a journey about the display has a use for.
 */
export async function openVmWizardOnDisks(page: Page, vm: WizardVm): Promise<void> {
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
  if (vm.vncPassword === undefined) {
    await page.locator(wizard.enableVnc).click();
  } else {
    await expect(page.locator(wizard.enableVnc)).toBeChecked();
    await page.locator(wizard.vncPassword).fill(vm.vncPassword);
  }
  await goToNextWizardStep(page, wizard.name, wizard.memory);

  // CPU And Memory. Leaving the size input is part of the entry, as on the zvol form.
  await page.locator(wizard.memory).fill(vm.memory);
  await page.locator(wizard.memory).blur();
  await goToNextWizardStep(page, wizard.memory, wizard.datastore);
}

/**
 * On the wizard's Disks step, keeps Create new disk image and fills it in: Import Image when
 * `importImage` is given, then Zvol Location and Size.
 *
 * The image goes first. Its path is what Size is checked against, and leaving the size input is
 * part of the entry, as on the zvol form, so the check runs on the value finally typed.
 */
export async function fillNewDiskStep(
  page: Page,
  disk: Pick<NewVm, 'datastore' | 'volsize' | 'importImage'>,
): Promise<void> {
  const { wizard } = virtualMachinesLocators;

  if (disk.importImage !== undefined) {
    await page.locator(wizard.importImage).click();
    await expect(page.locator(wizard.importImage)).toBeChecked();
    const source = page.locator(wizard.imageSource);
    await source.fill(disk.importImage);
    await source.blur();
  }

  await selectOption(page, wizard.datastore, wizard.datastoreOption(disk.datastore));
  await page.locator(wizard.volsize).fill(disk.volsize);
  await page.locator(wizard.volsize).blur();
}

/**
 * Closes the wizard without saving, confirming the discard its unsaved steps ask for, and waits
 * for the panel to go.
 */
export async function discardVmWizard(page: Page): Promise<void> {
  const { wizard } = virtualMachinesLocators;
  await page.locator(wizard.closePanel).click();

  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(wizard.volsize)).toBeHidden();
}

/**
 * Creates a Linux VM with the wizard, from the sidebar, on a new zvol or an existing one, and
 * optionally from a disk image (`importImage`).
 *
 * See {@link openVmWizardOnDisks} for what the first step turns off. The NIC attaches to whichever
 * interface the appliance lists first, since a run cannot know their names.
 *
 * With an image, Save first creates the zvol and converts the image into it in a job dialog, and
 * only then creates the VM. A failed conversion sends the wizard back to Disks, which hides Save
 * just as closing the panel does, so with an image the caller's read-back of the VM is what tells
 * the two apart.
 */
export async function createVmWithWizard(page: Page, vm: NewVm | VmOnExistingZvol): Promise<void> {
  const { wizard } = virtualMachinesLocators;
  await openVmWizardOnDisks(page, vm);

  // Disks. Picking Existing swaps Zvol Location and Size for Select Existing Zvol.
  if ('existingZvol' in vm) {
    await page.locator(wizard.existingDisk).click();
    await selectOption(page, wizard.hddPath, wizard.hddPathOption(vm.existingZvol));
    await goToNextWizardStep(page, wizard.hddPath, wizard.nicAttach);
  } else {
    await fillNewDiskStep(page, vm);
    await goToNextWizardStep(page, wizard.volsize, wizard.nicAttach);
  }

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
 * Clicks one of a VM's row actions, opening the row first whenever it is closed.
 *
 * The list binds no `expansionKey`, so tn-table closes every open row each time `vm.query` reports
 * a change, and a start or a stop reports more than one, not all at once. A row opened between two
 * of them can close again before the click lands, so opening and clicking are retried as one step.
 *
 * The action only renders in the matching state (Stop while running, Start while stopped), so this
 * also waits for the row to reach that state. A row left open in the old state is closed by the
 * Name click and opened again on the next attempt.
 */
export async function clickVmRowAction(page: Page, name: string, action: string): Promise<void> {
  const button = page.locator(action);

  await expect(async () => {
    if (!(await button.isVisible())) {
      await page.locator(virtualMachinesLocators.row.name(name)).click();
    }
    await button.click({ timeout: rowActionAttemptMs });
  }).toPass({ timeout: rowActionTimeoutMs });
}

/**
 * Stops a running VM from its row, forcing it off once the shutdown timeout runs out.
 *
 * The Stop dialog runs the `vm.stop` job in a progress dialog, which closes itself, and then
 * reports "Finished" in an info dialog, which is closed here.
 */
export async function stopVmFromRow(page: Page, name: string, id: number): Promise<void> {
  const { stopDialog } = virtualMachinesLocators;

  await clickVmRowAction(page, name, virtualMachinesLocators.rowAction.stop(id));
  await expect(page.locator(stopDialog.title)).toBeVisible();
  await page.locator(stopDialog.forceAfterTimeout).click();
  await expect(page.locator(stopDialog.forceAfterTimeout)).toBeChecked();
  await page.locator(stopDialog.stop).click();

  const finished = page.locator(infoDialogLocators.title);
  await expect(finished).toBeVisible({ timeout: stopTimeoutMs });
  await page.locator(infoDialogLocators.close).click();
  await expect(finished).toBeHidden();
}

/**
 * Clicks Display in a running VM's row. What follows is the caller's to wait for: a new tab for a
 * SPICE web display, or a dialog saying how to connect for any other.
 */
export async function openVmDisplay(page: Page, name: string, id: number): Promise<void> {
  await expandVmRow(page, name, id);
  await clickVmRowAction(page, name, virtualMachinesLocators.rowAction.display(id));
}

/** Hard-resets a running VM from its row, through webui's shared confirm and its tick box. */
export async function resetVmFromRow(page: Page, name: string, id: number): Promise<void> {
  await clickVmRowAction(page, name, virtualMachinesLocators.rowAction.reset(id));
  await expect(page.locator(confirmDialogLocators.title)).toBeVisible();
  await page.locator(confirmDialogLocators.checkbox).click();
  await page.locator(confirmDialogLocators.confirm).click();
  await expect(page.locator(confirmDialogLocators.title)).toBeHidden();
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

/** What {@link addDisplayFromDevicesPage} fills in. */
export interface NewDisplay {
  type: 'SPICE' | 'VNC';
  /** An address `vm.device.bind_choices` lists, such as `0.0.0.0`. */
  bind: string;
  password: string;
  /** A resolution `vm.resolution_choices` lists, such as `1280x720`. */
  resolution: string;
  /**
   * Typed into Port. Middleware refuses a SPICE display whose two ports are both empty, since it
   * finds them equal, so a free one is given.
   */
  port: number;
  /** Typed into Web Port, which only SPICE shows. */
  webPort?: number;
}

/** Opens Add on the open Devices page and picks Display as the device type. */
async function startAddingDisplay(page: Page): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await page.locator(virtualMachinesLocators.devices.add).click();

  await expect(page.locator(form.deviceType)).toBeVisible();
  await selectOption(page, form.deviceType, form.deviceTypeOption('Display'));
}

/**
 * Adds a display from the open Devices page and waits for the panel to close.
 *
 * Web Interface is left at its default, ticked, which only SPICE shows.
 */
export async function addDisplayFromDevicesPage(page: Page, display: NewDisplay): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await startAddingDisplay(page);

  await selectOption(page, form.displayType, form.displayTypeOption(display.type));
  await selectOption(page, form.bind, form.bindOption(display.bind));
  await page.locator(form.password).fill(display.password);
  await selectOption(page, form.resolution, form.resolutionOption(display.resolution));
  await page.locator(form.port).fill(String(display.port));
  if (display.webPort !== undefined) {
    await page.locator(form.webPort).fill(String(display.webPort));
  }

  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Opens Add on the open Devices page, picks Display, and returns the labels of the display types
 * it offers. Then closes the panel without saving anything.
 *
 * The list is filled in from `vm.get_display_devices` after the form opens, so the first option
 * appearing is the sign it has arrived. The options are read in one go once it has. Picking the
 * first closes the list again; it is the type the form selected for itself when only one is left.
 *
 * Picking Display has edited the form, so the panel asks before it closes and the discard is
 * confirmed.
 */
export async function listOfferedDisplayTypes(page: Page): Promise<string[]> {
  const form = virtualMachinesLocators.deviceForm;
  await startAddingDisplay(page);

  await page.locator(form.displayType).click();
  const options = page.locator(form.displayTypeOptions);
  await expect(options.first()).toBeVisible();
  const labels = (await options.allInnerTexts()).map((label) => label.trim());
  await options.first().click();

  await page.locator(form.closePanel).click();
  const discard = page.locator(confirmDialogLocators.confirm);
  await expect(discard).toBeVisible();
  await discard.click();
  await expect(page.locator(form.deviceType)).toBeHidden();

  return labels;
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

/**
 * Opens Export to Image from a disk row's menu, and waits for the dialog to show the disk it is
 * exporting: `sourcePath`, the zvol's `/dev/zvol/…` path.
 */
export async function openExportDiskDialog(page: Page, disk: DeviceRow, sourcePath: string): Promise<void> {
  const dialog = virtualMachinesLocators.exportDiskDialog;
  await clickDeviceAction(page, disk, virtualMachinesLocators.devices.exportToImage(disk.id));

  await expect(page.locator(dialog.title)).toBeVisible();
  await expect(page.locator(dialog.sourceDisk)).toHaveText(sourcePath);
}

/**
 * Types a destination directory and an image name into the open export dialog. Leaving the
 * directory field is part of the entry, since that is when its value is checked.
 */
export async function fillExportDiskDialog(page: Page, destinationDir: string, imageName: string): Promise<void> {
  const dialog = virtualMachinesLocators.exportDiskDialog;
  const destination = page.locator(dialog.destinationDir);
  await destination.fill(destinationDir);
  await destination.blur();
  await page.locator(dialog.imageName).fill(imageName);
}

/**
 * Exports a disk from the open Devices page into `destinationDir` as `<imageName>.qcow2`, keeping
 * the default format, and waits for the dialog and the job dialog after it to go.
 *
 * Export closes the dialog at once and the page then runs `vm.device.convert` in a job dialog. A
 * small zvol converts in moments, so that dialog can be gone before it is looked for; whether the
 * file was written is the caller's to read back.
 */
export async function exportDiskFromDevicesPage(
  page: Page,
  disk: DeviceRow,
  sourcePath: string,
  destinationDir: string,
  imageName: string,
): Promise<void> {
  const dialog = virtualMachinesLocators.exportDiskDialog;
  await openExportDiskDialog(page, disk, sourcePath);
  await fillExportDiskDialog(page, destinationDir, imageName);

  await expect(page.locator(dialog.export)).toBeEnabled();
  await page.locator(dialog.export).click();
  await expect(page.locator(dialog.title)).toBeHidden();
  await expect(page.locator(jobDialogLocators.title)).toBeHidden({ timeout: saveTimeoutMs });
}

/** Opens Add on the open Devices page and picks a device type by its label in the Type select. */
async function startAddingDevice(page: Page, typeLabel: string): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await page.locator(virtualMachinesLocators.devices.add).click();

  await expect(page.locator(form.deviceType)).toBeVisible();
  await selectOption(page, form.deviceType, form.deviceTypeOption(typeLabel));
}

/** What {@link addUsbPassthroughFromDevicesPage} fills in. Middleware takes only a connected device's ids. */
export interface CustomUsbDevice {
  /** The Controller Type's label, as the select shows it. */
  controllerLabel: string;
  vendorId: string;
  productId: string;
}

/**
 * Adds a USB passthrough device from the open Devices page, by Specify custom with a vendor and
 * product id, and waits for the panel to close.
 */
export async function addUsbPassthroughFromDevicesPage(page: Page, usb: CustomUsbDevice): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await startAddingDevice(page, 'USB Passthrough Device');

  await selectOption(page, form.controllerType, form.controllerTypeOption(usb.controllerLabel));
  await selectOption(page, form.usbDevice, form.usbDeviceSpecifyCustom);
  await page.locator(form.vendorId).fill(usb.vendorId);
  await page.locator(form.productId).fill(usb.productId);

  await page.locator(form.save).click();
  await expect(page.locator(form.save)).toBeHidden({ timeout: saveTimeoutMs });
}

/**
 * Adds a PCI passthrough device from the open Devices page, by its label in the autocomplete, and
 * waits for the panel to close.
 *
 * The autocomplete only accepts one of its own options, and clicking the option is what commits
 * it: the typed text alone does not.
 *
 * Save asks first, in webui's shared confirm, for a device with no reset mechanism. That confirm
 * keeps its tick box, which has to be ticked before Confirm enables. It is accepted here, and a
 * device that has a reset mechanism goes straight through. The panel closing is the sign either
 * way: declining would leave it open.
 */
export async function addPciPassthroughFromDevicesPage(page: Page, label: string): Promise<void> {
  const form = virtualMachinesLocators.deviceForm;
  await startAddingDevice(page, 'PCI Passthrough Device');

  await page.locator(form.pptdev).fill(label);
  const option = page.locator(form.pptdevOption(label));
  await expect(option).toBeVisible();
  await option.click();

  const save = page.locator(form.save);
  const warning = page.locator(confirmDialogLocators.title);
  await save.click();
  // Whichever comes first: the warning, or the panel closing because there was none.
  await expect
    .poll(async () => await warning.isVisible() || !(await save.isVisible()), { timeout: saveTimeoutMs })
    .toBe(true);
  if (await warning.isVisible()) {
    await page.locator(confirmDialogLocators.checkbox).click();
    await expect(page.locator(confirmDialogLocators.confirm)).toBeEnabled();
    await page.locator(confirmDialogLocators.confirm).click();
  }
  await expect(save).toBeHidden({ timeout: saveTimeoutMs });
}
