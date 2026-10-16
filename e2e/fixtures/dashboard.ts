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
  type: string;
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

async function queryInterfaces(client: E2eApiClient): Promise<InterfaceEntry[]> {
  const interfaces = await firstValueFrom(client.api.query('interface.query', []).pipe(timeout(readTimeoutMs)));

  return interfaces as unknown as InterfaceEntry[];
}

/**
 * The NIC the default layout's network cards show: the first `interface.query` row.
 *
 * Both cards fall back to the first NIC when their settings name none. webui folds VLANs into
 * their parent before taking it, so a VLAN is skipped here too.
 */
export async function readFirstNic(client: E2eApiClient): Promise<DashboardNic> {
  const nic = (await queryInterfaces(client)).find((entry) => entry.type !== 'VLAN');
  if (!nic) {
    throw new Error('interface.query reports no NIC for the Dashboard\'s network cards to show.');
  }

  return toDashboardNic(nic);
}

/** The first NIC with an IPv4 address, so the IPv4 Address card has something to show. */
export async function readNicWithIpv4(client: E2eApiClient): Promise<DashboardNic> {
  const nic = (await queryInterfaces(client))
    .map(toDashboardNic)
    .find((entry) => entry.ipv4Addresses.length > 0);
  if (!nic) {
    throw new Error('interface.query reports no NIC with an IPv4 address.');
  }

  return nic;
}

/** The fields of a `pool.query` row the Storage card's status line is computed from. */
export interface PoolHealth {
  /** `ONLINE` for a healthy imported pool. */
  status: string;
  healthy: boolean;
}

export async function readPoolHealth(client: E2eApiClient, pool: string): Promise<PoolHealth> {
  const [entry] = await firstValueFrom(
    client.api.query('pool.query', [['name', '=', pool]]).pipe(timeout(readTimeoutMs)),
  );
  if (!entry) {
    throw new Error(`pool.query reports no pool named "${pool}".`);
  }

  const { status, healthy } = entry as unknown as PoolHealth;

  return { status, healthy };
}
