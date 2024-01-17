import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditVersions, BaseAuditEntry } from 'app/interfaces/audit/audit.interface';

export interface BaseSmbAuditEntry extends BaseAuditEntry {
  service: AuditService.Smb;
  service_data: AuditSmbServiceData;
}

export interface SmbOperationResult {
  type: string;
  value_raw: number;
  value_parsed: string;
}

export interface AuditSmbAuthenticationEventData {
  logonId: string;
  logonType: number;
  localAddress: string;
  remoteAddress: string;
  serviceDescription: string;
  authDescription: string;
  clientDomain: string;
  clientAccount: string;
  workstation: string;
  becameAccount: string;
  becameDomain: string;
  becameSid: string;
  mappedAccount: string;
  mappedDomain: string;
  netlogonComputer: string;
  netlogonTrustAccount: string;
  netlogonNegotiateFlags: string;
  netlogonSecureChannelType: number;
  netlogonTrustAccountSid: string;
  passwordType: string;
  clientPolicyAccessCheck: string;
  serverPolicyAccessCheck: string;
  vers: AuditVersions;
  result: SmbOperationResult;
}

export interface SmbConnectEventData {
  host: string;
  unix_token: SmbUnixToken;
  result: SmbOperationResult;
  vers: AuditVersions;
}

export interface SmbCreateEventData extends SmbFileEventData {
  parameters: Record<string, string>;
  file_type: string;
}

export interface SmbFileEventData {
  file: AuditSmbFile;
  result: SmbOperationResult;
  vers: AuditVersions;
}

export interface SmbSetAttrEventData {
  attr_type: string;
  dosmode: unknown;
  ts: {
    mtime: string;
  };
  result: SmbOperationResult;
  file: AuditSmbFile;
  vers: AuditVersions;
}

export interface SmbCloseEventData extends SmbFileEventData {
  operations: SmbOperations;
}

export interface SmbDisconnectEventData {
  host: string;
  unix_token: SmbUnixToken;
  operations: SmbOperations;
  result: SmbOperationResult;
  vers: AuditVersions;
}

export interface SmbRenameEventData {
  src_file: AuditSmbFile;
  dst_file: AuditSmbFile;
  result: SmbOperationResult;
  vers: AuditVersions;
}

export interface SmbSetQuotaEventData extends SmbFileEventData {
  qt: {
    type: string;
    bsize: string;
    softlimit: string;
    hardlimit: string;
    isoftlimit: string;
    ihardlimit: string;
  };
}

export interface SmbAuthenticationEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Authentication;
  event_data: AuditSmbAuthenticationEventData;
}

export interface SmbConnectEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Connect;
  event_data: SmbConnectEventData;
}

export interface SmbDisconnectEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Disconnect;
  event_data: SmbDisconnectEventData;
}

export interface SmbCreateEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Create;
  event_data: SmbCreateEventData;
}

export interface SmbReadEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Read;
  event_data: SmbFileEventData;
}

export interface SmbSetAttrEntry extends BaseSmbAuditEntry {
  event: AuditEvent.SetAttr;
  event_data: SmbSetAttrEventData;
}

export interface SmbUnlinkEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Unlink;
  event_data: SmbFileEventData;
}

export interface SmbWriteEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Write;
  event_data: SmbFileEventData;
}

export interface SmbOffloadReadEntry extends BaseSmbAuditEntry {
  event: AuditEvent.OffloadRead;
  event_data: SmbFileEventData;
}

export interface SmbOffloadWriteEntry extends BaseSmbAuditEntry {
  event: AuditEvent.OffloadWrite;
  event_data: SmbFileEventData;
}

export interface SmbRenameEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Rename;
  event_data: SmbRenameEventData;
}

export interface SmbCloseEntry extends BaseSmbAuditEntry {
  event: AuditEvent.Close;
  event_data: SmbCloseEventData;
}

export interface SmbSetQuotaEntry extends BaseSmbAuditEntry {
  event: AuditEvent.SetQuota;
  event_data: SmbSetQuotaEventData;
}

export interface SmbSetAclEntry extends BaseSmbAuditEntry {
  event: AuditEvent.SetAcl;
  event_data: SmbFileEventData;
}

export type SmbAuditEntry =
  | SmbConnectEntry
  | SmbDisconnectEntry
  | SmbCreateEntry
  | SmbCloseEntry
  | SmbReadEntry
  | SmbWriteEntry
  | SmbOffloadReadEntry
  | SmbOffloadWriteEntry
  | SmbRenameEntry
  | SmbUnlinkEntry
  | SmbSetQuotaEntry
  | SmbAuthenticationEntry
  | SmbSetAttrEntry
  | SmbSetAclEntry;

export interface AuditSmbServiceData {
  vers: AuditVersions;
  service: string;
  session_id: string;
  tcon_id: string;
}

export interface AuditSmbFile {
  path: string;
  stream: unknown;
  snap: unknown;
  handle: {
    type: string;
    value: string;
  };
}

export interface SmbOperations {
  read_cnt: string;
  read_bytes: string;
  write_cnt: string;
  write_bytes: string;
}

export interface SmbUnixToken {
  uid: number;
  gid: number;
  groups: number[];
}
