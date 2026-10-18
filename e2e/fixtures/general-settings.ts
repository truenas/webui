/**
 * System > General Settings' own record, `system.general.config`, read over the API.
 *
 * Only reading: the timezone has its writer in `fixtures/localization.ts`, and
 * nothing else on the record is written by a test.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

type GeneralConfig = CallResponse<E2eApiDirectory, 'system.general.config'>;

/** What the GUI and Localization cards edit that a test reads back. */
export type GeneralSettings = Pick<GeneralConfig, 'kbdmap' | 'timezone' | 'ui_port'>;

/** The settings as the appliance holds them. */
export async function readGeneralSettings(client: E2eApiClient): Promise<GeneralSettings> {
  const config = await firstValueFrom(client.api.call('system.general.config').pipe(timeout(readTimeoutMs)));

  return {
    kbdmap: config.kbdmap,
    timezone: config.timezone,
    ui_port: config.ui_port,
  };
}
