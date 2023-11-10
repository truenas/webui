import { AuditEvent } from 'app/enums/audit-event.enum';
import { AuditService } from 'app/enums/audit.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';

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

interface EventData {
  host?: string;
  clientAccount?: string;
  file?: {
    path?: string;
    handle?: {
      type?: string;
      value?: string;
    };
  };
  dst_file?: {
    path?: string;
  };
  src_file?: {
    path?: string;
  };
}

export interface SmbAuditEntry extends BaseAuditEntry {
  service: AuditService.Smb;
  service_data: AuditServiceData;
  event_data: EventData;
}

export type AuditEntry = SmbAuditEntry;

export interface AuditServiceData {
  vers: {
    major: number;
    minor: number;
  };
  service: string;
  session_id: string;
  tcon_id: string;
}
