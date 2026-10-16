/**
 * SSH and FTP service settings: preconditions, cleanup and readback, over the API.
 *
 * Each service's settings are a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * Only the fields the specs change are written. The baseline is the stock
 * configuration: each protocol's standard port, the SSH options off, FTP's
 * usual limits, and middleware's model defaults for the advanced fields. Nothing
 * depends on it matching a fresh install exactly. On an appliance someone has
 * reconfigured, a run puts these fields back to it.
 *
 * Each form's fields are read back in two halves: the basic ones, and the ones
 * behind its Advanced toggle. A test asserts the half it edits, whole.
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

/** The part of `ssh.config` the basic SSH spec edits, and Kerberos, which it reads to check it was left alone. */
export type SshBasicSettings = Pick<SshConfig, 'tcpport' | 'passwordauth' | 'kerberosauth' | 'tcpfwd'>;

/**
 * The part of `ssh.config` behind Advanced Settings that the advanced spec edits.
 * Bind interfaces and the auxiliary parameters are left out on purpose: a wrong
 * value there can cut off SSH, which CI may rely on.
 */
export type SshAdvancedSettings = Pick<
  SshConfig,
  'compression' | 'sftp_log_level' | 'sftp_log_facility' | 'weak_ciphers'
>;

export type SshSettings = SshBasicSettings & SshAdvancedSettings;

/** The part of `ftp.config` the basic FTP spec edits: the form's General Options. */
export type FtpBasicSettings = Pick<
  FtpConfig,
  'port' | 'clients' | 'ipconnections' | 'loginattempt' | 'timeout_notransfer' | 'timeout'
>;

type FtpAccessKey = 'defaultroot' | 'onlylocal' | 'resume' | 'fxp' | 'passiveportsmin' | 'passiveportsmax';
type FtpBandwidthKey = 'localuserbw' | 'localuserdlbw';
type FtpTlsKey = 'tls' | 'tls_policy' | 'tls_opt_allow_client_renegotiations';

/**
 * The part of `ftp.config` behind Advanced Options that the advanced specs edit:
 * access, passive ports, bandwidth and TLS.
 *
 * Not the certificate. It is only required while TLS is on, which the baseline
 * leaves off, so it is never written back and is read on its own.
 */
export type FtpAdvancedSettings = Pick<FtpConfig, FtpAccessKey | FtpBandwidthKey | FtpTlsKey>;

export type FtpSettings = FtpBasicSettings & FtpAdvancedSettings;

/** The SSH advanced baseline: compression off, no SFTP log overrides, and the weak ciphers a stock appliance allows. */
export const sshAdvancedBaseline: SshAdvancedSettings = {
  compression: false,
  sftp_log_level: '',
  sftp_log_facility: '',
  weak_ciphers: ['AES128-CBC', 'NONE'],
};

/** The SSH baseline: the standard port, every basic option the specs turn on, off, and the advanced baseline. */
export const sshBaseline: SshSettings = {
  tcpport: 22,
  passwordauth: false,
  kerberosauth: false,
  tcpfwd: false,
  ...sshAdvancedBaseline,
};

/**
 * The FTP advanced baseline: middleware's model defaults — Always Chroot on,
 * passive ports and bandwidth unset (`0`), TLS off with its policy at `on`.
 */
export const ftpAdvancedBaseline: FtpAdvancedSettings = {
  defaultroot: true,
  onlylocal: false,
  resume: false,
  fxp: false,
  passiveportsmin: 0,
  passiveportsmax: 0,
  localuserbw: 0,
  localuserdlbw: 0,
  tls: false,
  tls_policy: 'on',
  tls_opt_allow_client_renegotiations: false,
};

/** The FTP baseline: the standard port, the limits the form shows on a stock appliance, and the advanced baseline. */
export const ftpBaseline: FtpSettings = {
  port: 21,
  clients: 5,
  ipconnections: 2,
  loginattempt: 1,
  timeout_notransfer: 300,
  timeout: 600,
  ...ftpAdvancedBaseline,
};

/** The four basic SSH settings as the appliance holds them. */
export async function readSshSettings(client: E2eApiClient): Promise<SshBasicSettings> {
  const config = await firstValueFrom(client.api.call('ssh.config').pipe(timeout(readTimeoutMs)));

  return {
    tcpport: config.tcpport,
    passwordauth: config.passwordauth,
    kerberosauth: config.kerberosauth,
    tcpfwd: config.tcpfwd,
  };
}

/** The four advanced SSH settings as the appliance holds them. */
export async function readSshAdvancedSettings(client: E2eApiClient): Promise<SshAdvancedSettings> {
  const config = await firstValueFrom(client.api.call('ssh.config').pipe(timeout(readTimeoutMs)));

  return {
    compression: config.compression,
    sftp_log_level: config.sftp_log_level,
    sftp_log_facility: config.sftp_log_facility,
    weak_ciphers: config.weak_ciphers,
  };
}

/**
 * Writes the SSH settings, basic and advanced. Used for the baseline only, never
 * for the change under test, which goes through the form.
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
      compression: settings.compression,
      sftp_log_level: settings.sftp_log_level,
      sftp_log_facility: settings.sftp_log_facility,
      weak_ciphers: settings.weak_ciphers,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** The six basic FTP settings as the appliance holds them. */
export async function readFtpSettings(client: E2eApiClient): Promise<FtpBasicSettings> {
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

/** The advanced FTP settings as the appliance holds them, without the certificate. */
export async function readFtpAdvancedSettings(client: E2eApiClient): Promise<FtpAdvancedSettings> {
  const config = await firstValueFrom(client.api.call('ftp.config').pipe(timeout(readTimeoutMs)));

  return {
    defaultroot: config.defaultroot,
    onlylocal: config.onlylocal,
    resume: config.resume,
    fxp: config.fxp,
    passiveportsmin: config.passiveportsmin,
    passiveportsmax: config.passiveportsmax,
    localuserbw: config.localuserbw,
    localuserdlbw: config.localuserdlbw,
    tls: config.tls,
    tls_policy: config.tls_policy,
    tls_opt_allow_client_renegotiations: config.tls_opt_allow_client_renegotiations,
  };
}

/** The id of the certificate FTP's TLS uses, or null when none is set. */
export async function readFtpCertificateId(client: E2eApiClient): Promise<number | null> {
  const config = await firstValueFrom(client.api.call('ftp.config').pipe(timeout(readTimeoutMs)));

  return config.ssltls_certificate;
}

/** Writes the FTP settings, basic and advanced. Used for the baseline only, like {@link setSshSettings}. */
export async function setFtpSettings(client: E2eApiClient, settings: FtpSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('ftp.update', [{
      port: settings.port,
      clients: settings.clients,
      ipconnections: settings.ipconnections,
      loginattempt: settings.loginattempt,
      timeout_notransfer: settings.timeout_notransfer,
      timeout: settings.timeout,
      defaultroot: settings.defaultroot,
      onlylocal: settings.onlylocal,
      resume: settings.resume,
      fxp: settings.fxp,
      passiveportsmin: settings.passiveportsmin,
      passiveportsmax: settings.passiveportsmax,
      localuserbw: settings.localuserbw,
      localuserdlbw: settings.localuserdlbw,
      tls: settings.tls,
      tls_policy: settings.tls_policy,
      tls_opt_allow_client_renegotiations: settings.tls_opt_allow_client_renegotiations,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
