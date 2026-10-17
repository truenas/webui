/**
 * Containers global settings: preconditions, cleanup and readback, over the API.
 *
 * The settings are one config record, `lxc.config`, so there is nothing to
 * create or delete. A spec writes the settings each test starts from, and
 * teardown writes back what the appliance held before the spec's first test.
 *
 * Setting a preferred pool creates nothing on it until a container is created
 * there, so it does not pin the pool. The spec clears it anyway before the
 * worker's pool is exported.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type LxcConfig = CallResponse<E2eApiDirectory, 'lxc.config'>;
type LxcUpdate = NonNullable<CallParams<E2eApiDirectory, 'lxc.update'>[0]>;

/** Everything the Global Configuration form shows and saves. */
export type ContainerSettings = Pick<LxcConfig, 'preferred_pool' | 'bridge' | 'v4_network' | 'v6_network'>;

/**
 * Middleware's defaults for the auto-managed bridge (`DEFAULT_V4_NETWORK` and
 * `DEFAULT_V6_NETWORK` in `plugins/container/lxc_config.py`), with no preferred
 * pool. `bridge: null` is the automatic bridge.
 */
export const containerSettingsBaseline: ContainerSettings = {
  preferred_pool: null,
  bridge: null,
  v4_network: '172.200.0.0/24',
  v6_network: 'fd42:4c58:43ae::/64',
};

export async function readContainerConfig(client: E2eApiClient): Promise<ContainerSettings> {
  const config = await firstValueFrom(client.api.call('lxc.config').pipe(timeout(readTimeoutMs)));
  return {
    preferred_pool: config.preferred_pool,
    bridge: config.bridge,
    v4_network: config.v4_network,
    v6_network: config.v6_network,
  };
}

/**
 * Writes the settings. Used for the state a test starts from and for teardown.
 * Never for the change under test, which goes through the form.
 */
export async function setContainerConfig(client: E2eApiClient, settings: ContainerSettings): Promise<void> {
  // A `null` network is how the form clears one too; the generated `lxc.update`
  // input types both networks as optional strings without it.
  await firstValueFrom(
    client.api.call('lxc.update', [settings as LxcUpdate]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** How many containers the appliance has, so a test that opens the create form can show it made none. */
export async function countContainers(client: E2eApiClient): Promise<number> {
  const containers = await firstValueFrom(client.api.query('container.query', []).pipe(timeout(readTimeoutMs)));
  return containers.length;
}
