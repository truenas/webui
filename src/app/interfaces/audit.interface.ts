import { AuditService } from 'app/enums/audit.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

export interface BaseAuditEntry {
  audit_id: string;
  message_timestamp: number;
  timestamp: ApiTimestamp;
  address: string;
  username: string;
  event: string;
  success: boolean;
}

export interface AuditConfig {
  retention: number;
  reservation: number;
  quota: number;
  quota_fill_warning: number;
  quota_fill_critical: number;
}

export interface SmbAuditEntry extends BaseAuditEntry {
  service: AuditService.Smb;
  service_data: AuditServiceData;
  event_data: unknown;
}

export type AuditEntry = SmbAuditEntry;

export interface AuditServiceData {
  'vers': {
    'major': number;
    'minor': number;
  };
  'service': string;
  'session_id': string;
  'tcon_id': string;
}
