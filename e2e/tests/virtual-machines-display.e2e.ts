/**
 * Stories: an admin creates a VM with the wizard on a zvol that already exists, with a VNC display;
 * adds a SPICE display from a VM's Devices page; and opens a running VM's display from its row,
 * which for a SPICE web display is a new tab and for a VNC one is a dialog saying where to connect.
 *
 * The wizard's other branch, a new zvol with the display turned off, is `virtual-machines.e2e.ts`'s.
 *
 * Whatever the screens say, each claim is read back from middleware: the devices from
 * `vm.device.query`, and the calls only the page can make (`vm.port_wizard`,
 * `vm.device.disk_choices`, `vm.resolution_choices`, `vm.get_display_web_uri`) off its socket.
 * A display's password never is: middleware declares it a `Secret`, so `vm.device.query` gives it
 * back redacted.
 *
 * The two running VMs have nothing but a display, so once started they sit at their firmware, as
 * the device-less one in `virtual-machines-power.e2e.ts` does. Whether the console connects,
 * renders or takes the password is not asserted; the claim stops at where the page sends the user.
 *
 * Not covered: editing a display and the zvol-in-use warning. Importing a disk image is
 * `virtual-machines-disk-images.e2e.ts`, and the serial shell `virtual-machines-serial.e2e.ts`.
 */
import type { Page } from '@playwright/test';
import { ensureDatasetAbsent, ensureDatasetPresent, ensureZvolPresent, listZvolsUnder } from '../fixtures/storage';
import {
  addVmDisplay,
  type DisplaySetup,
  ensureVmAbsent,
  ensureVmPresent,
  findFreeDisplayPorts,
  findVm,
  findVmDevices,
  getDisplayWebUri,
  listDisplayResolutions,
  requireVirtualization,
  startVm,
  type VmDeviceSummary,
} from '../fixtures/virtual-machines';
import {
  addDisplayFromDevicesPage, createVmWithWizard, listOfferedDisplayTypes, openVmDevices, openVmDisplay,
} from '../flows/virtual-machines';
import { infoDialogLocators } from '../locators/dialogs';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

/** Created through the wizard, on the zvol below. */
const existingDiskVm = 'e2e_vm_existing_disk';

/** Provisioned over the API with no devices. Given a SPICE display, through the UI or the API. */
const spiceVm = 'e2e_vm_spice';

/** Provisioned over the API with nothing but a VNC display, and started. */
const vncVm = 'e2e_vm_vnc';

const allVms = [existingDiskVm, spiceVm, vncVm];

/** The dataset the existing zvol goes under, below the shared pool. */
const disksLeaf = 'e2e_vm_wizard_disks';

/** The zvol the wizard is pointed at, below that dataset. */
const zvolLeaf = 'e2e_vm_existing';

/** The wizard's VNC password: at most 8 characters, which the OS step enforces. */
const vncPassword = 'e2evnc12';

const spicePassword = 'e2e-spice-display';

/**
 * How long a stop waits for the guest before forcing it, in seconds. Nothing in the guest answers
 * the request, as in the power spec, so the fixture's 90 would be the floor of every teardown.
 */
const shutdownTimeout = 10;

/** A ceiling on a start landing in `vm.query`. */
const stateTimeoutMs = 120_000;

/**
 * A ceiling on the new tab's navigation being requested. It waits on Display being clicked, which
 * itself waits up to `stateTimeoutMs` for the row to show it, so it has that much room and more.
 */
const popupTimeoutMs = stateTimeoutMs + 30_000;

/** The wizard's resolution for its VNC display, which it does not ask for. */
const wizardResolution = '1920x1080';

/** What middleware stores when a display is given no resolution. */
const middlewareDefaultResolution = '1024x768';

async function removeEverything(api: E2eApiClient, pool: string): Promise<void> {
  const disks = `${pool}/${disksLeaf}`;

  // The VMs first: a VM's disk must not be removed from under it. The fixture deletes with `force`,
  // which takes a running VM, and `zvols`, which takes the existing zvol the wizard was given.
  await runCleanupSteps([
    ...allVms.map((vm): [string, () => Promise<void>] => [`remove the VM "${vm}"`, () => ensureVmAbsent(api, vm)]),
    [`remove the dataset "${disks}"`, () => ensureDatasetAbsent(api, disks)],
  ]);
}

