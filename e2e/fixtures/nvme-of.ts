/**
 * NVMe-oF preconditions, cleanup and readback, over the API.
 *
 * A subsystem is useful only with what is attached to it: namespaces (one zvol or
 * file each), ports it listens on, and the hosts allowed to connect. Ports and
 * hosts are shared objects, linked to a subsystem through `nvmet.port_subsys` and
 * `nvmet.host_subsys`; a namespace belongs to exactly one subsystem. The zvol
 * behind a namespace is storage and is left to `fixtures/storage.ts`.
 *
 * The association lists are read off `nvmet.subsys.query` with `verbose`, which is
 * how the UI reads them too. Middleware leaves them out of the declared entity, so
 * they are read through {@link SubsystemAssociations} rather than the generated type.
 */
import { expect } from '@playwright/test';
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureServiceStopped } from './services';
import { ensureZvolPresent } from './storage';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Middleware's name for the NVMe-oF target service. */
export const nvmeOfServiceName = 'nvmet';

type SubsystemEntry = Extract<CallResponse<E2eApiDirectory, 'nvmet.subsys.query'>, unknown[]>[number];
type HostEntry = Extract<CallResponse<E2eApiDirectory, 'nvmet.host.query'>, unknown[]>[number];

/** The id lists `verbose` adds to a subsystem. Absent without it, hence a local shape. */
interface SubsystemAssociations {
  ports: number[] | null;
  hosts: number[] | null;
  namespaces: number[] | null;
}

export type NvmeOfSubsystemRecord = SubsystemEntry & SubsystemAssociations & { id: number };
export type NvmeOfHostRecord = HostEntry & { id: number };

/** The fields of a port this suite reads. Middleware declares one shape per transport. */
export interface NvmeOfPortRecord {
  id: number;
  addr_trtype: string;
  addr_traddr: string;
  addr_trsvcid: number | string | null;
}

/** The fields of a namespace this suite reads. `subsys` is the whole owning subsystem. */
export interface NvmeOfNamespaceRecord {
  id: number;
  device_type: string;
  device_path: string;
  subsys: { id: number };
}

/** A TCP port, as a test names it. */
export interface TcpPort {
  address: string;
  port: number;
}

/** The subsystem with this name, with its association ids, or undefined. */
export async function findNvmeOfSubsystem(
  client: E2eApiClient,
  name: string,
): Promise<NvmeOfSubsystemRecord | undefined> {
  const [subsystem] = await firstValueFrom(
    client.api.query('nvmet.subsys.query', [['name', '=', name]], { extra: { verbose: true } })
      .pipe(timeout(readTimeoutMs)),
  );

  return subsystem as unknown as NvmeOfSubsystemRecord | undefined;
}

/** How many subsystems the appliance holds — what the dashboard card lists. */
export async function countNvmeOfSubsystems(client: E2eApiClient): Promise<number> {
  const subsystems = await firstValueFrom(
    client.api.query('nvmet.subsys.query', []).pipe(timeout(readTimeoutMs)),
  );

  return subsystems.length;
}

/** Re-reads a subsystem that the test made, failing if it has gone. */
export async function requireNvmeOfSubsystem(client: E2eApiClient, name: string): Promise<NvmeOfSubsystemRecord> {
  const subsystem = await findNvmeOfSubsystem(client, name);
  if (!subsystem) {
    throw new Error(`the subsystem ${name} is missing`);
  }

  return subsystem;
}

/** The dashboard card lists four subsystems, by name, before its pager. */
const nvmeOfCardPageSize = 4;

/**
 * Fails up front when the dashboard card cannot show every row a test needs. A
 * fresh appliance holds no subsystems; failing here says why rather than timing
 * out on a row past the pager.
 */
export async function requireRoomOnNvmeOfCard(client: E2eApiClient, adding: number): Promise<void> {
  const existing = await countNvmeOfSubsystems(client);
  expect(
    existing + adding <= nvmeOfCardPageSize,
    `the card lists ${nvmeOfCardPageSize} subsystems, this test adds ${adding}, the appliance has ${existing}`,
  ).toBe(true);
}

/** The host with this NQN, or undefined. */
export async function findNvmeOfHost(client: E2eApiClient, hostnqn: string): Promise<NvmeOfHostRecord | undefined> {
  const [host] = await firstValueFrom(
    client.api.query('nvmet.host.query', [['hostnqn', '=', hostnqn]]).pipe(timeout(readTimeoutMs)),
  );

  return host as NvmeOfHostRecord | undefined;
}

/**
 * The TCP port on this address and service id, or undefined.
 *
 * Filtered here rather than in the query: the service id is typed per transport,
 * and the appliance holds a handful of ports at most.
 */
