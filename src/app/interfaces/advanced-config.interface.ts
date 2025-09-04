import { SedUser } from 'app/enums/sed-user.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';

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
  sed_passwd: string;
  kernel_extra_options: string;
  legacy_ui?: boolean;
}

export type AdvancedConfigUpdate = Partial<Omit<AdvancedConfig, 'id' | 'isolated_gpu_pci_ids'>>;
