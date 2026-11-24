/**
 * The appliance's global network configuration (`network.configuration.config`): readback and restore.
 *
 * CI reaches the appliance through qemu's user-mode NAT on DHCP, so nameservers and gateway keep the suite
 * connected. The restore writes only when something differs. Saving the Settings form fills empty nameserver
 * or gateway fields with the live DHCP values and stores them as static, so the restore puts the empty ones back.
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
 * Sets the three nameservers to `nameservers`, in order, emptying the rest.
 * Setup for a spec that depends on what the appliance resolves through — a
 * domain join — never the change under test. Restore with
 * {@link restoreNetworkConfig} from a {@link readNetworkConfig} taken first.
 */
export async function setNameservers(client: E2eApiClient, nameservers: readonly string[]): Promise<void> {
  const [nameserver1 = '', nameserver2 = '', nameserver3 = ''] = nameservers;
  await firstValueFrom(
    client.api.call('network.configuration.update', [{ nameserver1, nameserver2, nameserver3 }])
      .pipe(timeout(slowCallTimeoutMs)),
  );
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