test.beforeEach(async ({ api, pool }) => {
  await requireVirtualization(api);
  await removeEverything(api, pool);
});

test.afterEach(async ({ api, pool }) => {
  if (leavingTestData(`the VMs ${allVms.join(', ')} and the dataset ${pool}/${disksLeaf}`)) {
    return;
  }

  await removeEverything(api, pool);
});

/** The one device of a type in a VM's list, failing when there is not exactly one. */
function onlyDevice(devices: VmDeviceSummary[], dtype: string): VmDeviceSummary {
  const matching = devices.filter((device) => device.attributes.dtype === dtype);
  const [device] = matching;
  if (!device || matching.length > 1) {
    throw new Error(`Expected exactly one ${dtype} device, and vm.device.query lists ${matching.length}.`);
  }
  return device;
}

/** How middleware answered each call the page made to `method`, oldest first. */
function answersTo(page: Page, method: string): (string | undefined)[] {
  return apiCallsTo(page, method).map((call) => call.answer);
}

/**
 * Defines a VM with nothing but a display, starts it over the API and waits for it to run.
 *
 * Fails, rather than letting the row's Display time out, when middleware does not report the
 * running machine as serving a display: that is the one precondition the row's button reads.
 */
async function startVmWithDisplay(
  api: E2eApiClient,
  name: string,
  display: DisplaySetup,
): Promise<{ id: number; device: VmDeviceSummary }> {
  const id = await ensureVmPresent(api, name, shutdownTimeout);
  const device = await addVmDisplay(api, id, display);

  await startVm(api, id);
  await expect.poll(async () => (await findVm(api, name))?.state, { timeout: stateTimeoutMs }).toBe('RUNNING');
  expect((await findVm(api, name))?.display_available, 'vm.query reports display_available').toBe(true);

  return { id, device };
}

test('an admin creates a VM with the wizard on an existing zvol, with a VNC display', async ({ page, api, pool }) => {
  const disks = `${pool}/${disksLeaf}`;
  const zvol = `${disks}/${zvolLeaf}`;
  await ensureDatasetPresent(api, disks);
  await ensureZvolPresent(api, zvol);

  await createVmWithWizard(page, {
    name: existingDiskVm,
    description: 'created by e2e on an existing zvol',
    memory: '1 GiB',
    existingZvol: zvol,
    vncPassword,
  });

  await expect(page.locator(virtualMachinesLocators.row.name(existingDiskVm))).toHaveText(existingDiskVm);

  const created = await findVm(api, existingDiskVm);
  if (!created) {
    throw new Error(`The wizard closed, but vm.query has no VM named "${existingDiskVm}".`);
  }
  expect(created).toMatchObject({ autostart: false, state: 'STOPPED' });

  const devices = await findVmDevices(api, created.id);
  expect(devices.map((device) => device.attributes.dtype).sort((a, b) => a.localeCompare(b)))
    .toEqual(['DISK', 'DISPLAY', 'NIC']);
  expect(onlyDevice(devices, 'DISK').attributes).toMatchObject({ path: `/dev/zvol/${zvol}`, type: 'AHCI' });
  // Middleware's own defaults are SPICE, 127.0.0.1, 1024x768 and web on, so each of these is the
  // wizard's doing.
  expect(onlyDevice(devices, 'DISPLAY').attributes).toMatchObject({
    type: 'VNC',
    bind: '0.0.0.0',
    resolution: wizardResolution,
    web: false,
    port: expect.any(Number),
  });

  expect(answersTo(page, 'vm.port_wizard')).toContain('result');
  expect(answersTo(page, 'vm.device.disk_choices')).toContain('result');

  // The Existing branch attaches the zvol it was given and creates none of its own.
  expect(await listZvolsUnder(api, disks)).toEqual([zvol]);
});

