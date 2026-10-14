import { CallParams } from '@truenas/api-client';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface SystemGeneralConfig {
  id: number;
  kbdmap: string;
  timezone: string;
  ui_address: string[];
  ui_certificate: number | null;
  ui_certificate_name: string | null;
  ui_consolemsg: boolean;
  ui_httpsport: number;
  ui_httpsprotocols: string[];
  ui_httpsredirect: boolean;
  ui_port: number;
  ui_v6address: string[];
  ui_allowlist: string[];
  usage_collection: boolean | null;
  usage_collection_is_set: boolean;
  wizardshown: boolean;
  ds_auth: boolean;
}

export interface SystemGeneralConfigUpdate {
  kbdmap?: string;
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
  ui_certificate?: number;
  ds_auth?: boolean;
}

export type SystemGeneralUpdateArgs = CallParams<WebUiApiDirectory, 'system.general.update'>[0];

/**
 * `system.general.update` declares `ui_address` and `ui_v6address` as non-empty lists and narrows
 * `ui_httpsprotocols` and `ui_x_frame_options` to the values it accepts; the GUI form builds lists and strings
 * from the matching choices calls. The payload is handed over unchanged.
 */
export function toSystemGeneralUpdateArgs(update: SystemGeneralConfigUpdate): SystemGeneralUpdateArgs {
  return update as SystemGeneralUpdateArgs;
}
