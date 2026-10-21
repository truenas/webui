/**
 * System > General Settings' own record, `system.general.config`, over the API.
 *
 * The timezone has its writer in `fixtures/localization.ts`. The GUI card's
 * fields are read and written here, for `tests/gui-settings.e2e.ts`. Nothing
 * else on the record is written by a test.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

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

/** Everything the GUI card's Settings form edits, as the appliance holds it. */
export type GuiSettings = Pick<
  GeneralConfig,
  | 'ui_certificate'
  | 'ui_address'
  | 'ui_v6address'
  | 'ui_port'
  | 'ui_httpsport'
  | 'ui_httpsprotocols'
  | 'ui_httpsredirect'
  | 'ui_consolemsg'
  | 'usage_collection'
>;

/**
 * The fields of {@link GuiSettings} a test may write: those that cannot cut the
 * suite off from the appliance.
 *
 * Not the ports, the addresses or HTTPS redirect. In CI the UI reaches the API
 * through a separate nginx proxying the appliance's port 80, so any of those
 * taking effect can end the run.
 */
export type WritableGuiSettings = Partial<
  Pick<GuiSettings, 'ui_certificate' | 'ui_httpsprotocols' | 'ui_consolemsg' | 'usage_collection'>
>;

/** The GUI settings as the appliance holds them. */
export async function readGuiSettings(client: E2eApiClient): Promise<GuiSettings> {
  const config = await firstValueFrom(client.api.call('system.general.config').pipe(timeout(readTimeoutMs)));

  return {
    ui_certificate: config.ui_certificate,
    ui_address: config.ui_address,
    ui_v6address: config.ui_v6address,
    ui_port: config.ui_port,
    ui_httpsport: config.ui_httpsport,
    ui_httpsprotocols: config.ui_httpsprotocols,
    ui_httpsredirect: config.ui_httpsredirect,
    ui_consolemsg: config.ui_consolemsg,
    usage_collection: config.usage_collection,
  };
}

/**
 * What the GUI form's four selects are filled from. Each maps a value to the
 * label its option shows: a certificate's id to its name, an address or a
 * protocol to itself.
 */
export interface GuiChoices {
  certificates: Record<string, string>;
  addresses: Record<string, string>;
  v6addresses: Record<string, string>;
  httpsProtocols: Record<string, string>;
}

/** The choices middleware offers the GUI form, read the way the form reads them. */
export async function readGuiChoices(client: E2eApiClient): Promise<GuiChoices> {
  const read = (
    method: 'system.general.ui_certificate_choices'
      | 'system.general.ui_address_choices'
      | 'system.general.ui_v6address_choices'
      | 'system.general.ui_httpsprotocols_choices',
  ): Promise<Record<string, string>> => firstValueFrom(client.api.call(method).pipe(timeout(readTimeoutMs)));

  return {
    certificates: await read('system.general.ui_certificate_choices'),
    addresses: await read('system.general.ui_address_choices'),
    v6addresses: await read('system.general.ui_v6address_choices'),
    httpsProtocols: await read('system.general.ui_httpsprotocols_choices'),
  };
}

/**
 * Writes some of the GUI settings. For the state a test starts from and for
 * teardown, never for the change under test, which goes through the form.
 *
 * A plain `system.general.update` with no `ui_restart_delay`, so middleware does
 * not restart the web service. It does restart its `ssl` service, which is why
 * this takes the slow budget.
 */
export async function writeGuiSettings(client: E2eApiClient, settings: WritableGuiSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('system.general.update', [settings]).pipe(timeout(slowCallTimeoutMs)),
  );
}
