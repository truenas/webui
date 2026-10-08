import { CallResponse } from '@truenas/api-client';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { MiddlewareAuditEntry } from 'app/interfaces/audit/middleware-audit-entry.interface';
import { SmbAuditEntry } from 'app/interfaces/audit/smb-audit-entry.interface';
import { SudoAuditEntry } from 'app/interfaces/audit/sudo-audit-entry.interface';
import { SystemAuditEntry } from 'app/interfaces/audit/system-audit-entry.interface';
import { ApiQueryParams } from 'app/modules/tn-table/classes/api-data-provider/query-params';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface AuditQueryParams extends ApiQueryParams<AuditEntry> {
  services?: AuditService[];
  remote_controller?: boolean;
}

export interface BaseAuditEntry {
  audit_id: string;
  session: string;
  message_timestamp: number;
  timestamp: ApiTimestamp;
  address: string;
  username: string;
  event: AuditEvent;
  success: boolean;
}

export interface AuditConfig {
  retention: number;
  reservation: number;
  quota: number;
  quota_fill_warning: number;
  quota_fill_critical: number;
}

export type AuditEntry = SmbAuditEntry | MiddlewareAuditEntry | SudoAuditEntry | SystemAuditEntry;

export interface AuditVersions {
  major: number;
  minor: number;
}

/**
 * Reads the rows of an `audit.query` made without `count` or `get` in its `query-options`. Middleware declares
 * one response for every option, so the rows come typed together with a count and a single entry; it also spells
 * `service` and `event` as literals, `timestamp` as a string where the wire carries a `{ $date }` envelope
 * (gap 15), and the per-service data as loose records the entry union names.
 */
export function toAuditEntries(response: CallResponse<WebUiApiDirectory, 'audit.query'>): AuditEntry[] {
  return response as unknown as AuditEntry[];
}
