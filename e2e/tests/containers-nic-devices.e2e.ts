/**
 * Stories: an admin attaches a NIC to a stopped container from its NIC Devices
 * card, changes its adapter type and MAC address, removes it, and is refused a
 * MAC address that is not colon-separated.
 *
 * ## Which NIC
 *
 * Interface names differ per appliance, so each test reads the one it uses:
 * the first interface the card's Add menu offers, which is
 * `container.device.nic_attach_choices` without the container's own default
 * bridge (`findAddableNics`). Nothing here creates a bridge or a VLAN to make
 * one, since on a single-NIC appliance that touches the management link; with
 * nothing to offer, `beforeEach` fails and says so.
 *
 * ## Setup and teardown
 *
 * Each test starts with no staged interface change, since one hides Add and
 * every device menu, the worker's `pool` as the preferred pool, and a stopped
 * container `e2e-ct-nic` seeded over the API. Nothing starts it, so no host
 * interface changes. Teardown deletes the container, and its NIC devices with
 * it, then writes back the containers settings the appliance held before the
 * first test. Once the file is done it removes `<pool>/.truenas_containers`, as
 * `containers.e2e.ts` does.
 */
import {
  type ContainerSettings, containersDataset, containerSettingsBaseline, ensureContainerAbsent,
  findAddableNics, findContainer, findNicDevices, firstRegistryImage, type NicDevice,
  readContainerConfig, seedContainer, seedNicDevice, setContainerConfig,
} from '../fixtures/containers';
import { ensureNoPendingInterfaceChanges } from '../fixtures/interfaces';
import { ensureDatasetAbsent } from '../fixtures/storage';
import { openContainerDetails } from '../flows/containers';
import { confirmDestructiveAction, selectOption } from '../flows/storage';
import { containersLocators } from '../locators/containers';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { slowCallTimeoutMs } from '../support/timeouts';

const containerName = 'e2e-ct-nic';
const mac = '00:a0:98:1b:2c:3d';
/** The same address dash-separated, which `macAddressRegex` refuses. */
const dashedMac = '00-a0-98-1b-2c-3d';
/** `macAddressInvalidMessage` in `src/app/constants/mac-address.constant.ts`. */
const invalidMacMessage = 'MAC address must be colon-separated, for example 00:a0:98:1b:2c:3d';
/** `containerNicDeviceTypeLabels`, the NIC Type options. */
const e1000Label = 'Intel e82585 (e1000)';

const card = containersLocators.nicDevices;
const form = containersLocators.nicForm;

/**
 * How the card and its menu name a NIC device, as `getDeviceDescription` words
 * one. Built from what middleware holds, since a device added without a MAC may
 * hold none or one middleware chose.
 */
function describeNic(device: Pick<NicDevice, 'nic_attach' | 'mac'>): string {
  return `${device.nic_attach} (${device.mac ?? 'Default Mac Address'})`;
}

/** What the appliance held before this file ran, and therefore what `afterEach` writes back. */
let found: ContainerSettings | undefined;
/** The registry image every test's container is created from, read once. */
let image: { name: string; version: string } | undefined;
/** The seeded container's id, which its devices are keyed by. */
let containerId: number;
/** The bridge the container is always on, which the card lists as `<bridge> (Default)`. */
let defaultNetwork: string | null;
/** The first interface the Add menu offers, which every test attaches. */
let nic: string;

test.beforeAll(async ({ api }) => {
  found = await readContainerConfig(api);
  image = await firstRegistryImage(api, 'debian');
});

test.beforeEach(async ({ api, pool }) => {
  await ensureContainerAbsent(api, containerName);
  await ensureNoPendingInterfaceChanges(api);
  await setContainerConfig(api, { ...containerSettingsBaseline, preferred_pool: pool });

  if (!image) {
    throw new Error('beforeAll found no image to create the container from');
  }
  await seedContainer(api, { name: containerName, pool, image });
  const container = await findContainer(api, containerName);
  if (!container) {
    throw new Error(`container ${containerName} was seeded and then not found`);
  }
  containerId = container.id;
  defaultNetwork = container.default_network ?? null;

  const [first] = await findAddableNics(api, defaultNetwork);
  if (!first) {
    throw new Error(
      `container.device.nic_attach_choices offers nothing beside the default network ${defaultNetwork}, `
      + 'so the card shows "No NIC devices available" and there is no NIC to attach',
    );
  }
  nic = first;
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`container "${containerName}" and the containers settings`)) {
    return;
  }

  await runCleanupSteps([
    [`delete container ${containerName}`, () => ensureContainerAbsent(api, containerName)],
    // Guarded: if `beforeAll` threw, there is nothing known to write back.
    ['restore the containers settings', async () => {
      if (found !== undefined) {
        await setContainerConfig(api, found);
      }
    }],
  ]);
});

test.afterAll(async ({ api, pool }) => {
  if (leavingTestData(containersDataset(pool))) {
    return;
  }

  // After every container on the pool is gone: each one is a clone of the image
  // this holds.
  await ensureDatasetAbsent(api, containersDataset(pool));
});

