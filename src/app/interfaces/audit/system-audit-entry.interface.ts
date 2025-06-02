import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';

export interface GenericSystemEventData {
  audit_msg_id_str: string;
  proctitle: string | null;
  syscall: Record<string, string> | null;
  cwd: string | null;
  paths: Record<string, string>[];
  raw_lines: string[];
}

export interface LoginSystemEventData {
  'old-auid': number;
  auid: number;
  tty: string | null;
  'old-ses': number;
  ses: number;
  syscall: Record<string, string | number | boolean | null>;
  proctitle: string;
}

export interface CredentialSystemEventData {
  auth_action: string;
  pid: number;
  function: string;
  acct: string;
  exe: string;
  hostname: string | null;
  addr: string | null;
  terminal: string;
  username: string;
}

export interface EscalationSystemEventData {
  audit_msg_id_str: string;
  proctitle: string;
  syscall: Record<string, string | number | boolean | null>;
  cwd: string;
  paths: EscalationPath[];
  raw_lines: string[] | null;
}

export interface EscalationPath {
  name: string;
  inode: number;
  dev: string;
  mode: string;
  ouid: number;
  ogid: number;
  rdev: string;
}

export interface AuditSystemServiceData {
  vers?: AuditVersions;
}

interface BaseSystemAuditEntry extends BaseAuditEntry {
  service: AuditService.System;
  service_data: AuditSystemServiceData | null;
}

export interface SystemGenericEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Generic;
  event_data: GenericSystemEventData;
}

export interface SystemLoginEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Login;
  event_data: LoginSystemEventData;
}

export interface SystemCredentialEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Credential;
  event_data: CredentialSystemEventData;
}

export interface SystemEscalationEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Escalation;
  event_data: EscalationSystemEventData;
}

export interface PrivilegedEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Privileged;
  event_data: EscalationSystemEventData;
}

export interface ExportEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Export;
  event_data: EscalationSystemEventData;
}

export interface IdentityEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Identity;
  event_data: EscalationSystemEventData;
}

export interface TimeChangeEntry extends BaseSystemAuditEntry {
  event: AuditEvent.TimeChange;
  event_data: EscalationSystemEventData;
}

export interface ModuleLoadEntry extends BaseSystemAuditEntry {
  event: AuditEvent.ModuleLoad;
  event_data: EscalationSystemEventData;
}

export interface ServiceEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Service;
  event_data: EscalationSystemEventData;
}

export interface TtyRecordEntry extends BaseSystemAuditEntry {
  event: AuditEvent.TtyRecord;
  event_data: EscalationSystemEventData;
}

export type SystemAuditEntry =
  | SystemGenericEntry
  | SystemLoginEntry
  | SystemCredentialEntry
  | SystemEscalationEntry
  | ExportEntry
  | PrivilegedEntry
  | IdentityEntry
  | TimeChangeEntry
  | ModuleLoadEntry
  | ServiceEntry
  | TtyRecordEntry;
