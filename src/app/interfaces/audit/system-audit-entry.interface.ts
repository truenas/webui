import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';

export interface EscalationPath {
  name: string | null;
  inode: number;
  dev: string;
  mode: string;
  ouid: number;
  ogid: number;
  rdev: string;
}

export interface SyscallData {
  success: boolean;
  exit: number;
  ppid: number;
  pid: number;
  auid: number;
  uid: number;
  gid: number;
  euid: number;
  suid: number;
  fsuid: number;
  egid: number;
  sgid: number;
  fsgid: number;
  tty: string | null;
  ses: number;
  key: string | null;
  SYSCALL: string;
  AUID: string | null;
  UID: string;
  GID: string;
}

export interface GenericSystemEventData {
  audit_msg_id_str: string;
  proctitle: string | null;
  syscall: SyscallData | null;
  cwd: string | null;
  paths: EscalationPath[];
  raw_lines: string[] | null;
}

export interface LoginSystemEventData {
  'old-auid': number;
  auid: number;
  tty: string | null;
  'old-ses': number;
  ses: number;
  syscall: SyscallData;
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
  username: string | null;
}

export interface ServiceSystemEventData {
  service_action: string;
  subj: string;
  unit: string;
  comm: string;
  exe: string;
}

export interface TtyRecordData {
  pid: number;
  uid: number;
  ses: number;
  major: number;
  minor: number;
  comm: string;
  data: string;
  username: string;
}

export interface TtyRecordEventData {
  event_type: string;
  tty_record: TtyRecordData;
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
  event_data: GenericSystemEventData;
}

export interface PrivilegedEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Privileged;
  event_data: GenericSystemEventData;
}

export interface ExportEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Export;
  event_data: GenericSystemEventData;
}

export interface IdentityEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Identity;
  event_data: GenericSystemEventData;
}

export interface TimeChangeEntry extends BaseSystemAuditEntry {
  event: AuditEvent.TimeChange;
  event_data: GenericSystemEventData;
}

export interface ModuleLoadEntry extends BaseSystemAuditEntry {
  event: AuditEvent.ModuleLoad;
  event_data: GenericSystemEventData;
}

export interface ServiceEntry extends BaseSystemAuditEntry {
  event: AuditEvent.Service;
  event_data: ServiceSystemEventData;
}

export interface TtyRecordEntry extends BaseSystemAuditEntry {
  event: AuditEvent.TtyRecord;
  event_data: TtyRecordEventData;
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
