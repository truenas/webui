/**
 * Network interface preconditions, cleanup and readback, over the API.
 *
 * Interface edits are staged: `interface.create`, `update` and `delete` only
 * write the database, and nothing reaches the NIC until `interface.commit`
 * (Test Changes) and `interface.checkin` (Save Changes). `interface.rollback`
 * (Revert Changes) throws the staged edits away. So a spec here can stage
 * anything and revert it without the appliance's network ever changing.
 *
 * **Only `network-interfaces-commit.e2e.ts` commits**, through the helpers at
 * the end of this file, and only on an appliance with a spare NIC. A commit
 * re-applies every interface, the one the suite talks to included, and can drop
 * the socket the whole run depends on. Every other spec stages and reverts.
 */
import { expect } from '@playwright/test';
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
    /** The MAC in use, which for a physical NIC is the one qemu was given. */
    link_address?: string | null;
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
 * is found here only when a spec stopped between Test Changes and Save Changes;
 * rollback has then already restored the previous configuration, and the
 * check-in only ends the wait so the UI stops counting down.
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

/*
 * Committing, for `network-interfaces-commit.e2e.ts` alone: see the note at the top.
 */

/**
 * Seconds middleware waits for `interface.checkin` before it rolls a commit
 * back by itself. Twice the page's default: a commit that restarts DHCP on the
 * NIC the suite talks to drops the socket, and the check-in has to wait for the
 * reconnect.
 */
const apiCommitCheckinTimeoutSeconds = 120;

/** A ceiling on a commit being seen waiting for its check-in, reconnect included. */
const commitLandsTimeoutMs = 90_000;

/**
 * The physical NIC whose MAC is `mac`, as `TN_SPARE_NICS` names it, or
 * undefined. Matched by MAC because nothing else picks it out: its name differs
 * per machine, and "the NIC with no address" matches every NIC, since each one
 * has an IPv6 link-local address.
 */
export async function findSpareInterface(client: E2eApiClient, mac: string): Promise<InterfaceRecord | undefined> {
  const wanted = mac.toLowerCase();

  return (await listInterfaces(client)).find((entry) => {
    return entry.type === 'PHYSICAL' && entry.state.link_address?.toLowerCase() === wanted;
  });
}

/** Every VLAN, bridge or LAGG that `nic` is the parent, a member or a port of. */
export async function findInterfacesOn(client: E2eApiClient, nic: string): Promise<InterfaceRecord[]> {
  return (await listInterfaces(client)).filter((entry) => {
    return entry.vlan_parent_interface === nic
      || Boolean(entry.bridge_members?.includes(nic))
      || Boolean(entry.lag_ports?.includes(nic));
  });
}

/**
 * Whether `nic` has a row in `network.interfaces`. Nothing in `interface.query`
 * says so, so this reads it off `interface.lag_ports_choices`, which leaves out
 * every NIC that has a row. That choice also leaves out a NIC that is already a
 * bridge member, a LAGG port or a VLAN parent, so call this only when `nic` is
 * none of those.
 */
export async function hasInterfaceRow(client: E2eApiClient, nic: string): Promise<boolean> {
  return !(nic in await readLagPortsChoices(client));
}

export async function readCheckinWaiting(client: E2eApiClient): Promise<number | null> {
  return firstValueFrom(client.api.call('interface.checkin_waiting').pipe(timeout(readTimeoutMs)));
}

/**
 * Applies whatever is staged and keeps it: `interface.commit` with a rollback
 * timer, then `interface.checkin`, the API's Test Changes and Save Changes.
 *
 * A commit can restart DHCP on the NIC the suite talks to, and the answer can
 * be lost with the socket, so a failed call does not mean a failed commit.
 * `interface.checkin_waiting` says whether the commit landed. A commit that
 * really failed has already rolled itself back, and the poll then reports what
 * the call answered.
 */
