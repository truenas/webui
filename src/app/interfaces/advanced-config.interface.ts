import { CallParams } from '@truenas/api-client';
import { SedUser } from 'app/enums/sed-user.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface SyslogServer {
  host: string;
  transport?: SyslogTransport;
  tls_certificate?: number | null;
}

export interface AdvancedConfig {
  advancedmode: boolean;
  anonstats: boolean;
  anonstats_token: string;
  autotune: boolean;
  boot_scrub: number;
  consolemenu: boolean;
  consolemsg: boolean;
  debugkernel: boolean;
  fqdn_syslog: boolean;
  id: number;
  isolated_gpu_pci_ids: string[];
  kdump_enabled: boolean;
  motd: string;
  login_banner: string;
  nvidia: boolean;
  overprovision: number;
  powerdaemon: boolean;
  sed_user: SedUser;
  serialconsole: boolean;
  serialport: string;
  serialspeed: string;
  syslog_audit: boolean;
  sysloglevel: SyslogLevel;
  syslogservers: SyslogServer[];
  traceback: boolean;
  uploadcrash: boolean;
  /** Write-only: `system.advanced.update` takes it, `system.advanced.config` never returns it. */
  sed_passwd?: string;
  kernel_extra_options: string;
  legacy_ui?: boolean;
}

export type AdvancedConfigUpdate = Partial<Omit<AdvancedConfig, 'id' | 'isolated_gpu_pci_ids'>>;

export type AdvancedConfigUpdateArgs = CallParams<WebUiApiDirectory, 'system.advanced.update'>[0];

/**
 * `system.advanced.update` narrows `syslogservers` to at most two and `serialspeed` to the baud rates it
 * accepts; the forms build a list and a string, and cap the servers themselves. The payload is handed over
 * unchanged.
 */
export function toAdvancedConfigUpdateArgs(update: AdvancedConfigUpdate): AdvancedConfigUpdateArgs {
  return update as AdvancedConfigUpdateArgs;
}
