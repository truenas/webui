/**
 * The appliance's global network configuration: readback and restore, over the API.
 *
 * It is one config record, `network.configuration.config`, and global to the
 * appliance, so a spec that changes it reads it first and writes that back after.
 *
 * The CI appliance is reached through qemu's user-mode NAT on DHCP, so its
 * nameservers and default gateway are what keep the suite connected. The
 * restore writes only when something differs, and a refused save never writes
 * at all. Saving the Settings form does write them, though: the form fills an
 * empty nameserver or gateway with the live value DHCP handed out, so a save
 * stores those as static values, and the restore puts back the empty ones.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { isEqual } from 'lodash-es';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type NetworkConfig = CallResponse<E2eApiDirectory, 'network.configuration.config'>;
type NetworkConfigUpdate = NonNullable<CallParams<E2eApiDirectory, 'network.configuration.update'>[0]>;

/** Every field the Settings form saves on a single controller. */
type NetworkSettingsField
  = | 'hostname'
    | 'domain'
    | 'domains'
    | 'hosts'
    | 'service_announcement'
    | 'nameserver1'
    | 'nameserver2'
    | 'nameserver3'
    | 'ipv4gateway'
    | 'ipv6gateway'
    | 'httpproxy'
    | 'activity';

export type NetworkSettings = Pick<NetworkConfig, NetworkSettingsField>;

export async function readNetworkConfig(client: E2eApiClient): Promise<NetworkSettings> {
  const config = await firstValueFrom(client.api.call('network.configuration.config').pipe(timeout(readTimeoutMs)));
  return {
    hostname: config.hostname,
    domain: config.domain,
    domains: config.domains,
    hosts: config.hosts,
    service_announcement: config.service_announcement,
    nameserver1: config.nameserver1,
    nameserver2: config.nameserver2,
    nameserver3: config.nameserver3,
    ipv4gateway: config.ipv4gateway,
    ipv6gateway: config.ipv6gateway,
    httpproxy: config.httpproxy,
    activity: config.activity,
  };
}

/**
 * The label the Services select shows for an outbound activity, or undefined
 * when the appliance has no activity by that value.
 *
 * `network.configuration.activity_choices` answers `[value, label]` pairs, and
 * the select's option ids are built from the label.
 */
export async function findActivityLabel(client: E2eApiClient, activity: string): Promise<string | undefined> {
  const choices = await firstValueFrom(
    client.api.call('network.configuration.activity_choices').pipe(timeout(readTimeoutMs)),
  );
  return choices.find(([value]) => value === activity)?.[1];
}

/**
 * Writes `settings` back, and only if the appliance holds something else. Never
 * for the change under test, which goes through the form.
 */
export async function restoreNetworkConfig(client: E2eApiClient, settings: NetworkSettings): Promise<void> {
  if (isEqual(await readNetworkConfig(client), settings)) {
    return;
  }

  const update = settings as NetworkConfigUpdate;
  await firstValueFrom(
    client.api.call('network.configuration.update', [update]).pipe(timeout(slowCallTimeoutMs)),
  );
}
