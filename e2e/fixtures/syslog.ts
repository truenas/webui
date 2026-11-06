/**
 * Syslog settings (part of `system.advanced`): preconditions, cleanup and readback, over the API.
 *
 * Each test starts from a baseline that teardown writes back; like `fixtures/preferences.ts`, it doesn't
 * snapshot, or an interrupted run would make the next run's "original" whatever the last test set. The baseline
 * is middleware's default (no remote servers, level Info, FQDN and audit logs off); a run clears any real log
 * forwarding. Server addresses are in RFC 5737's 192.0.2.0/24, so no log server is ever reached.
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