export async function commitInterfaceChanges(client: E2eApiClient, whatItCosts: string): Promise<void> {
  let commitAnswer = '';
  try {
    await firstValueFrom(
      client.api.call('interface.commit', [{
        rollback: true,
        checkin_timeout: apiCommitCheckinTimeoutSeconds,
      }]).pipe(timeout(slowCallTimeoutMs)),
    );
  } catch (error) {
    commitAnswer = ` interface.commit answered: ${error instanceof Error ? error.message : String(error)}.`;
  }

  await expect.poll(
    () => readCheckinWaiting(client),
    {
      message: `interface.commit should be waiting for its check-in.${commitAnswer} ${whatItCosts}`,
      timeout: commitLandsTimeoutMs,
    },
  ).not.toBeNull();

  await firstValueFrom(client.api.call('interface.checkin').pipe(timeout(slowCallTimeoutMs)));
  expect(await hasPendingInterfaceChanges(client), `Nothing should be pending after the check-in. ${whatItCosts}`)
    .toBe(false);
}

/**
 * Saves the management NIC to the database as DHCP, as it already runs, and
 * commits that. Returns whether it added the row. A NIC that already has a row
 * is left alone, and this returns false.
 *
 * A fresh appliance has an empty `network.interfaces` table, and middleware
 * runs DHCP on every NIC. Once the table holds any row, `interface.sync`
 * unconfigures every NIC without one. So committing a VLAN on the spare NIC
 * would take the management NIC's address away, unless this row is there first.
 * Its lease does not change, so the socket survives the commit.
 */
export async function pinManagementInterface(client: E2eApiClient, nic: ManagementInterface): Promise<boolean> {
  if (await hasInterfaceRow(client, nic.name)) {
    return false;
  }

  await firstValueFrom(
    client.api.call('interface.update', [nic.name, { ipv4_dhcp: true }]).pipe(timeout(slowCallTimeoutMs)),
  );
  await commitInterfaceChanges(
    client,
    `${nic.name} was staged as DHCP and may still be, and a later commit would then unconfigure the NIC the suite talks to.`,
  );

  return true;
}

/**
 * Removes the row `pinManagementInterface` added, so the table is empty again
 * and middleware runs DHCP on every NIC, as on a fresh appliance. That restarts
 * DHCP on the management NIC. The socket drops and reconnects, and qemu hands
 * out the same address.
 */
export async function unpinManagementInterface(client: E2eApiClient, name: string): Promise<void> {
  await firstValueFrom(client.api.call('interface.delete', [name]).pipe(timeout(slowCallTimeoutMs)));
  await commitInterfaceChanges(
    client,
    `${name} keeps a DHCP row in network.interfaces, so every later spec runs on an appliance unlike a fresh one.`,
  );
}

/**
 * Deletes every VLAN, bridge and LAGG built on the spare NIC `nic`, and any row
 * `nic` has itself. A bridge or LAGG can leave that row behind, and a spare is
 * never configured, so a row there is always a leftover, whichever run left it.
 * Then it commits, so `nic` ends with no address, no row and nothing built on it.
 */
export async function ensureNothingOnSpareInterface(client: E2eApiClient, nic: string): Promise<void> {
  await ensureNoPendingInterfaceChanges(client);

  const built = await findInterfacesOn(client, nic);
  for (const entry of built) {
    await firstValueFrom(client.api.call('interface.delete', [entry.id]).pipe(timeout(slowCallTimeoutMs)));
  }
  // Read once nothing built on `nic` is left, which is when `hasInterfaceRow` can tell.
  const hasRow = await hasInterfaceRow(client, nic);
  if (hasRow) {
    await firstValueFrom(client.api.call('interface.delete', [nic]).pipe(timeout(slowCallTimeoutMs)));
  }

  if (built.length > 0 || hasRow) {
    const names = built.map((entry) => entry.name).join(', ');
    await commitInterfaceChanges(client, `${names || nic} may still be configured on ${nic}.`);
  }

  expect(await findInterfacesOn(client, nic), `Nothing should be built on ${nic} any more`).toEqual([]);
  expect(await hasInterfaceRow(client, nic), `${nic} should have no row in network.interfaces`).toBe(false);
  const spare = await findInterface(client, nic);
  expect(spare && ipv4AddressesOf(spare), `${nic} should hold no IPv4 address`).toEqual([]);
}