test('an admin adds a SPICE display with the web interface to a VM, at a resolution they pick', async ({ page, api }) => {
  const id = await ensureVmPresent(api, spiceVm);

  // Neither the form's default nor middleware's, so a save the pick never reached reads differently.
  const resolution = (await listDisplayResolutions(api))
    .find((choice) => choice !== wizardResolution && choice !== middlewareDefaultResolution);
  if (!resolution) {
    throw new Error('vm.resolution_choices lists no resolution besides the two defaults.');
  }

  // Free ports, as the wizard would pick them: left empty, the two compare equal and middleware
  // refuses the display.
  const ports = await findFreeDisplayPorts(api);

  await openVmDevices(page, spiceVm, id);
  await addDisplayFromDevicesPage(page, {
    type: 'SPICE',
    bind: '0.0.0.0',
    password: spicePassword,
    resolution,
    port: ports.port,
    webPort: ports.web,
  });

  await expect(page.locator(virtualMachinesLocators.devices.rowsOfType('DISPLAY'))).toHaveCount(1);

  const display = onlyDevice(await findVmDevices(api, id), 'DISPLAY');
  expect(display.attributes).toMatchObject({
    type: 'SPICE',
    bind: '0.0.0.0',
    resolution,
    web: true,
    port: ports.port,
    web_port: ports.web,
  });
  expect(answersTo(page, 'vm.resolution_choices')).toContain('result');

  // One display of each type: with SPICE taken, VNC is all Add has left to offer.
  expect(await listOfferedDisplayTypes(page)).toEqual(['VNC']);
});

test('Display on a running VM with a SPICE web display opens a new tab at the address middleware gives', async ({ page, api }) => {
  const { id } = await startVmWithDisplay(api, spiceVm, { type: 'SPICE', password: spicePassword, web: true });

  // The page asks for the address with its own host and protocol, so the expected one is asked
  // for the same way.
  const { host, protocol } = new URL(page.url());
  const expected = await getDisplayWebUri(api, id, host, protocol === 'http:' ? 'HTTP' : 'HTTPS');

  // Every navigation this context requests. The new tab's first one is the address it was opened
  // at, whatever it is redirected to or fails to load afterwards. Which page made it is not asked:
  // a new tab's first request comes before its frame exists, and `request.frame()` throws on it.
  // The address is the display's own port, which this single-page app never navigates to.
  const navigations: string[] = [];
  page.context().on('request', (request) => {
    if (request.isNavigationRequest()) {
      navigations.push(request.url());
    }
  });

  const popupOpened = page.waitForEvent('popup', { timeout: popupTimeoutMs });
  await openVmDisplay(page, spiceVm, id);
  const popup = await popupOpened;

  // Compared rather than matched, so a failure does not print an address that can carry the
  // display's password.
  await expect
    .poll(() => navigations.includes(expected), {
      message: 'the new tab requests the address vm.get_display_web_uri gives',
      timeout: popupTimeoutMs,
    })
    .toBe(true);
  await popup.close();

  expect(answersTo(page, 'vm.get_display_web_uri')).toEqual(['result']);
  await expect(page.locator(infoDialogLocators.title)).toBeHidden();
});

test('Display on a running VM with only a VNC display explains how to connect, and opens no tab', async ({ page, api }) => {
  const { id, device } = await startVmWithDisplay(api, vncVm, { type: 'VNC', password: vncPassword, web: false });

  let popups = 0;
  page.on('popup', () => {
    popups += 1;
  });

  await openVmDisplay(page, vncVm, id);

  const { title, message, close } = infoDialogLocators;
  await expect(page.locator(title)).toHaveText('VNC Display Available');
  // The display is bound to every address, which no client can be pointed at, so the dialog
  // names the host the page itself was served from.
  const { hostname } = new URL(page.url());
  await expect(page.locator(message)).toContainText(`${hostname}:${device.attributes.port}`);
  await expect(page.locator(message)).not.toContainText('0.0.0.0');

  // The dialog is the branch's last step, so by the time it shows, no tab is still to come.
  expect(popups).toBe(0);
  expect(apiCallsTo(page, 'vm.get_display_web_uri')).toHaveLength(0);

  await page.locator(close).click();
  await expect(page.locator(title)).toBeHidden();
});
