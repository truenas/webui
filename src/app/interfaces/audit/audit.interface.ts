import { AuditEvent } from 'app/enums/audit-event.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { MiddlewareAuditEntry } from 'app/interfaces/audit/middleware-audit-entry.interface';
import { SmbAuditEntry } from 'app/interfaces/audit/smb-audit-entry.interface';

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

export type AuditEntry = SmbAuditEntry | MiddlewareAuditEntry;

export interface AuditVersions {
  major: number;
  minor: number;
}
