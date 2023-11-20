import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AuditEvent {
  Connect = 'CONNECT',
  Disconnect = 'DISCONNECT',
  Create = 'CREATE',
  Close = 'CLOSE',
  Read = 'READ',
  Write = 'WRITE',
  OffloadRead = 'OFFLOAD_READ',
  OffloadWrite = 'OFFLOAD_WRITE',
  SetAcl = 'SET_ACL',
  Rename = 'RENAME',
  Unlink = 'UNLINK',
  SetAttr = 'SET_ATTR',
  SetQuota = 'SET_QUOTA',
  Authentication = 'AUTHENTICATION',
}

export const auditEventLabels = new Map<AuditEvent, string>([
  [AuditEvent.Connect, T('Connect')],
  [AuditEvent.Disconnect, T('Disconnect')],
  [AuditEvent.Create, T('Create')],
  [AuditEvent.Close, T('Close')],
  [AuditEvent.Read, T('Read')],
  [AuditEvent.Write, T('Write')],
  [AuditEvent.OffloadRead, T('Offload Read')],
  [AuditEvent.OffloadWrite, T('Offload Write')],
  [AuditEvent.SetAcl, T('Set ACL')],
  [AuditEvent.Rename, T('Rename')],
  [AuditEvent.Unlink, T('Unlink')],
  [AuditEvent.SetAttr, T('Set Attribute')],
  [AuditEvent.SetQuota, T('Set Quota')],
  [AuditEvent.Authentication, T('Authentication')],
]);
