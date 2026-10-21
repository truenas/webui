/**
 * Stories: an admin adds a USB passthrough device and a PCI passthrough device to a stopped
 * virtual machine from its Devices page, and the appliance holds what they did.
 *
 * No test starts the VM. Saving a passthrough device only records it: the host device is claimed
 * when the machine starts, so a stopped VM can carry one without the appliance losing anything.
 * The PCI test reads the device's host drivers before and after, to show that holds.
 *
 * The USB device is given by vendor and product id through Specify custom. Middleware refuses ids
 * no connected device has, so they are the first available device's that
 * `vm.device.usb_passthrough_choices` lists; when it lists none, the USB test is skipped and says
 * what middleware answered. The PCI device has to be a real one too: the first that
 * `vm.device.passthrough_device_choices` lists as available, not critical to the host, and with a
 * label no other device shares, since the autocomplete keys its options on the label. The CI
 * appliance is itself a QEMU guest, so whether it lists one at all depends on what the host gives
 * it. When it lists none, the PCI test is skipped and says what middleware answered.
 *
 * Each device is asserted through `vm.device.query`, since the list shows a device's type and
 * order and nothing about which host device it names.
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
