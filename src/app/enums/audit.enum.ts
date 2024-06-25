import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AuditService {
  Smb = 'SMB',
  Middleware = 'MIDDLEWARE',
  Sudo = 'SUDO',
}

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
  MethodCall = 'METHOD_CALL',
  Accept = 'ACCEPT',
  Reject = 'REJECT',
}

export const auditServiceLabels = new Map<AuditService, string>([
  [AuditService.Smb, T('SMB')],
  [AuditService.Middleware, T('Middleware')],
  [AuditService.Sudo, T('Sudo')],
]);

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
  [AuditEvent.MethodCall, T('Method Call')],
  [AuditEvent.Accept, T('Accept')],
  [AuditEvent.Reject, T('Reject')],
]);
