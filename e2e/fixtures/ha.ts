/**
 * What the HA journeys check over the API, and the license they upload.
 *
 * The journeys set HA up through the UI; these only read what middleware made
 * of it. Everything is asked of one node — the one the client is connected
 * to — because a standby takes no logins of its own (it answers REDIRECT to
 * the VIP). Its state shows anyway: while the peer is down, unlicensed, or
 * out of step, the active node's `failover.disabled.reasons` says so.
 */
import { readFileSync } from 'node:fs';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import type { HaTarget, TargetConfig } from '../support/config';
import { readTimeoutMs } from '../support/timeouts';

/**
 * The pair, from a config the HA projects can only have been given with one:
 * `playwright.config.ts` defines them only when `TN_HA=true`.
 */
export function requireHa(config: TargetConfig): HaTarget {
  if (!config.ha) {
    throw new Error('The HA suite ran without an HA pair: TN_HA is not "true"');
  }
  return config.ha;
}

/** What a node says about HA. */
export interface FailoverState {
  licensed: boolean;
  /** `SINGLE` until there is a VIP; then `MASTER` or `BACKUP`. */
  status: string;
  /** `A` or `B`, by the SMBIOS serial; `MANUAL` on hardware that is not HA capable. */
  node: string;
  /** Empty when HA is healthy and failover is on. */
  reasons: string[];
}

export async function readFailover(client: E2eApiClient): Promise<FailoverState> {
  const [licensed, status, node, reasons] = await Promise.all([
    firstValueFrom(client.api.call('failover.licensed').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('failover.status').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('failover.node').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('failover.disabled.reasons').pipe(timeout(readTimeoutMs))),
  ]);
  return {
    licensed, status: String(status), node: String(node), reasons: reasons.map(String),
  };
}

/**
 * `failover.licensed` alone, which is what webui's `selectIsHaLicensed` reflects. For a spec that
 * only needs to know which kind of appliance it is on, without {@link readFailover}'s other calls.
 */
export async function isHaLicensed(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(client.api.call('failover.licensed').pipe(timeout(readTimeoutMs)));
}

/**
 * The other controller's boot, as the connected one sees it: `null` while it
 * cannot reach it. A new value means the other controller has rebooted.
 */
export async function readPeerBootId(client: E2eApiClient): Promise<string | null> {
  const info = await firstValueFrom(client.api.call('failover.reboot.info').pipe(timeout(readTimeoutMs)));
  return info.other_node?.boot_id ?? null;
}

/** Whether automatic failover is on: `failover.config`'s `disabled`, inverted. */
export async function isFailoverEnabled(client: E2eApiClient): Promise<boolean> {
  const config = await firstValueFrom(client.api.call('failover.config').pipe(timeout(readTimeoutMs)));
  return !config.disabled;
}

/** The HA-relevant part of an interface's configuration. */
export interface HaInterfaceConfig {
  dhcp: boolean;
  aliases: string[];
  failoverAliases: string[];
  virtualAliases: string[];
  critical: boolean;
  group: number | null;
}

/** The interface carrying `address`: on a fresh pair, the one DHCP gave it. */
export async function findInterfaceWith(client: E2eApiClient, address: string): Promise<string> {
  const interfaces = await firstValueFrom(client.api.query('interface.query', []).pipe(timeout(readTimeoutMs)));
  const found = interfaces.find((iface) => iface.state.aliases.some((alias) => alias.address === address));
  if (!found) {
    throw new Error(
      `No interface carries ${address}: ${interfaces.map((iface) => iface.name).join(', ') || 'none at all'}`,
    );
  }
  return found.name;
}

export async function readHaInterface(client: E2eApiClient, name: string): Promise<HaInterfaceConfig> {
  const [iface] = await firstValueFrom(
    client.api.query('interface.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  if (!iface) {
    throw new Error(`No interface named ${name}`);
  }
  return {
    dhcp: iface.ipv4_dhcp,
    aliases: iface.aliases.map((alias) => `${alias.address}/${alias.netmask}`),
    failoverAliases: (iface.failover_aliases ?? []).map((alias) => alias.address),
    virtualAliases: (iface.failover_virtual_aliases ?? []).map((alias) => alias.address),
    critical: Boolean(iface.failover_critical),
    group: iface.failover_group ?? null,
  };
}

/**
 * Whether the UI will put the EULA up after the license: only on what the
 * entitlement facts call TrueNAS hardware, and only until it is accepted —
 * the same two questions `EulaEffects` asks. An HA pair of VMs is IXKVM,
 * which counts as TrueNAS hardware, but reading it beats assuming it.
 */
export async function expectsEula(client: E2eApiClient): Promise<boolean> {
  const [facts, accepted] = await Promise.all([
    firstValueFrom(client.api.call('truenas.entitlements.facts').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('truenas.is_eula_accepted').pipe(timeout(readTimeoutMs))),
  ]);
  return String(facts.hardware_type) === 'TRUENAS' && !accepted;
}

export async function isEulaAccepted(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(client.api.call('truenas.is_eula_accepted').pipe(timeout(readTimeoutMs)));
}

export async function poolNames(client: E2eApiClient): Promise<string[]> {
  const pools = await firstValueFrom(client.api.query('pool.query', []).pipe(timeout(readTimeoutMs)));
  return pools.map((pool) => pool.name);
}

/** The license the workflow fetched for this run, read from the file it named. */
export function readHaLicense(file: string): string {
  const pem = readFileSync(file, 'utf8').trim();
  if (!pem.includes('-----BEGIN TRUENAS LICENSE-----')) {
    throw new Error(`${file} does not hold a TrueNAS license`);
  }
  return pem;
}

/**
 * Whether turning DHCP off will drop a default gateway DHCP gave: there is a
 * default route and none of it was configured. That is when the interface form
 * follows its save with "Set Gateway and DNS".
 */
export async function dropsDhcpGateway(client: E2eApiClient): Promise<boolean> {
  const [summary, config] = await Promise.all([
    firstValueFrom(client.api.call('network.general.summary').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('network.configuration.config').pipe(timeout(readTimeoutMs))),
  ]);
  return summary.default_routes.some(Boolean) && !config.ipv4gateway;
}
