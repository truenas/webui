/**
 * Virtual machines: preconditions, cleanup and readback, over the API.
 *
 * A VM that is only defined costs the appliance nothing but its record and its disk. Only
 * `virtual-machines-power.e2e.ts` starts one, with {@link startVm}, and only one with no devices,
 * which sits at its firmware.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** The part of a `vm.query` row the specs read. */
export interface VmSummary {
  id: number;
  name: string;
  description: string;
  /** In MiB. */
  memory: number;
  /** Optional in the generated type; left undefined rather than defaulted, so a missing value fails a match. */
  vcpus: number | undefined;
  shutdown_timeout: number;
  autostart: boolean;
  state: string;
  /** The machine's process while it runs; a restart gives it a new one. Null while stopped. */
  pid: number | null;
}

/** The part of a device's attributes the specs read. Every device has a `dtype`; a disk has a path. */
interface DeviceAttributes {
  dtype: string;
  path?: string | null;
}

/** What {@link ensureVmPresent} defines: the smallest machine the wizard would offer, not started. */
export const provisionedVm = {
  description: 'e2e provisioned',
  memory: 512,
  vcpus: 1,
  shutdownTimeout: 90,
} as const;

/**
 * Fails the test when the appliance cannot run virtual machines.
 *
 * Not a skip. Without support the page shows "Virtualization is not supported" in place of the
 * list, so every journey here would time out on a button that is not there. This says why instead.
 * The CI appliance is itself a VM, so whether it offers virtualization depends on the host passing
 * it through, which is worth knowing rather than skipping past.
 */
export async function requireVirtualization(client: E2eApiClient): Promise<void> {
  const details = await firstValueFrom(
    client.api.call('vm.virtualization_details').pipe(timeout(readTimeoutMs)),
  );

  if (!details.supported) {
    throw new Error(
      'This appliance does not support virtualization, so the Virtual Machines page shows no list '
      + `to act on. Middleware says: ${details.error ?? 'no reason given'}.`,
    );
  }
}

/** A VM by name, or undefined when absent. `query`, not `queryOne`: absence is the ordinary answer. */
export async function findVm(client: E2eApiClient, name: string): Promise<VmSummary | undefined> {
  const [vm] = await firstValueFrom(
    client.api.query('vm.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  if (!vm) {
    return undefined;
  }

  return {
    id: vm.id,
    name: vm.name,
    description: vm.description ?? '',
    memory: vm.memory,
    vcpus: vm.vcpus,
    shutdown_timeout: vm.shutdown_timeout ?? 0,
    autostart: vm.autostart ?? false,
    state: vm.status.state,
    pid: vm.status.pid ?? null,
  };
}

/**
 * The name of every VM on the appliance, in no particular order. A spec that lets middleware pick a
 * name reads this before and after, and the name that was not there before is the new one.
 */
export async function listVmNames(client: E2eApiClient): Promise<string[]> {
  const vms = await firstValueFrom(client.api.query('vm.query', []).pipe(timeout(readTimeoutMs)));
  return vms.map((vm) => vm.name);
}

/** The device types attached to a VM, and the paths of its disks. */
export async function readVmDevices(
  client: E2eApiClient,
  vmId: number,
): Promise<{ types: string[]; diskPaths: string[] }> {
  const devices = await firstValueFrom(
    client.api.query('vm.device.query', [['vm', '=', vmId]]).pipe(timeout(readTimeoutMs)),
  );
  // The generated type is a union per device type; only the two fields every disk shares are read.
  const attributes = devices.map((device) => device.attributes as unknown as DeviceAttributes);

  return {
    types: attributes.map((attribute) => attribute.dtype).sort((a, b) => a.localeCompare(b)),
    diskPaths: attributes
      .filter((attribute) => attribute.dtype === 'DISK')
      .map((attribute) => attribute.path ?? ''),
  };
}

/**
 * Defines a VM by name if absent, with no devices, and returns its id.
 *
 * No disk and no NIC: the edit and delete journeys act on the VM's own record, and a VM with no
 * devices has nothing to boot, attach or hold storage.
 *
 * `shutdownTimeout` is how long a stop waits for the guest before forcing it, and defaults to
 * {@link provisionedVm}'s. A spec that stops a running VM with no operating system shortens it,
 * because nothing in the guest answers the shutdown request and the whole timeout elapses.
 */
export async function ensureVmPresent(
  client: E2eApiClient,
  name: string,
  shutdownTimeout: number = provisionedVm.shutdownTimeout,
): Promise<number> {
  const existing = await findVm(client, name);
  if (existing) {
    return existing.id;
  }

  const created = await firstValueFrom(
    client.api.call('vm.create', [{
      name,
      description: provisionedVm.description,
      vcpus: provisionedVm.vcpus,
      cores: 1,
      threads: 1,
      memory: provisionedVm.memory,
      shutdown_timeout: shutdownTimeout,
      autostart: false,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created.id;
}

/**
 * Starts a stopped VM, for a test that needs one running before it acts.
 *
 * A plain call, not a job. The caller polls {@link findVm} for `RUNNING` rather than trusting the
 * answer, as with any state middleware reaches on its own.
 */
export async function startVm(client: E2eApiClient, id: number): Promise<void> {
  await firstValueFrom(client.api.call('vm.start', [id]).pipe(timeout(slowCallTimeoutMs)));
}

/**
 * Deletes a VM by name if present, with its zvols.
 *
 * `zvols: true` removes the disk the wizard created along with the machine. `force` because a VM
 * a failed test left running must still go.
 *
 * The already-gone case is tolerated after the query as well as before it, as in
 * `ensureDatasetAbsent`: a test that drove the deletion through the UI can have it in flight when
 * this runs.
 */
export async function ensureVmAbsent(client: E2eApiClient, name: string): Promise<void> {
  const vm = await findVm(client, name);
  if (!vm) {
    return;
  }

  try {
    await firstValueFrom(
      client.api.call('vm.delete', [vm.id, { zvols: true, force: true }]).pipe(timeout(slowCallTimeoutMs)),
    );
  } catch (error) {
    if (await findVm(client, name)) {
      throw error;
    }
  }
}
