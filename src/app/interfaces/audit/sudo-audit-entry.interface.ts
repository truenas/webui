import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';

interface BaseSudoAuditEntry extends BaseAuditEntry {
  service: AuditService.Sudo;
  service_data: AuditSudoServiceData;
}

export interface SudoEventData<T extends 'accept' | 'reject' > {
  sudo: Record<T, {
    uuid: string;
    ttyname: string;
    submituser: string;
    submithost: string;
    submitcwd: string;
    submit_time: {
      seconds: string;
      nanoseconds: string;
      localtime: string;
      iso8601: string;
    };
    server_time: {
      seconds: string;
      nanoseconds: string;
      localtime: string;
      iso8601: string;
    };
    runuser: string;
    runuid: string;
    runenv: string;
    runcwd: string;
    runargv: string;
    lines: string;
    command: string;
    columns: string;
  }>;
}

export interface SudoAcceptEntry extends BaseSudoAuditEntry {
  event: AuditEvent.Accept;
  event_data: SudoEventData<'accept'>;
}

export interface SudoRejectEntry extends BaseSudoAuditEntry {
  event: AuditEvent.Reject;
  event_data: SudoEventData<'reject'>;
}

export type SudoAuditEntry = SudoAcceptEntry | SudoRejectEntry;

export interface AuditSudoServiceData {
  vers: AuditVersions;
}
