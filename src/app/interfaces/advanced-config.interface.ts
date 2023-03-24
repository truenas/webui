import { SedUser } from 'app/enums/sed-user.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';

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
  overprovision: number;
  powerdaemon: boolean;
  sed_user: SedUser;
  serialconsole: boolean;
  serialport: string;
  serialspeed: string;
  swapondrive: number;
  syslog_tls_certificate: number;
  syslog_transport: SyslogTransport;
  sysloglevel: SyslogLevel;
  syslogserver: string;
  traceback: boolean;
  uploadcrash: boolean;
  sed_passwd: string;
  syslog_tls_certificate_authority: number;
  kernel_extra_options: string;
  legacy_ui?: boolean;
}

export type AdvancedConfigUpdate = Omit<AdvancedConfig, 'id'>;
