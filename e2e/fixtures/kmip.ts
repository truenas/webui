/**
 * The KMIP configuration: preconditions, cleanup and readback, over the API.
 *
 * `kmip.config` is a single config record, so — as in `fixtures/kernel.ts` —
 * there is nothing to create or delete. The spec reads it once and writes it
 * back. Writing it is the `kmip.update` job.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

export type KmipConfig = CallResponse<E2eApiDirectory, 'kmip.config'>;

/** The fields the spec puts back. `id` and `ssl_version` are never written by the page. */
export type KmipSettings = Pick<
  KmipConfig,
  'server' | 'port' | 'certificate' | 'certificate_authority' | 'manage_zfs_keys' | 'manage_sed_disks'
>;

/**
 * How long one `kmip.update` may take, through the page or over the API.
 *
 * With KMIP left disabled the job validates and writes the row, and starts
 * nothing (`plugins/kmip/config.py`). An enable without a certificate authority
 * is refused in validation, before any connection is tried. Both should take
 * seconds; this is a ceiling, not measured on the CI appliance.
 */
export const kmipSaveTimeoutMs = slowCallTimeoutMs;

export async function readKmipConfig(client: E2eApiClient): Promise<KmipConfig> {
  return firstValueFrom(client.api.call('kmip.config').pipe(timeout(readTimeoutMs)));
}

export async function isKmipSyncPending(client: E2eApiClient): Promise<boolean> {
  return firstValueFrom(client.api.call('kmip.kmip_sync_pending').pipe(timeout(readTimeoutMs)));
}

export function kmipSettingsOf(config: KmipConfig): KmipSettings {
  return {
    server: config.server,
    port: config.port,
    certificate: config.certificate,
    certificate_authority: config.certificate_authority,
    manage_zfs_keys: config.manage_zfs_keys,
    manage_sed_disks: config.manage_sed_disks,
  };
}

/**
 * Writes `settings` back with KMIP disabled and without contacting a server,
 * unless the appliance already holds exactly that.
 *
 * For the state a test starts from and for teardown. Never for the change under
 * test, which goes through the page.
 */
export async function restoreKmipConfig(client: E2eApiClient, settings: KmipSettings): Promise<void> {
  const current = await readKmipConfig(client);
  const held = kmipSettingsOf(current);
  const keys = Object.keys(settings) as (keyof KmipSettings)[];
  if (!current.enabled && keys.every((key) => held[key] === settings[key])) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('kmip.update', [{ ...settings, enabled: false, validate: false }]),
    {
      timeoutMs: kmipSaveTimeoutMs,
      whatItCosts: 'The KMIP configuration was not put back, so the next run starts from whatever this one left.',
    },
  );
}
