/**
 * Story: an admin opens a running VM's serial console from its row on the Virtual Machines page,
 * and it connects.
 *
 * The VM has no devices and no operating system, as in `virtual-machines-power.e2e.ts`, so once
 * started it sits at its firmware. What firmware prints on the serial line, if anything, is not the
 * same every run, so the claim stops at the console connecting: the shared terminal renders its
 * font-size buttons only once its websocket is attached.
 *
 * Nothing is typed into the console, so the guest is left exactly as it booted.
 *
 * Not covered: typing into the guest, reconnecting, and the font size, which `system-shell.e2e.ts`
 * covers for the same terminal.
 */
import {
  ensureVmAbsent, ensureVmPresent, findVm, requireVirtualization, startVm,
} from '../fixtures/virtual-machines';
import { waitForShell } from '../flows/terminal';
import { clickVmRowAction, expandVmRow } from '../flows/virtual-machines';
import { pageHeaderLocators } from '../locators/page-header';
import { virtualMachinesLocators } from '../locators/virtual-machines';
import { leavingTestData } from '../support/cleanup';
import { expect, test } from '../support/fixtures';

/** Provisioned over the API with no devices, and never left behind. */
const vm = 'e2e_vm_serial';

/**
 * How long a stop waits for the guest before forcing it, in seconds. Nothing in the guest answers
 * the request, so the fixture's 90 would be the floor of every teardown.
 */
const shutdownTimeout = 10;

/** A ceiling on a start landing in `vm.query`. */
const stateTimeoutMs = 120_000;

test.beforeEach(async ({ api }) => {
  await requireVirtualization(api);
  await ensureVmAbsent(api, vm);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData(`the VM "${vm}"`)) {
    return;
  }

  // The fixture deletes with `force`, which stops the running VM first.
  await ensureVmAbsent(api, vm);
});

test('an admin opens a running VM\'s serial console from its row, and it connects', async ({ page, api }) => {
  const id = await ensureVmPresent(api, vm, shutdownTimeout);
  await startVm(api, id);
  await expect.poll(async () => (await findVm(api, vm))?.state, { timeout: stateTimeoutMs }).toBe('RUNNING');

  await expandVmRow(page, vm, id);
  // Through the retrying click: the list closes the open row on each `vm.query` change.
  await clickVmRowAction(page, vm, virtualMachinesLocators.rowAction.serialShell(id));

  await expect(page).toHaveURL(new RegExp(`/vm/${id}/serial$`));
  await expect(page.locator(pageHeaderLocators.title)).toHaveText('VM Serial Shell');
  await waitForShell(page);
});
