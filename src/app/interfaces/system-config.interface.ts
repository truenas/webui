export interface SystemGeneralConfig {
  id: number;
  kbdmap: string;
  language: string;
  timezone: string;
  ui_address: string[];
  ui_certificate: number;
  ui_certificate_name: string | null;
  ui_consolemsg: boolean;
  ui_httpsport: number;
  ui_httpsprotocols: string[];
  ui_httpsredirect: boolean;
  ui_port: number;
  ui_v6address: string[];
  ui_allowlist: string[];
  usage_collection: boolean;
  usage_collection_is_set: boolean;
  wizardshown: boolean;
  ds_auth: boolean;
}

export interface SystemGeneralConfigUpdate {
  kbdmap?: string;
  language?: string;
  timezone?: string;
  ui_address?: string[];
  ui_consolemsg?: boolean;
  ui_httpsport?: number;
  ui_httpsprotocols?: string[];
  ui_httpsredirect?: boolean;
  ui_port?: number;
  ui_v6address?: string[];
  ui_allowlist?: string[];
  ui_restart_delay?: number;
  ui_x_frame_options?: string;
  rollback_timeout?: number;
  usage_collection?: boolean;
  sysloglevel?: string;
  syslogserver?: string;
  ui_certificate?: number;
  ds_auth?: boolean;
}