test('an admin adds a NIC with the default MAC, and the menu stops offering it', async ({ page, api }) => {
  await openContainerDetails(page, containerName);
  await expect(page.locator(card.defaultDevice)).toHaveText(`${defaultNetwork} (Default)`);

  await page.locator(card.add).click();
  await page.locator(card.addNic(nic)).click();
  await expect(page.locator(form.title)).toHaveText(`Add NIC Device: ${nic}`);
  await expect(page.locator(form.type)).toContainText('VirtIO');
  await expect(page.locator(form.useDefault)).toBeChecked();
  await page.locator(form.submit).click();
  await expect(page.locator(form.title)).toBeHidden();

  await expect.poll(() => findNicDevices(api, containerId), { timeout: slowCallTimeoutMs }).toHaveLength(1);
  const [device] = await findNicDevices(api, containerId);
  if (!device) {
    throw new Error('the add was accepted and no NIC device is on the container');
  }
  expect(device).toMatchObject({ nic_attach: nic, type: 'VIRTIO' });
  await expect(page.locator(card.device(device.id))).toContainText(`${nic} (`);

  // A NIC device replaces the default network: middleware reports
  // `default_network: null` once the container has one (`extend` in
  // `plugins/container/crud.py`), so the card drops the "(Default)" row and the
  // menu offers that bridge, which `nic_attach_choices` always lists.
  await expect(page.locator(card.defaultDevice)).toBeHidden();
  expect((await findContainer(api, containerName))?.default_network ?? null).toBeNull();
  if (!defaultNetwork) {
    throw new Error('the container was seeded with no default network, so there is no bridge to offer');
  }

  // Proven on the bridge the menu now offers, so the absence below is the
  // filter's and not a menu that never opened.
  await page.locator(card.add).click();
  await expect(page.locator(card.addNic(defaultNetwork))).toBeVisible();
  await expect(page.locator(card.addNic(nic))).toBeHidden();
  await page.keyboard.press('Escape');
});

test('an admin changes the type and MAC address of a NIC', async ({ page, api }) => {
  const seeded = await seedNicDevice(api, containerId, { nic_attach: nic, type: 'VIRTIO' });
  const description = describeNic(seeded);

  await openContainerDetails(page, containerName);
  await page.locator(card.actionsFor(description)).click();
  await page.locator(card.edit(description)).click();
  await expect(page.locator(form.title)).toHaveText(`Edit NIC Device: ${nic}`);
  await expect(page.locator(form.trustGuestRxFilters)).toBeVisible();

  await selectOption(page, form.type, form.typeOption(e1000Label));
  await expect(page.locator(form.trustGuestRxFilters)).toBeHidden();
  await page.locator(form.mac).fill(mac);
  await page.locator(form.submit).click();
  await expect(page.locator(form.title)).toBeHidden();

  await expect(page.locator(card.device(seeded.id))).toHaveText(`${nic} (${mac})`, { timeout: slowCallTimeoutMs });

  // The same device, changed, rather than a second one beside it.
  expect(await findNicDevices(api, containerId)).toEqual([{
    id: seeded.id,
    nic_attach: nic,
    type: 'E1000',
    mac,
  }]);
});

test('an admin deletes a NIC, and the NIC is offered again', async ({ page, api }) => {
  const seeded = await seedNicDevice(api, containerId, { nic_attach: nic, type: 'VIRTIO' });
  const description = describeNic(seeded);

  await openContainerDetails(page, containerName);
  // Shown before the delete, so its absence below is the delete's doing.
  await expect(page.locator(card.device(seeded.id))).toBeVisible();

  await page.locator(card.actionsFor(description)).click();
  await page.locator(card.delete(description)).click();
  await confirmDestructiveAction(page);

  await expect(page.locator(card.device(seeded.id))).toBeHidden({ timeout: slowCallTimeoutMs });
  await expect(page.locator(card.defaultDevice)).toHaveText(`${defaultNetwork} (Default)`);
  await page.locator(card.add).click();
  await expect(page.locator(card.addNic(nic))).toBeVisible();
  await page.keyboard.press('Escape');

  expect(await findNicDevices(api, containerId)).toEqual([]);
});

test('the dialog refuses a MAC address that is not colon-separated', async ({ page, api }) => {
  const submit = page.locator(form.submit);

  await openContainerDetails(page, containerName);
  await page.locator(card.add).click();
  await page.locator(card.addNic(nic)).click();
  await page.locator(form.useDefault).click();

  // A valid address first, and Add proven live on it, so the refusal below is
  // the validator's and not a dialog that was never valid.
  await page.locator(form.mac).fill(mac);
  await page.locator(form.mac).blur();
  await expect(submit).toBeEnabled();
  await expect(page.locator(form.macField)).not.toContainText(invalidMacMessage);

  await page.locator(form.mac).fill(dashedMac);
  await page.locator(form.mac).blur();
  await expect(page.locator(form.macField)).toContainText(invalidMacMessage);
  await expect(submit).toBeDisabled();
  await page.locator(form.cancel).click();
  await expect(page.locator(form.title)).toBeHidden();

  // A backstop rather than the claim: Add was disabled, so nothing could be sent.
  expect(await findNicDevices(api, containerId)).toEqual([]);
});
