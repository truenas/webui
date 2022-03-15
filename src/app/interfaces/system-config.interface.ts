import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Certificate } from 'app/interfaces/certificate.interface';

export interface SystemGeneralConfig {
  birthday: ApiTimestamp;
  crash_reporting: boolean;
  crash_reporting_is_set: boolean;
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
  usage_collection: boolean;
  usage_collection_is_set: boolean;
  wizardshown: boolean;
  ui_perms?: string; // IxPermissions test; must remove
}

export interface SystemGeneralConfigUpdate {
  birthday?: ApiTimestamp;
  crash_reporting?: boolean;
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
  usage_collection?: boolean;
  sysloglevel?: string;
  syslogserver?: string;
  ui_perms?: string; // IxPermissions test; must remove
  ui_certificate?: number;
}