export async function findNvmeOfPort(client: E2eApiClient, port: TcpPort): Promise<NvmeOfPortRecord | undefined> {
  const ports = await firstValueFrom(
    client.api.query('nvmet.port.query', []).pipe(timeout(readTimeoutMs)),
  ) as unknown as NvmeOfPortRecord[];

  return ports.find((candidate) => (
    candidate.addr_trtype === 'TCP'
    && candidate.addr_traddr === port.address
    && Number(candidate.addr_trsvcid) === port.port
  ));
}

/** Every namespace on a zvol or file at this path, whichever subsystem holds it. */
export async function findNvmeOfNamespaces(
  client: E2eApiClient,
  devicePath: string,
): Promise<NvmeOfNamespaceRecord[]> {
  const namespaces = await firstValueFrom(
    client.api.query('nvmet.namespace.query', [['device_path', '=', devicePath]]).pipe(timeout(readTimeoutMs)),
  );

  return namespaces as unknown as NvmeOfNamespaceRecord[];
}

/** The namespace a zvol backs, as middleware stores its path: `zvol/<pool>/<name>`. */
export function zvolDevicePath(zvol: string): string {
  return `zvol/${zvol}`;
}

/**
 * Creates a subsystem that allows any host, if none has this name.
 *
 * For a subsystem a test acts on or watches, never for the one a create is about.
 */
