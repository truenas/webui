/**
 * Virtual machines: preconditions, cleanup and readback, over the API.
 *
 * A VM that is only defined costs the appliance nothing but its record and its disk. Two specs start
 * one, with {@link startVm}, and neither gives it a disk, so it sits at its firmware:
 * `virtual-machines-power.e2e.ts` with no devices, and `virtual-machines-display.e2e.ts` with
 * nothing but a display.
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
  /** Whether the row offers Display: middleware's word that the running machine serves one. */
  display_available: boolean;
}

/**
 * The part of a device's attributes the specs read. Every device has a `dtype`; a disk has a path,
 * a NIC has an adapter type and a MAC, and a display has a type, an address and its ports.
 *
 * A display's password is not here: middleware declares it a `Secret`, so `vm.device.query` gives
 * it back redacted and there is nothing to compare it with.
 */
interface DeviceAttributes {
  dtype: string;
  path?: string | null;
  type?: string | null;
  mac?: string | null;
  bind?: string;
  port?: number | null;
  web?: boolean;
  web_port?: number | null;
  resolution?: string;
}

/** One device of a VM, as `vm.device.query` gives it. */
export interface VmDeviceSummary {
  id: number;
  /** Middleware picks one when none is given. The Devices page keys each row on it. */
  order: number;
  attributes: DeviceAttributes;
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
    display_available: vm.display_available,
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

/** Every device attached to a VM. */
export async function findVmDevices(client: E2eApiClient, vmId: number): Promise<VmDeviceSummary[]> {
  const devices = await firstValueFrom(
    client.api.query('vm.device.query', [['vm', '=', vmId]]).pipe(timeout(readTimeoutMs)),
  );

  return devices.map((device) => ({
    id: device.id,
    order: device.order ?? 0,
    // The generated type is a union per device type; only the fields `DeviceAttributes` names are read.
    attributes: device.attributes as unknown as DeviceAttributes,
  }));
}

/** The device types attached to a VM, and the paths of its disks. */
export async function readVmDevices(
  client: E2eApiClient,
  vmId: number,
): Promise<{ types: string[]; diskPaths: string[] }> {
  const attributes = (await findVmDevices(client, vmId)).map((device) => device.attributes);

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

/** Reads back one device of a VM by id, failing when `vm.device.query` does not have it. */
async function readVmDevice(client: E2eApiClient, vmId: number, deviceId: number): Promise<VmDeviceSummary> {
  const device = (await findVmDevices(client, vmId)).find((candidate) => candidate.id === deviceId);
  if (!device) {
    throw new Error(`vm.device.create answered with device ${deviceId}, but VM ${vmId} does not list it.`);
  }

  return device;
}

/**
 * Attaches a NIC of the given adapter type to a VM, and returns it as middleware stored it.
 *
 * It attaches to whichever interface `vm.device.nic_attach_choices` lists first, since a run cannot
 * know the appliance's interface names. Its MAC comes from `vm.random_mac`, as the device form's
 * does, rather than being left for middleware to fill in.
 *
 * The choices are grouped by kind (`{ BRIDGE: [...], MACVLAN: [...] }`), so the interface names are
 * the values, flattened in the order the device form's select lists them, and not the keys.
 */
export async function addVmNic(
  client: E2eApiClient,
  vmId: number,
  type: 'E1000' | 'VIRTIO',
): Promise<VmDeviceSummary> {
  const choices = await firstValueFrom(
    client.api.call('vm.device.nic_attach_choices').pipe(timeout(readTimeoutMs)),
  );
  const [nicAttach] = (Object.values(choices) as string[][]).flat();
  if (!nicAttach) {
    throw new Error('vm.device.nic_attach_choices lists no interface, so no NIC can be attached.');
  }
  const mac = await firstValueFrom(client.api.call('vm.random_mac').pipe(timeout(readTimeoutMs)));

  const created = await firstValueFrom(
    client.api.call('vm.device.create', [{
      vm: vmId,
      attributes: {
        dtype: 'NIC',
        type,
        mac,
        nic_attach: nicAttach,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return readVmDevice(client, vmId, created.id);
}

/**
 * Attaches an existing zvol to a VM as an AHCI disk, by its full name (`pool/…/zvol`), and returns
 * the device as middleware stored it.
 */
export async function addVmDisk(client: E2eApiClient, vmId: number, zvol: string): Promise<VmDeviceSummary> {
  const created = await firstValueFrom(
    client.api.call('vm.device.create', [{
      vm: vmId,
      attributes: { dtype: 'DISK', path: `/dev/zvol/${zvol}`, type: 'AHCI' },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return readVmDevice(client, vmId, created.id);
}

/** What {@link addVmDisplay} attaches. Bound to every address, as the wizard's default is. */
export interface DisplaySetup {
  type: 'SPICE' | 'VNC';
  password: string;
  /** Only SPICE serves a web client. A VNC display is always saved without one. */
  web: boolean;
}

/** A display port and a web port that no other service holds, as `vm.port_wizard` picks them. */
export interface FreeDisplayPorts {
  port: number;
  web: number;
}

/**
 * Two free ports for a display, from `vm.port_wizard`, as the wizard gets its own.
 *
 * A SPICE display needs both given: saved with neither, middleware compares the two empty ports,
 * finds them equal and refuses the device ("Spice server port must not be same as web port").
 */
export async function findFreeDisplayPorts(client: E2eApiClient): Promise<FreeDisplayPorts> {
  const { port, web } = await firstValueFrom(client.api.call('vm.port_wizard').pipe(timeout(readTimeoutMs)));
  return { port, web };
}

/**
 * Attaches a display to a VM and returns it as middleware stored it.
 *
 * Its ports come from {@link findFreeDisplayPorts}, so the device is saved with ports no other
 * service holds.
 */
export async function addVmDisplay(
  client: E2eApiClient,
  vmId: number,
  display: DisplaySetup,
): Promise<VmDeviceSummary> {
  const ports = await findFreeDisplayPorts(client);

  const created = await firstValueFrom(
    client.api.call('vm.device.create', [{
      vm: vmId,
      attributes: {
        dtype: 'DISPLAY',
        type: display.type,
        bind: '0.0.0.0',
        password: display.password,
        port: ports.port,
        web: display.web,
        web_port: display.web ? ports.web : null,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  return readVmDevice(client, vmId, created.id);
}

/** Every resolution a display can be given, as `vm.resolution_choices` lists them. */
export async function listDisplayResolutions(client: E2eApiClient): Promise<string[]> {
  const choices = await firstValueFrom(client.api.call('vm.resolution_choices').pipe(timeout(readTimeoutMs)));
  return Object.keys(choices);
}

/**
 * The address of a VM's web display, as middleware gives it for a page served from `host` over
 * `protocol`. The same call the row's Display makes, so the two answers can be compared.
 */
export async function getDisplayWebUri(
  client: E2eApiClient,
  vmId: number,
  host: string,
  protocol: 'HTTP' | 'HTTPS',
): Promise<string> {
  const answer = await firstValueFrom(
    client.api.call('vm.get_display_web_uri', [vmId, host, { protocol }]).pipe(timeout(readTimeoutMs)),
  );
  if (!answer.uri) {
    throw new Error(`vm.get_display_web_uri gave VM ${vmId} no address: ${answer.error ?? 'no reason given'}.`);
  }

  return answer.uri;
}
