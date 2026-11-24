/**
 * Stories: an admin adds USB and PCI passthrough devices to a stopped VM from its Devices page. Saving only records
 * a device; the host claims it at start, and the PCI test checks host drivers before and after to show that. The
 * devices must be real: USB uses the first `vm.device.usb_passthrough_choices` ids, and PCI the first available,
 * non-critical `vm.device.passthrough_device_choices` entry with a unique label (the autocomplete keys on labels).
 * CI is itself a QEMU guest, so either test skips with middleware's answer when none is listed. Each device is
 * checked in `vm.device.query`.
 */
import {
  ensureVmAbsent, ensureVmPresent, findPassthroughCandidate, findUsbPassthroughIds, findVmDevices,
  pickUsbController, readPassthroughDrivers, requireVirtualization,
} from '../fixtures/virtual-machines';
import {
  addPciPassthroughFromDevicesPage, addUsbPassthroughFromDevicesPage, openVmDevices,
} from '../flows/virtual-machines';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API with no devices (`ensureVmPresent`). */
const vmName = 'e2e_vm_passthrough';

test.beforeEach(async ({ api }) => {
  await requireVirtualization(api);
  await ensureVmAbsent(api, vmName);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the VM ${vmName}`)) {
    return;
  }

  await runCleanupSteps([
    [`remove the VM "${vmName}"`, () => ensureVmAbsent(api, vmName)],
  ]);
});

test('an admin adds a USB passthrough device by vendor and product id', async ({ page, api }) => {
  const survey = await findUsbPassthroughIds(api);
  const customUsb = survey.ids;
  // Skipped, not failed, when the appliance has no USB device: that is the host's hardware, not
  // the form. The reason carries middleware's own answer, so a run records it.
  test.skip(
    !customUsb,
    `vm.device.usb_passthrough_choices lists no available device (listed: ${survey.listed.join(', ') || 'none'}).`,
  );
  if (!customUsb) {
    return;
  }

  const vmId = await ensureVmPresent(api, vmName);
  const controller = await pickUsbController(api);

  await openVmDevices(page, vmName, vmId);
  await addUsbPassthroughFromDevicesPage(page, { controllerLabel: controller.label, ...customUsb });

  const devices = await findVmDevices(api, vmId);
  expect(devices).toHaveLength(1);
  // Specify custom is saved as no host device, with the ids standing in for it.
  expect(devices[0]?.attributes).toMatchObject({
    dtype: 'USB',
    controller_type: controller.value,
    device: null,
    usb: { vendor_id: customUsb.vendorId, product_id: customUsb.productId },
  });

  await expect(page.locator(virtualMachinesLocators.devices.rowsOfType('USB'))).toHaveCount(1);
});

test('an admin adds a PCI passthrough device', async ({ page, api }) => {
  const survey = await findPassthroughCandidate(api);
  const { candidate } = survey;
  // Skipped, not failed, when the appliance has no device it could give a VM: that is the host's
  // hardware, not the form. The reason carries middleware's own answer, so a run records it.
  test.skip(
    !candidate,
    'vm.device.passthrough_device_choices lists no available, non-critical device with a label of its own '
    + `(iommu_enabled: ${survey.iommuEnabled}; listed: ${survey.listed.join(', ') || 'none'}).`,
  );
  if (!candidate) {
    return;
  }

  const vmId = await ensureVmPresent(api, vmName);

  await openVmDevices(page, vmName, vmId);
  await addPciPassthroughFromDevicesPage(page, candidate.label);

  const devices = await findVmDevices(api, vmId);
  expect(devices).toHaveLength(1);
  expect(devices[0]?.attributes).toMatchObject({ dtype: 'PCI', pptdev: candidate.id });
  await expect(page.locator(virtualMachinesLocators.devices.rowsOfType('PCI'))).toHaveCount(1);

  // Saving recorded the device and did not take it from the host: that only happens on a start.
  expect(await readPassthroughDrivers(api, candidate.id)).toEqual(candidate.drivers);
});