export async function ensureNvmeOfSubsystemPresent(
  client: E2eApiClient,
  name: string,
): Promise<NvmeOfSubsystemRecord> {
  if (!await findNvmeOfSubsystem(client, name)) {
    await firstValueFrom(
      // No subnqn: middleware derives one from the base NQN and the name.
      client.api.call('nvmet.subsys.create', [{ name, subnqn: null, allow_any_host: true }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  }

  const created = await findNvmeOfSubsystem(client, name);
  if (!created) {
    throw new Error(`nvmet.subsys.create answered, but no subsystem named ${name} exists.`);
  }

  return created;
}

/**
 * Removes a subsystem, if present, with its namespaces and its port and host links.
 *
 * `force`, because middleware refuses a subsystem that still has namespaces or ports.
 * Ports, hosts and zvols stay; they are the caller's to remove.
 */
export async function ensureNvmeOfSubsystemAbsent(client: E2eApiClient, name: string): Promise<void> {
  const subsystem = await findNvmeOfSubsystem(client, name);
  if (subsystem) {
    await firstValueFrom(
      client.api.call('nvmet.subsys.delete', [subsystem.id, { force: true }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/** Creates a host with no authentication, if none has this NQN. */
export async function ensureNvmeOfHostPresent(client: E2eApiClient, hostnqn: string): Promise<NvmeOfHostRecord> {
  const existing = await findNvmeOfHost(client, hostnqn);
  if (existing) {
    return existing;
  }

  const params = { hostnqn } as CallParams<E2eApiDirectory, 'nvmet.host.create'>[0];
  const created = await firstValueFrom(
    client.api.call('nvmet.host.create', [params]).pipe(timeout(slowCallTimeoutMs)),
  );

  return created as NvmeOfHostRecord;
}

/** Removes a host, if present. `force` unlinks it from any subsystem first. */
export async function ensureNvmeOfHostAbsent(client: E2eApiClient, hostnqn: string): Promise<void> {
  const host = await findNvmeOfHost(client, hostnqn);
  if (host) {
    await firstValueFrom(
      client.api.call('nvmet.host.delete', [host.id, { force: true }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a TCP port, if none listens on this address and service id.
 *
 * Middleware only checks the address is an IP, so `0.0.0.0` will do; the service
 * stays stopped, so nothing ever binds it.
 */
export async function ensureNvmeOfPortPresent(client: E2eApiClient, port: TcpPort): Promise<NvmeOfPortRecord> {
  const existing = await findNvmeOfPort(client, port);
  if (existing) {
    return existing;
  }

  const params = {
    addr_trtype: 'TCP',
    addr_traddr: port.address,
    addr_trsvcid: port.port,
  } as CallParams<E2eApiDirectory, 'nvmet.port.create'>[0];
  await firstValueFrom(
    client.api.call('nvmet.port.create', [params]).pipe(timeout(slowCallTimeoutMs)),
  );

  const created = await findNvmeOfPort(client, port);
  if (!created) {
    throw new Error(`nvmet.port.create answered, but no TCP port on ${port.address}:${port.port} exists.`);
  }

  return created;
}

/**
 * The addresses the port form's Address select offers for TCP, as `{ address: label }`.
 *
 * Middleware lists only configured aliases (`interface.query`'s `aliases`, not the
 * leased `state.aliases`), and without ANA each label is the address itself. So an
 * appliance whose NIC is on DHCP is offered nothing.
 */
export async function readNvmeOfTcpAddressChoices(client: E2eApiClient): Promise<Record<string, string>> {
  const params = ['TCP'] as CallParams<E2eApiDirectory, 'nvmet.port.transport_address_choices'>;
  const choices = await firstValueFrom(
    client.api.call('nvmet.port.transport_address_choices', params).pipe(timeout(readTimeoutMs)),
  );

  return choices as Record<string, string>;
}

/** Removes a port, if present. `force` unlinks it from any subsystem first. */
export async function ensureNvmeOfPortAbsent(client: E2eApiClient, port: TcpPort): Promise<void> {
  const existing = await findNvmeOfPort(client, port);
  if (existing) {
    await firstValueFrom(
      client.api.call('nvmet.port.delete', [existing.id, { force: true }]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/** Links a port to a subsystem. */
export async function associateNvmeOfPort(
  client: E2eApiClient,
  { subsystemId, portId }: { subsystemId: number; portId: number },
): Promise<void> {
  await firstValueFrom(
    client.api.call('nvmet.port_subsys.create', [{ port_id: portId, subsys_id: subsystemId }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Links a host to a subsystem. The subsystem should not allow any host, or the link means nothing. */
export async function associateNvmeOfHost(
  client: E2eApiClient,
  { subsystemId, hostId }: { subsystemId: number; hostId: number },
): Promise<void> {
  await firstValueFrom(
    client.api.call('nvmet.host_subsys.create', [{ host_id: hostId, subsys_id: subsystemId }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Restricts a subsystem to its linked hosts, or opens it to any host. */
export async function setNvmeOfAllowAnyHost(
  client: E2eApiClient,
  { subsystemId, allowAnyHost }: { subsystemId: number; allowAnyHost: boolean },
): Promise<void> {
  await firstValueFrom(
    client.api.call('nvmet.subsys.update', [subsystemId, { allow_any_host: allowAnyHost }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Adds a namespace on an existing zvol (`pool/child`) to a subsystem. */
export async function addNvmeOfZvolNamespace(
  client: E2eApiClient,
  { subsystemId, zvol }: { subsystemId: number; zvol: string },
): Promise<void> {
  const params = {
    subsys_id: subsystemId,
    device_type: 'ZVOL',
    device_path: zvolDevicePath(zvol),
  } as CallParams<E2eApiDirectory, 'nvmet.namespace.create'>[0];
  await firstValueFrom(
    client.api.call('nvmet.namespace.create', [params]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * A subsystem with one namespace on its own zvol, linked to its own port and host,
 * and restricted to that host — the shape every association card shows filled in.
 */
export async function provisionLinkedNvmeOfSubsystem(
  client: E2eApiClient,
  {
    name,
    zvol,
    port,
    hostnqn,
  }: {
    name: string;
    zvol: string;
    port: TcpPort;
    hostnqn: string;
  },
): Promise<NvmeOfSubsystemRecord> {
  await ensureZvolPresent(client, zvol);
  const subsystem = await ensureNvmeOfSubsystemPresent(client, name);
  const portRecord = await ensureNvmeOfPortPresent(client, port);
  const host = await ensureNvmeOfHostPresent(client, hostnqn);

  await addNvmeOfZvolNamespace(client, { subsystemId: subsystem.id, zvol });
  await associateNvmeOfPort(client, { subsystemId: subsystem.id, portId: portRecord.id });
  await setNvmeOfAllowAnyHost(client, { subsystemId: subsystem.id, allowAnyHost: false });
  await associateNvmeOfHost(client, { subsystemId: subsystem.id, hostId: host.id });

  return requireNvmeOfSubsystem(client, name);
}

/** The global base NQN, which middleware prefixes to every generated subsystem NQN. */
export async function readNvmeOfBaseNqn(client: E2eApiClient): Promise<string> {
  const config = await firstValueFrom(client.api.call('nvmet.global.config').pipe(timeout(readTimeoutMs)));

  return config.basenqn;
}

/** Writes the global base NQN back, if it differs. */
export async function restoreNvmeOfBaseNqn(client: E2eApiClient, basenqn: string): Promise<void> {
  if (await readNvmeOfBaseNqn(client) === basenqn) {
    return;
  }

  await firstValueFrom(
    client.api.call('nvmet.global.update', [{ basenqn }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * Returns the NVMe-oF service to stopped and not-auto-starting.
 *
 * The add form offers to start the service only while it is stopped, and the
 * global configuration locks its Implementation choice while it runs.
 */
export async function ensureNvmeOfServiceStopped(client: E2eApiClient): Promise<void> {
  await ensureServiceStopped(
    client,
    nvmeOfServiceName,
    'NVMe-oF service did not stop; the next run will not be offered the start prompt its saves expect.',
  );
}
