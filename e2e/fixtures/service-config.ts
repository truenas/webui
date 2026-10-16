/**
 * SSH, FTP and SNMP service settings: preconditions, cleanup and readback, over the API.
 *
 * Each service's settings are a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * Only the fields the specs change are written. The baseline is the stock
 * configuration: each protocol's standard port, the SSH options off, FTP's
 * usual limits, and SNMP's `public` community with v3 off. Nothing depends on
 * it matching a fresh install exactly. On an appliance someone has
 * reconfigured, a run puts these fields back to it.
 *
 * No settings test starts its service. Saving a stopped service's settings
 * only rewrites its configuration. On an appliance where SSH is running, the
 * port change restarts it on the new port until teardown. The SNMP spec stops
 * SNMP first, so its saves never restart anything.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SshConfig = CallResponse<E2eApiDirectory, 'ssh.config'>;
type FtpConfig = CallResponse<E2eApiDirectory, 'ftp.config'>;
type SnmpConfig = CallResponse<E2eApiDirectory, 'snmp.config'>;
type SnmpUpdate = NonNullable<CallParams<E2eApiDirectory, 'snmp.update'>[0]>;

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

/** Every field of the SNMP form, as `snmp.update` takes it. */
export type SnmpSettings = Pick<
  SnmpUpdate,
  'location' | 'contact' | 'community' | 'options' | 'zilstat' | 'v3' | 'v3_username' | 'v3_authtype'
  | 'v3_password' | 'v3_privproto' | 'v3_privpassphrase'
>;

/**
 * The part of `snmp.config` the SNMP spec asserts: every field but the v3
 * password and privacy passphrase, which are secrets and may come back redacted.
 */
export type SnmpReadback = Pick<
  SnmpConfig,
  'location' | 'contact' | 'community' | 'options' | 'zilstat' | 'v3' | 'v3_username' | 'v3_authtype'
  | 'v3_privproto'
>;

/**
 * The SNMP baseline: no location, contact or auxiliary options, the stock
 * community, zilstat off, and v3 off with every credential blank.
 *
 * Middleware refuses an empty community while v3 is off, so it stays `public`.
 */
export const snmpBaseline: SnmpSettings = {
  location: '',
  contact: '',
  community: 'public',
  options: '',
  zilstat: false,
  v3: false,
  v3_username: '',
  v3_authtype: '',
  v3_password: '',
  v3_privproto: null,
  v3_privpassphrase: '',
};

/** The SNMP settings as the appliance holds them, less the two secrets. */
export async function readSnmpSettings(client: E2eApiClient): Promise<SnmpReadback> {
  const config = await firstValueFrom(client.api.call('snmp.config').pipe(timeout(readTimeoutMs)));

  return {
    location: config.location,
    contact: config.contact,
    community: config.community,
    options: config.options,
    zilstat: config.zilstat,
    v3: config.v3,
    v3_username: config.v3_username,
    v3_authtype: config.v3_authtype,
    v3_privproto: config.v3_privproto,
  };
}

/** Writes every SNMP setting. Used for the baseline only, like {@link setSshSettings}. */
export async function setSnmpSettings(client: E2eApiClient, settings: SnmpSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('snmp.update', [{
      location: settings.location,
      contact: settings.contact,
      community: settings.community,
      options: settings.options,
      zilstat: settings.zilstat,
      v3: settings.v3,
      v3_username: settings.v3_username,
      v3_authtype: settings.v3_authtype,
      v3_password: settings.v3_password,
      v3_privproto: settings.v3_privproto,
      v3_privpassphrase: settings.v3_privpassphrase,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
