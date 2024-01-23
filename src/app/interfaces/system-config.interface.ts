import { Certificate } from 'app/interfaces/certificate.interface';

export interface SystemGeneralConfig {
  id: number;
  kbdmap: string;
  language: string;
  timezone: string;
  ui_address: string[];
  ui_certificate: Certificate;
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
  usage_collection?: boolean;
  sysloglevel?: string;
  syslogserver?: string;
  ui_certificate?: number;
  ds_auth?: boolean;
}
