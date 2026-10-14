/**
 * SSH and FTP service settings: preconditions, cleanup and readback, over the API.
 *
 * Each service's settings are a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * Only the fields the specs change are written. The baseline is the stock
 * configuration: each protocol's standard port, the SSH options off, and FTP's
 * usual limits. Nothing depends on it matching a fresh install exactly. On an
 * appliance someone has reconfigured, a run puts these fields back to it.
 *
 * Neither settings test starts its service. Saving a stopped service's
 * settings only rewrites its configuration. On an appliance where SSH is
 * running, the port change restarts it on the new port until teardown.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SshConfig = CallResponse<E2eApiDirectory, 'ssh.config'>;
type FtpConfig = CallResponse<E2eApiDirectory, 'ftp.config'>;

/** The part of `ssh.config` the SSH spec edits, and Kerberos, which it reads to check it was left alone. */
export type SshSettings = Pick<SshConfig, 'tcpport' | 'passwordauth' | 'kerberosauth' | 'tcpfwd'>;

/** The part of `ftp.config` the FTP spec edits: the form's General Options. */
export type FtpSettings = Pick<
  FtpConfig,
  'port' | 'clients' | 'ipconnections' | 'loginattempt' | 'timeout_notransfer' | 'timeout'
>;

/** The SSH baseline: the standard port, and every option the spec turns on, off. */
export const sshBaseline: SshSettings = {
  tcpport: 22,
  passwordauth: false,
  kerberosauth: false,
  tcpfwd: false,
};

/** The FTP baseline: the standard port, and the limits the form shows on a stock appliance. */
export const ftpBaseline: FtpSettings = {
  port: 21,
  clients: 5,
  ipconnections: 2,
  loginattempt: 1,
  timeout_notransfer: 300,
  timeout: 600,
};

/** The four SSH settings as the appliance holds them. */
export async function readSshSettings(client: E2eApiClient): Promise<SshSettings> {
  const config = await firstValueFrom(client.api.call('ssh.config').pipe(timeout(readTimeoutMs)));

  return {
    tcpport: config.tcpport,
    passwordauth: config.passwordauth,
    kerberosauth: config.kerberosauth,
    tcpfwd: config.tcpfwd,
  };
}

/**
 * Writes the four SSH settings. Used for the baseline only, never for the
 * change under test, which goes through the form.
 *
 * A slow call, because saving regenerates the daemon's configuration and
 * reloads it if it is running.
 */
export async function setSshSettings(client: E2eApiClient, settings: SshSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('ssh.update', [{
      tcpport: settings.tcpport,
      passwordauth: settings.passwordauth,
      kerberosauth: settings.kerberosauth,
      tcpfwd: settings.tcpfwd,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The six FTP settings as the appliance holds them. */
export async function readFtpSettings(client: E2eApiClient): Promise<FtpSettings> {
  const config = await firstValueFrom(client.api.call('ftp.config').pipe(timeout(readTimeoutMs)));

  return {
    port: config.port,
    clients: config.clients,
    ipconnections: config.ipconnections,
    loginattempt: config.loginattempt,
    timeout_notransfer: config.timeout_notransfer,
    timeout: config.timeout,
  };
}

/** Writes the six FTP settings. Used for the baseline only, like {@link setSshSettings}. */
export async function setFtpSettings(client: E2eApiClient, settings: FtpSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('ftp.update', [{
      port: settings.port,
      clients: settings.clients,
      ipconnections: settings.ipconnections,
      loginattempt: settings.loginattempt,
      timeout_notransfer: settings.timeout_notransfer,
      timeout: settings.timeout,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
