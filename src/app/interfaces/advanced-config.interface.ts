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
  motd: string; // Enum? FREENAS_MOTD
  overprovision: number;
  powerdaemon: boolean;
  sed_user: string; // Enum? "USER"
  serialconsole: boolean;
  serialport: string;
  serialspeed: string;
  swapondrive: number;
  syslog_tls_certificate: number;
  syslog_transport: string; // Enum? UDP
  sysloglevel: string; // Enum? F_CRIT
  syslogserver: string;
  traceback: boolean;
  uploadcrash: boolean;
  sed_passwd: string;
  syslog_tls_certificate_authority: number;
  kernel_extra_options: string;
  legacy_ui?: boolean;
}

export type AdvancedConfigUpdate = Omit<AdvancedConfig, 'id'>;
