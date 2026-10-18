/**
 * Stories: an admin starts, stops, restarts, resets and powers off a virtual machine from the
 * buttons in its row on the Virtual Machines page, and the appliance holds what they did.
 *
 * The VM has no devices and no operating system, so once started it sits at its firmware. That is
 * enough for every power action, and it is the most a VM can be asked to do here: the CI appliance
 * is itself a VM, so this guest runs nested.
 *
 * Every state is read back from `vm.query`. A restart leaves the state where it was, so it is told
 * from a no-op by the machine's `pid`, which a new process changes. A reset changes nothing
 * `vm.query` can see, so its claim is the page's own `vm.reset` call and middleware's answer.
 *
 * The list closes an open row whenever a VM's state changes, so every button here is clicked
 * through `clickVmRowAction`, which opens the row again when it has to.
 *
 * Not covered: Suspend and Resume, the memory overcommit prompt, the display, the serial shell and
 * the log download.
 */
import {
  ensureVmAbsent, ensureVmPresent, findVm, requireVirtualization, startVm,
} from '../fixtures/virtual-machines';
import {
  clickVmRowAction, expandVmRow, resetVmFromRow, stopVmFromRow,
} from '../flows/virtual-machines';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import type { E2eApiClient } from '../support/api/client';
import { apiCallsTo } from '../support/api-calls';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

test.use({ recordApiCalls: true });

/** Provisioned over the API with no devices, 512 MiB, and never left behind. */
const vm = 'e2e_vm_power';

/**
 * How long a stop waits for the guest before forcing it, in seconds. Nothing in the guest answers
 * the request, so a stop or a restart always waits this out; the fixture's 90 would be the floor.
 */
const shutdownTimeout = 10;

/** A ceiling on a start, a stop or a restart landing in `vm.query`, the shutdown timeout included. */
const stateTimeoutMs = 120_000;

test.beforeEach(async ({ api }) => {
  await requireVirtualization(api);
  await ensureVmAbsent(api, vm);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the VM "${vm}"`)) {
    return;
  }

  // The fixture deletes with `force`, which takes a VM a failed test left running.
  await ensureVmAbsent(api, vm);
});

/** The VM's state as `vm.query` reports it, or undefined if it is gone. */
async function stateOf(api: E2eApiClient): Promise<string | undefined> {
  return (await findVm(api, vm))?.state;
}

/** Starts the VM over the API, for a test about what is done to a running one. */
async function startOverApi(api: E2eApiClient, id: number): Promise<void> {
  await startVm(api, id);
  await expect.poll(() => stateOf(api), { timeout: stateTimeoutMs }).toBe('RUNNING');
}

test('an admin starts a stopped VM, then stops it', async ({ page, api }) => {
  const id = await ensureVmPresent(api, vm, shutdownTimeout);
  const { row, rowAction } = virtualMachinesLocators;

  await expandVmRow(page, vm, id);
  await expect(page.locator(row.running(vm))).not.toBeChecked();
  await clickVmRowAction(page, vm, rowAction.start(id));

  await expect(page.locator(row.running(vm))).toBeChecked({ timeout: stateTimeoutMs });
  expect(await stateOf(api)).toBe('RUNNING');

  // Stop renders only while the VM runs, so reaching it is the row's running-state buttons appearing.
  await stopVmFromRow(page, vm, id);

  await expect(page.locator(row.running(vm))).not.toBeChecked({ timeout: stateTimeoutMs });
  expect(await stateOf(api)).toBe('STOPPED');
});

test('an admin restarts a running VM', async ({ page, api }) => {
  const id = await ensureVmPresent(api, vm, shutdownTimeout);
  await startOverApi(api, id);
  const before = await findVm(api, vm);
  // The pid is what tells a restart from a no-op, so the test cannot make its claim without one.
  expect(before?.pid).toEqual(expect.any(Number));

  await expandVmRow(page, vm, id);
  await clickVmRowAction(page, vm, virtualMachinesLocators.rowAction.restart(id));

  await expect
    .poll(async () => {
      const after = await findVm(api, vm);
      return after?.state === 'RUNNING' && after.pid !== before?.pid;
    }, { timeout: stateTimeoutMs })
    .toBe(true);
});

test('an admin resets a running VM, then powers it off', async ({ page, api }) => {
  const id = await ensureVmPresent(api, vm, shutdownTimeout);
  await startOverApi(api, id);

  await expandVmRow(page, vm, id);
  await resetVmFromRow(page, vm, id);

  // A reset leaves the machine running and changes nothing else `vm.query` reports.
  await expect
    .poll(() => apiCallsTo(page, 'vm.reset').map((call) => call.answer), { timeout: stateTimeoutMs })
    .toEqual(['result']);
  expect(await stateOf(api)).toBe('RUNNING');

  await clickVmRowAction(page, vm, virtualMachinesLocators.rowAction.powerOff(id));

  await expect.poll(() => stateOf(api), { timeout: stateTimeoutMs }).toBe('STOPPED');
});
