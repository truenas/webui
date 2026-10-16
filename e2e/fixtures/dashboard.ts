/**
 * Dashboard layout preconditions and cleanup, and the readings its widgets are checked against,
 * over the API.
 *
 * The layout is the `dashState` attribute of the account the whole suite signs in as, written by
 * `DashboardStore.save` with `auth.set_attribute`. Like preferences, it is not an object a test
 * creates and deletes: a test that changes it changes what every later test sees, and
 * `tests/dashboard.e2e.ts` relies on the admin's layout holding System Information. So a spec
 * captures the layout once with {@link captureDashState} and writes it back with
 * {@link restoreDashState}, unconditionally.
 *
 * `null` and a missing attribute are the same layout to webui (`dashState || getDefaultWidgets()`).
 * Middleware has no way to unset an attribute, so restoring an account that never had one writes
 * `null`, which leaves the key behind. Recorded under Known gaps in `docs/status.md`.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** One widget in a group, as `DashboardStore` stores it: `{ type: 'storage' }`. */
export interface DashboardSlot {
  type: string;
  settings?: Record<string, unknown>;
}

/** One row of the dashboard: `full`, `halves`, `quarters-and-half` and so on. */
export interface DashboardGroup {
  layout: string;
  slots: DashboardSlot[];
}

/**
 * What the account held before a test changed it.
 *
 * `value` is opaque, not {@link DashboardGroup}[]: an account saved by an older webui can hold the
 * old dashboard's format, and restoring it means writing back exactly what was found. Wrapped so
 * that "nothing captured yet" (`undefined`) cannot be confused with "the attribute was absent".
 */
export interface CapturedDashState {
  value: unknown;
}

/** The signed-in account's `dashState`, or undefined when it has none. */
export async function readDashState(client: E2eApiClient): Promise<unknown> {
  const me = await firstValueFrom(client.api.call('auth.me').pipe(timeout(readTimeoutMs)));

  return (me as { attributes?: { dashState?: unknown } }).attributes?.dashState;
}

async function setDashState(client: E2eApiClient, value: unknown): Promise<void> {
  await firstValueFrom(
    client.api.call('auth.set_attribute', ['dashState', value]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Replaces the layout. `null` is the default layout. */
export async function writeDashState(client: E2eApiClient, groups: DashboardGroup[] | null): Promise<void> {
  await setDashState(client, groups);
}

export async function captureDashState(client: E2eApiClient): Promise<CapturedDashState> {
  return { value: await readDashState(client) };
}

/** Writes back what {@link captureDashState} found, or `null` where the account had none. */
export async function restoreDashState(client: E2eApiClient, captured: CapturedDashState): Promise<void> {
  await setDashState(client, captured.value ?? null);
}

/** The fields of an `interface.query` row the network widgets show. */
interface InterfaceEntry {
  name: string;
  /** `PHYSICAL`, `VLAN`, `LINK_AGGREGATION`, `BRIDGE` or `UNKNOWN`. */
  type: string;
  /** The member ports of a `LINK_AGGREGATION`. */
  lag_ports?: string[];
  state: {
    link_state: string;
    aliases: {
      type: string;
      address: string;
    }[];
  };
}

/** A NIC as the Interface and IPv4 Address cards show it. */
export interface DashboardNic {
  name: string;
  /** `LINK_STATE_UP`, `LINK_STATE_DOWN` or `LINK_STATE_UNKNOWN`. */
  linkState: string;
  /** Every `INET` alias, in `interface.query` order, without repeats. */
  ipv4Addresses: string[];
}

function toDashboardNic(entry: InterfaceEntry): DashboardNic {
  const addresses = entry.state.aliases
    .filter((alias) => alias.type === 'INET')
    .map((alias) => alias.address);

  return {
    name: entry.name,
    linkState: entry.state.link_state,
    ipv4Addresses: [...new Set(addresses)],
  };
}

/**
 * The `interface.query` rows the network cards can show.
 *
 * webui's `processNetworkInterfaces` folds each VLAN into its parent and each link aggregation's
 * member ports into the aggregation, and drops the folded rows from the list the cards pick from.
 * A card asked for one of those rows answers "Network interface … not found."
 */
async function queryDashboardInterfaces(client: E2eApiClient): Promise<InterfaceEntry[]> {
  const response = await firstValueFrom(client.api.query('interface.query', []).pipe(timeout(readTimeoutMs)));
  const interfaces = response as unknown as InterfaceEntry[];
  const laggMembers = new Set(interfaces.flatMap((entry) => entry.lag_ports ?? []));

  return interfaces.filter((entry) => entry.type !== 'VLAN' && !laggMembers.has(entry.name));
}

/**
 * The name of the NIC the default layout's network cards show.
 *
 * Both cards fall back to the first NIC in webui's list when their settings name none.
 */
export async function readFirstNicName(client: E2eApiClient): Promise<string> {
  const [nic] = await queryDashboardInterfaces(client);
  if (!nic) {
    throw new Error('interface.query reports no NIC for the Dashboard\'s network cards to show.');
  }

  return nic.name;
}

/**
 * A physical NIC with an IPv4 address of its own, so the IPv4 Address card has something to show.
 *
 * Physical, because webui adds a link aggregation's member addresses to the aggregation's own, and
 * {@link DashboardNic} reads only the row's. A physical NIC that is not a member shows exactly that.
 */
export async function readNicWithIpv4(client: E2eApiClient): Promise<DashboardNic> {
  const nic = (await queryDashboardInterfaces(client))
    .filter((entry) => entry.type === 'PHYSICAL')
    .map(toDashboardNic)
    .find((entry) => entry.ipv4Addresses.length > 0);
  if (!nic) {
    throw new Error('interface.query reports no physical NIC with an IPv4 address.');
  }

  return nic;
}

/** The fields of a `pool.query` row the Storage card's tile shows its name and status from. */
export interface DashboardPool {
  name: string;
  /** `ONLINE` for a healthy imported pool. */
  status: string;
  healthy: boolean;
}

/** How many pools the Storage card gives a tile: `poolsInfo().slice(0, 6)`. */
const storageCardPoolLimit = 6;

/**
 * A pool the Storage card shows: `preferred` when it has a tile, otherwise the first pool listed.
 *
 * The card shows the first six pools in unfiltered `pool.query` order, so on an appliance with
 * more, the pool a spec's `pool` fixture provided may have no tile at all.
 */
export async function readShownPool(client: E2eApiClient, preferred: string): Promise<DashboardPool> {
  const response = await firstValueFrom(client.api.query('pool.query', []).pipe(timeout(readTimeoutMs)));
  const shown = (response as unknown as DashboardPool[]).slice(0, storageCardPoolLimit);
  const entry = shown.find((pool) => pool.name === preferred) ?? shown[0];
  if (!entry) {
    throw new Error('pool.query reports no pool for the Storage card to show.');
  }

  const { name, status, healthy } = entry;

  return { name, status, healthy };
}
