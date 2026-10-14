/**
 * Syslog settings: preconditions, cleanup and readback, over the API.
 *
 * These four settings are part of `system.advanced`, a single config record.
 * There is nothing to create or delete, so each test starts from a known
 * baseline and teardown writes that baseline back. Like
 * `fixtures/preferences.ts`, it does not snapshot what it found and restore that.
 * A run interrupted between a change and its restore would make the next run's
 * "original" whatever the last test had set.
 *
 * The baseline is middleware's own default: no remote servers, level Info, and
 * FQDN and audit logs off. That is what a fresh appliance holds. On an
 * appliance someone has set up to forward its logs, a run clears that setup.
 *
 * Every server address is in 192.0.2.0/24, which RFC 5737 reserves for
 * documentation. The appliance never really reaches a log server, wherever it
 * runs.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type AdvancedConfig = CallResponse<E2eApiDirectory, 'system.advanced.config'>;

/** The part of `system.advanced` the Syslog card shows and its form edits. */
export type SyslogSettings = Pick<AdvancedConfig, 'fqdn_syslog' | 'sysloglevel' | 'syslog_audit' | 'syslogservers'>;

/** Middleware's defaults for the four settings. */
export const syslogBaseline: SyslogSettings = {
  fqdn_syslog: false,
  sysloglevel: 'F_INFO',
  syslog_audit: false,
  syslogservers: [],
};

/** The four settings as the appliance holds them. */
export async function readSyslogSettings(client: E2eApiClient): Promise<SyslogSettings> {
  const config = await firstValueFrom(client.api.call('system.advanced.config').pipe(timeout(readTimeoutMs)));

  return {
    fqdn_syslog: config.fqdn_syslog,
    sysloglevel: config.sysloglevel,
    syslog_audit: config.syslog_audit,
    syslogservers: config.syslogservers,
  };
}

/**
 * Writes all four settings. Used for the baseline, and for the state a test
 * starts from. Never for the change under test, which goes through the form.
 *
 * A slow call, because saving rewrites the syslog daemon's configuration and
 * reloads it.
 */
export async function setSyslogSettings(client: E2eApiClient, settings: SyslogSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('system.advanced.update', [{
      fqdn_syslog: settings.fqdn_syslog,
      sysloglevel: settings.sysloglevel,
      syslog_audit: settings.syslog_audit,
      syslogservers: settings.syslogservers,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
