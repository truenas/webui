import { AuditEvent } from 'app/enums/audit-event.enum';
import { AuditService } from 'app/enums/audit.enum';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { CredentialType } from 'app/interfaces/credential-type.interface';

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

export interface AuditEventData {
  host?: string;
  description?: string;
  method?: string;
  credentials?: {
    credentials?: CredentialType;
  };
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
  event_data: AuditEventData;
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
