import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';

interface BaseSudoAuditEntry extends BaseAuditEntry {
  service: AuditService.Sudo;
  service_data: AuditSudoServiceData;
}

interface SudoEventTimeData {
  seconds: string;
  nanoseconds: string;
  localtime: string;
  iso8601: string;
}

interface BaseSudoEventData {
  uuid: string;
  submituser: string;
  submithost: string;
  submitcwd: string;
  submitenv: string;
  submit_time: SudoEventTimeData;
  server_time: SudoEventTimeData;
  runuser: string;
  runuid: string;
  runcwd: string;
  runargv: string;
  lines: string;
  command: string;
  columns: string;
}

export interface SudoAcceptEventData {
  sudo: {
    accept: BaseSudoEventData & {
      runenv: string;
      source: string;
    };
  };
}

export interface SudoRejectEventData {
  sudo: {
    reject: BaseSudoEventData & {
      reason: string;
    };
  };
}

export interface SudoAcceptEntry extends BaseSudoAuditEntry {
  event: AuditEvent.Accept;
  event_data: SudoAcceptEventData;
}

export interface SudoRejectEntry extends BaseSudoAuditEntry {
  event: AuditEvent.Reject;
  event_data: SudoRejectEventData;
}

export type SudoAuditEntry = SudoAcceptEntry | SudoRejectEntry;

export interface AuditSudoServiceData {
  vers: AuditVersions;
}
