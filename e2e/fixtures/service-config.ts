/**
 * SSH, FTP, SNMP, UPS, SMB and WebShare service settings: preconditions, cleanup and readback, over the API.
 *
 * Single config records; as in `fixtures/syslog.ts`, SSH, FTP, SNMP and UPS start from a stock baseline that
 * teardown writes back (only fields specs change). Exceptions: SMB ({@link SmbSettings}), UPS ({@link upsBaseline})
 * and WebShare, which snapshots ({@link WebshareSettings}). SSH and FTP are read back as basic and Advanced halves.
 * No test starts its service; with SSH running, the port change restarts it until teardown.
 */
import type { CallParams, CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type SshConfig = CallResponse<E2eApiDirectory, 'ssh.config'>;
type FtpConfig = CallResponse<E2eApiDirectory, 'ftp.config'>;
type SnmpConfig = CallResponse<E2eApiDirectory, 'snmp.config'>;
type SnmpUpdate = NonNullable<CallParams<E2eApiDirectory, 'snmp.update'>[0]>;
type UpsConfig = CallResponse<E2eApiDirectory, 'ups.config'>;
type SmbConfig = CallResponse<E2eApiDirectory, 'smb.config'>;
type SmbUpdate = NonNullable<CallParams<E2eApiDirectory, 'smb.update'>[0]>;
type WebshareConfig = CallResponse<E2eApiDirectory, 'webshare.config'>;
type WebshareUpdate = NonNullable<CallParams<E2eApiDirectory, 'webshare.update'>[0]>;

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
 * The UPS baseline: Slave mode at a TEST-NET address, stock identifier, monitor user and password, and every
 * other field off what the spec saves, so each save changes something.
 *
 * Not stock, because stock can't be written back: a fresh appliance is Master with no driver or port, and
 * `ups.update` validates the merged record, where Master needs both. Slave needs only a remote host.
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

/**
 * The part of `smb.config` the SMB settings spec edits, and Apple extensions,
 * which it reads to check the form sent back what it loaded.
 *
 * Unlike SSH and FTP there is no fixed baseline: the NetBIOS name and workgroup
 * differ per appliance, so the spec snapshots these in `beforeEach` and writes
 * the snapshot back.
 */
export type SmbSettings = Pick<
  SmbConfig,
  'netbiosname' | 'workgroup' | 'description' | 'minimum_protocol' | 'ntlmv1_auth' | 'unixcharset' | 'encryption'
  | 'debug' | 'syslog' | 'multichannel' | 'filemask' | 'dirmask' | 'aapl_extensions'
>;

/** The SMB settings as the appliance holds them. */
export async function readSmbSettings(client: E2eApiClient): Promise<SmbSettings> {
  const config = await firstValueFrom(client.api.call('smb.config').pipe(timeout(readTimeoutMs)));

  return {
    netbiosname: config.netbiosname,
    workgroup: config.workgroup,
    description: config.description,
    minimum_protocol: config.minimum_protocol,
    ntlmv1_auth: config.ntlmv1_auth,
    unixcharset: config.unixcharset,
    encryption: config.encryption,
    debug: config.debug,
    syslog: config.syslog,
    multichannel: config.multichannel,
    filemask: config.filemask,
    dirmask: config.dirmask,
    aapl_extensions: config.aapl_extensions,
  };
}

/**
 * Writes the SMB settings. For preconditions and teardown only, like
 * {@link setSshSettings}; the change under test goes through the form.
 *
 * What {@link readSmbSettings} returned is always accepted back: middleware
 * reports an unset mask or encryption as `DEFAULT` and takes `DEFAULT` on write.
 */
export async function setSmbSettings(client: E2eApiClient, settings: SmbSettings): Promise<void> {
  const update: SmbUpdate = {
    netbiosname: settings.netbiosname,
    workgroup: settings.workgroup,
    description: settings.description,
    minimum_protocol: settings.minimum_protocol,
    ntlmv1_auth: settings.ntlmv1_auth,
    // Read from `smb.config`, so always a name middleware accepts.
    unixcharset: settings.unixcharset as SmbUpdate['unixcharset'],
    encryption: settings.encryption,
    debug: settings.debug,
    syslog: settings.syslog,
    multichannel: settings.multichannel,
    filemask: settings.filemask,
    dirmask: settings.dirmask,
    aapl_extensions: settings.aapl_extensions,
  };

  await firstValueFrom(client.api.call('smb.update', [update]).pipe(timeout(slowCallTimeoutMs)));
}

/**
 * The part of `webshare.config` the WebShare spec edits, and TrueSearch, which
 * it reads to check the form kept it off.
 *
 * Snapshotted rather than given a baseline: MCP's groups may name a Directory
 * Services group on an appliance joined to one, and a fixed value would drop it.
 */
export type WebshareSettings = Pick<
  WebshareConfig,
  'search' | 'passkey' | 'mcp_enabled' | 'mcp_allowed_groups' | 'mcp_allow_write'
>;

/** The WebShare settings as the appliance holds them. */
export async function readWebshareSettings(client: E2eApiClient): Promise<WebshareSettings> {
  const config = await firstValueFrom(client.api.call('webshare.config').pipe(timeout(readTimeoutMs)));

  return {
    search: config.search,
    passkey: config.passkey,
    mcp_enabled: config.mcp_enabled,
    mcp_allowed_groups: config.mcp_allowed_groups,
    mcp_allow_write: config.mcp_allow_write,
  };
}

/**
 * Writes the passkey and MCP settings, for preconditions and teardown only,
 * like {@link setSshSettings}.
 *
 * TrueSearch is never written, and neither are the bind addresses or login
 * groups: TrueSearch needs an entitlement and TrueNAS Connect to turn on, and
 * the other two decide who can reach WebShare at all.
 */
export async function setWebshareSettings(
  client: E2eApiClient,
  settings: Omit<WebshareSettings, 'search'>,
): Promise<void> {
  const update: WebshareUpdate = {
    // Read from `webshare.config`, so always a mode middleware accepts.
    passkey: settings.passkey as WebshareUpdate['passkey'],
    mcp_enabled: settings.mcp_enabled,
    mcp_allowed_groups: settings.mcp_allowed_groups,
    mcp_allow_write: settings.mcp_allow_write,
  };

  await firstValueFrom(client.api.call('webshare.update', [update]).pipe(timeout(slowCallTimeoutMs)));
}
