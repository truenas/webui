/**
 * Network interface preconditions, cleanup and readback, over the API.
 *
 * Interface edits are staged: `interface.create`, `update` and `delete` only
 * write the database, and nothing reaches the NIC until `interface.commit`
 * (Test Changes) and `interface.checkin` (Save Changes). `interface.rollback`
 * (Revert Changes) throws the staged edits away. So a spec here can stage
 * anything and revert it without the appliance's network ever changing.
 *
 * **Nothing here commits, and no spec using it may.** The CI appliance has one
 * NIC, the one the suite talks to; a commit re-applies its configuration and
 * can drop the socket the whole run depends on.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** The fields of an `interface.query` row the Interfaces card shows or a spec checks. */
export interface InterfaceRecord {
  /** The same as `name`, and what `interface.available_fec_modes` takes. */
  id: string;
  name: string;
  /** `PHYSICAL`, `VLAN`, `LINK_AGGREGATION`, `BRIDGE` or `UNKNOWN`. */
  type: string;
  description: string;
  ipv4_dhcp: boolean;
  /** Configured addresses, not DHCP's lease: that is in `state.aliases`. */
  aliases: { address: string; netmask: number }[];
  mtu: number | null;
  vlan_parent_interface?: string | null;
  vlan_tag?: number | null;
  bridge_members?: string[];
  enable_learning?: boolean;
  lag_protocol?: string;
  lag_ports?: string[];
  state: {
    permanent_link_address?: string | null;
    aliases: {
      /** `INET`, `INET6` or `LINK`. */
      type: string;
      address: string;
    }[];
  };
}

/** A physical NIC as the Interfaces card shows it. */
export interface ManagementInterface {
  name: string;
  /** Every `INET` address in `state.aliases`: what DHCP leased, since none is configured. */
  ipv4Addresses: string[];
  macAddress: string;
}

export async function listInterfaces(client: E2eApiClient): Promise<InterfaceRecord[]> {
  const response = await firstValueFrom(client.api.query('interface.query', []).pipe(timeout(readTimeoutMs)));

  return response as unknown as InterfaceRecord[];
}

/** An interface by name, staged or applied, or undefined. `query`, not `queryOne`: absence is ordinary here. */
export async function findInterface(client: E2eApiClient, name: string): Promise<InterfaceRecord | undefined> {
  const response = await firstValueFrom(
    client.api.query('interface.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  const [found] = response as unknown as InterfaceRecord[];

  return found;
}

function ipv4AddressesOf(entry: InterfaceRecord): string[] {
  return entry.state.aliases
    .filter((alias) => alias.type === 'INET')
    .map((alias) => alias.address);
}

/**
 * The physical NIC carrying an IPv4 address: on the CI appliance, its only NIC
 * and the one the suite reaches it through.
 *
 * Its name differs per machine (`ens3`, `enp0s2`), so it is never written
 * into a spec. The suite reaches CI's appliance through a forwarded port on
 * the host, so its own address cannot pick the NIC out; the lease can.
 */
export async function findManagementInterface(client: E2eApiClient): Promise<ManagementInterface> {
  const interfaces = await listInterfaces(client);
  const nic = interfaces.find((entry) => entry.type === 'PHYSICAL' && ipv4AddressesOf(entry).length > 0);
  if (!nic) {
    const names = interfaces.map((entry) => entry.name).join(', ');
    throw new Error(`interface.query reports no physical NIC with an IPv4 address: ${names}`);
  }

  const macAddress = nic.state.permanent_link_address;
  if (!macAddress) {
    throw new Error(`interface.query reports no permanent_link_address for ${nic.name}`);
  }

  return { name: nic.name, ipv4Addresses: ipv4AddressesOf(nic), macAddress };
}

/** The physical NIC's IPv4 addresses as the system has them now, which nothing staged changes. */
export async function readIpv4Addresses(client: E2eApiClient, name: string): Promise<string[]> {
  const entry = await findInterface(client, name);
  if (!entry) {
    throw new Error(`interface.query reports no interface named ${name}`);
  }

  return ipv4AddressesOf(entry);
}

export async function hasPendingInterfaceChanges(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(client.api.call('interface.has_pending_changes').pipe(timeout(readTimeoutMs)));
}

/**
 * Whether the interface form follows its save with "Set Gateway and DNS": it
 * does when this names anything. Read it after the save, so the answer is the
 * one the form got for the same staged state. An appliance with a static
 * gateway and DNS, or one where an earlier run pressed Register, answers empty.
 */
export async function hasNetworkConfigToBeRemoved(client: E2eApiClient): Promise<boolean> {
  const response = await firstValueFrom(
    client.api.call('interface.network_config_to_be_removed').pipe(timeout(readTimeoutMs)),
  );

  return Object.keys(response as unknown as Record<string, unknown>).length > 0;
}

/**
 * What the Add form offers as Bridge Members: every interface not already a
 * bridge's member, a LAGG's port or a VM's NIC.
 */
export async function readBridgeMembersChoices(client: E2eApiClient): Promise<Record<string, string>> {
  return firstValueFrom(client.api.call('interface.bridge_members_choices', []).pipe(timeout(readTimeoutMs)));
}

/**
 * What the Add form offers as Link Aggregation Interfaces. Middleware leaves out
 * any interface with a row in its database, so a NIC left to autoconfigure is
 * offered and one that was ever saved is not.
 */
export async function readLagPortsChoices(client: E2eApiClient): Promise<Record<string, string>> {
  return firstValueFrom(client.api.call('interface.lag_ports_choices', []).pipe(timeout(readTimeoutMs)));
}

export async function readLacpduRateChoices(client: E2eApiClient): Promise<Record<string, string>> {
  const choices = await firstValueFrom(client.api.call('interface.lacpdu_rate_choices').pipe(timeout(readTimeoutMs)));

  return { ...choices };
}

/** Empty for a NIC that does not support FEC, which a virtio NIC does not. */
export async function readAvailableFecModes(client: E2eApiClient, id: string): Promise<string[]> {
  return firstValueFrom(client.api.call('interface.available_fec_modes', [id]).pipe(timeout(readTimeoutMs)));
}

/**
 * Leaves no staged interface edit behind, for `beforeEach` and `afterEach`.
 *
 * Rollback first: whatever is staged is a spec's leftover, and throwing it away
 * is the only answer that cannot touch the NIC. A commit waiting for its check-in
 * should never be found here, since nothing in this suite commits; if one is,
 * rollback has already restored the previous configuration, and the check-in
 * only ends the wait so the UI stops counting down.
 */
export async function ensureNoPendingInterfaceChanges(client: E2eApiClient): Promise<void> {
  if (await hasPendingInterfaceChanges(client)) {
    await firstValueFrom(client.api.call('interface.rollback').pipe(timeout(slowCallTimeoutMs)));
  }

  const checkinWaiting = await firstValueFrom(
    client.api.call('interface.checkin_waiting').pipe(timeout(readTimeoutMs)),
  );
  if (checkinWaiting !== null) {
    await firstValueFrom(client.api.call('interface.checkin').pipe(timeout(slowCallTimeoutMs)));
  }
}

/**
 * Stages a VLAN on `parent`, with no addresses: written to the database and
 * nothing more, so the page has a pending change to show. Never for the VLAN
 * under test in an add — that one goes through the form.
 */
export async function stageVlan(
  client: E2eApiClient,
  { name, parent, tag }: { name: string; parent: string; tag: number },
): Promise<void> {
  await firstValueFrom(
    client.api.call('interface.create', [{
      type: 'VLAN',
      name,
      vlan_parent_interface: parent,
      vlan_tag: tag,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
