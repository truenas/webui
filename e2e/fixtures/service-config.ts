/**
 * SSH, FTP and UPS service settings: preconditions, cleanup and readback, over the API.
 *
 * Each service's settings are a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * Only the fields the specs change are written. The baseline is the stock
 * configuration: each protocol's standard port, the SSH options off, and FTP's
 * usual limits. UPS is the exception: its stock configuration cannot be written
 * back, see {@link upsBaseline}. Nothing depends on a baseline matching a fresh
 * install exactly. On an appliance someone has reconfigured, a run puts these
 * fields back to it.
 *
 * No settings test starts its service. Saving a stopped service's
 * settings only rewrites its configuration. On an appliance where SSH is
 * running, the port change restarts it on the new port until teardown.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SshConfig = CallResponse<E2eApiDirectory, 'ssh.config'>;
type FtpConfig = CallResponse<E2eApiDirectory, 'ftp.config'>;
type UpsConfig = CallResponse<E2eApiDirectory, 'ups.config'>;

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

/**
 * The part of `ups.config` the UPS spec asserts: every field the form's General,
 * Monitor and Shutdown sections save, less the monitor password, and the
 * `complete_identifier` middleware derives from them.
 */
export type UpsReadback = Pick<
  UpsConfig,
  'identifier' | 'mode' | 'remotehost' | 'remoteport' | 'driver' | 'port' | 'monuser' | 'shutdown'
  | 'shutdowntimer' | 'complete_identifier'
>;

/** The UPS fields the spec changes, as `ups.update` takes them. */
export type UpsSettings = Omit<UpsReadback, 'complete_identifier'> & { monpwd: string };

/**
 * The UPS baseline: Slave mode, pointing at a TEST-NET address, with the stock
 * identifier, monitor user and password, and every other field moved off what
 * the spec saves, so each save has something to change.
 *
 * Not the stock configuration, because that cannot be written back. A fresh
 * appliance is in Master mode with no driver and no port, and `ups.update`
 * validates the whole merged record — Master needs both — so writing the stock
 * values is refused. Slave mode needs only a remote host.
 */
export const upsBaseline: UpsSettings = {
  identifier: 'ups',
  mode: 'SLAVE',
  remotehost: '192.0.2.1',
  remoteport: 3493,
  driver: '',
  port: '',
  monuser: 'upsmon',
  monpwd: 'fixmepass',
  shutdown: 'LOWBATT',
  shutdowntimer: 30,
};

/** The UPS settings as the appliance holds them, less the monitor password. */
export async function readUpsSettings(client: E2eApiClient): Promise<UpsReadback> {
  const config = await firstValueFrom(client.api.call('ups.config').pipe(timeout(readTimeoutMs)));

  return {
    identifier: config.identifier,
    mode: config.mode,
    remotehost: config.remotehost,
    remoteport: config.remoteport,
    driver: config.driver,
    port: config.port,
    monuser: config.monuser,
    shutdown: config.shutdown,
    shutdowntimer: config.shutdowntimer,
    complete_identifier: config.complete_identifier,
  };
}

/**
 * Writes the UPS fields the spec changes. Used for the baseline and for the
 * state a test starts from, never for the change under test.
 */
export async function setUpsSettings(client: E2eApiClient, settings: UpsSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('ups.update', [{
      identifier: settings.identifier,
      mode: settings.mode,
      remotehost: settings.remotehost,
      remoteport: settings.remoteport,
      driver: settings.driver,
      port: settings.port,
      monuser: settings.monuser,
      monpwd: settings.monpwd,
      shutdown: settings.shutdown,
      shutdowntimer: settings.shutdowntimer,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/**
 * The first `ups.driver_choices` key for a NUT driver, e.g. `usbhid-ups`, that
 * passes the driver no options. A key is `<driver>[ <options>]$<model>`, and
 * `ups.update` takes only a key it lists.
 */
export async function findUpsDriverKey(client: E2eApiClient, driver: string): Promise<string> {
  const choices = await firstValueFrom(client.api.call('ups.driver_choices').pipe(timeout(readTimeoutMs)));
  const key = Object.keys(choices).find((choice) => choice.startsWith(`${driver}$`));
  if (!key) {
    throw new Error(`ups.driver_choices lists no ${driver} driver.`);
  }

  return key;
}

/**
 * A serial port the UPS form can save: `/dev/ttyS1`, unless the serial console
 * is on that port, which `ups.update` refuses; then `/dev/ttyS2`.
 */
export async function pickUpsSerialPort(client: E2eApiClient): Promise<string> {
  const config = await firstValueFrom(client.api.call('system.advanced.config').pipe(timeout(readTimeoutMs)));

  return config.serialconsole && config.serialport === 'ttyS1' ? '/dev/ttyS2' : '/dev/ttyS1';
}
