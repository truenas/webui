import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum AuditService {
  Smb = 'SMB',
  Middleware = 'MIDDLEWARE',
  Sudo = 'SUDO',
  System = 'SYSTEM',
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
  Generic = 'GENERIC',
  Reject = 'REJECT',
  Reboot = 'REBOOT',
  Logout = 'LOGOUT',
  Login = 'LOGIN',
  Credential = 'CREDENTIAL',
  Escalation = 'ESCALATION',
  Privileged = 'PRIVILEGED',
  Export = 'EXPORT',
  Identity = 'IDENTITY',
  TimeChange = 'TIME-CHANGE',
  ModuleLoad = 'MODULE-LOAD',
  Service = 'SERVICE',
  TtyRecord = 'TTY_RECORD',
  WebshellAuthentication = 'WEBSHELL_AUTHENTICATION',
  WebshellLogout = 'WEBSHELL_LOGOUT',
}

export enum WebshellType {
  App = 'APP',
  Container = 'CONTAINER',
  Host = 'HOST',
  Vm = 'VM',
}

export const webshellTypeLabels = new Map<WebshellType, string>([
  [WebshellType.App, T('App')],
  [WebshellType.Container, T('Container')],
  [WebshellType.Host, T('Host')],
  [WebshellType.Vm, T('VM')],
]);

export const auditServiceLabels = new Map<AuditService, string>([
  [AuditService.Smb, T('SMB')],
  [AuditService.Middleware, T('Middleware')],
  [AuditService.Sudo, T('Sudo')],
  [AuditService.System, T('System')],
]);
