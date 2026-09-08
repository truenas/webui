import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum S3Access {
  ReadOnly = 'READONLY',
  WriteOnly = 'WRITEONLY',
  ReadWrite = 'READWRITE',
  Deny = 'DENY',
}

export const s3AccessLabels = new Map<S3Access, string>([
  [S3Access.ReadOnly, T('Read Only')],
  [S3Access.WriteOnly, T('Write Only')],
  [S3Access.ReadWrite, T('Read / Write')],
  [S3Access.Deny, T('Deny')],
]);

export enum S3PrincipalType {
  User = 'USER',
  Group = 'GROUP',
  Everyone = 'EVERYONE',
}

export const s3PrincipalTypeLabels = new Map<S3PrincipalType, string>([
  [S3PrincipalType.User, T('User')],
  [S3PrincipalType.Group, T('Group')],
  [S3PrincipalType.Everyone, T('Everyone')],
]);

export enum S3PermissionsModel {
  S3 = 'S3',
  Multiprotocol = 'MULTIPROTOCOL',
  BucketOwnerEnforced = 'S3_BUCKET_OWNER_ENFORCED',
}

export const s3PermissionsModelLabels = new Map<S3PermissionsModel, string>([
  [S3PermissionsModel.S3, T('S3 Only')],
  [S3PermissionsModel.Multiprotocol, T('Multiprotocol')],
  [S3PermissionsModel.BucketOwnerEnforced, T('Bucket Owner Enforced')],
]);

export enum S3Versioning {
  Off = 'OFF',
  Enabled = 'ENABLED',
  Suspended = 'SUSPENDED',
}

export const s3VersioningLabels = new Map<S3Versioning, string>([
  [S3Versioning.Off, T('Off')],
  [S3Versioning.Enabled, T('Enabled')],
  [S3Versioning.Suspended, T('Suspended')],
]);

export enum S3MultipartEtag {
  Composite = 'COMPOSITE',
  Minted = 'MINTED',
}

export const s3MultipartEtagLabels = new Map<S3MultipartEtag, string>([
  [S3MultipartEtag.Composite, T('Composite (S3 standard)')],
  [S3MultipartEtag.Minted, T('Minted (opaque token)')],
]);

export enum S3ObjectLockMode {
  Governance = 'GOVERNANCE',
  Compliance = 'COMPLIANCE',
}

export const s3ObjectLockModeLabels = new Map<S3ObjectLockMode, string>([
  [S3ObjectLockMode.Governance, T('Governance')],
  [S3ObjectLockMode.Compliance, T('Compliance')],
]);

export enum S3AuditOverflow {
  Drop = 'DROP',
  Backpressure = 'BACKPRESSURE',
}

export const s3AuditOverflowLabels = new Map<S3AuditOverflow, string>([
  [S3AuditOverflow.Drop, T('Drop the record')],
  [S3AuditOverflow.Backpressure, T('Answer the client with a retryable 503')],
]);

export enum S3LogLevel {
  Error = 'ERROR',
  Warning = 'WARNING',
  Notice = 'NOTICE',
  Info = 'INFO',
  Debug = 'DEBUG',
}

export const s3LogLevelLabels = new Map<S3LogLevel, string>([
  [S3LogLevel.Error, T('Error')],
  [S3LogLevel.Warning, T('Warning')],
  [S3LogLevel.Notice, T('Notice')],
  [S3LogLevel.Info, T('Info')],
  [S3LogLevel.Debug, T('Debug')],
]);

export enum S3AccessKeyStatus {
  Enabled = 'ENABLED',
  Disabled = 'DISABLED',
  Expired = 'EXPIRED',
  UserMissing = 'USER_MISSING',
  SecretLost = 'SECRET_LOST',
}

export const s3AccessKeyStatusLabels = new Map<S3AccessKeyStatus, string>([
  [S3AccessKeyStatus.Enabled, T('Enabled')],
  [S3AccessKeyStatus.Disabled, T('Disabled')],
  [S3AccessKeyStatus.Expired, T('Expired')],
  [S3AccessKeyStatus.UserMissing, T('User Missing')],
  [S3AccessKeyStatus.SecretLost, T('Secret Lost')],
]);

/**
 * Sent as `audit` / `default_audit`: the literal `ALL`, or a list of audit action names.
 */
export const s3AuditAll = 'ALL';

/**
 * How the UI presents the audit mask choice. Not a middleware value.
 */
export enum S3AuditMode {
  Inherit = 'INHERIT',
  All = 'ALL',
  None = 'NONE',
  Selected = 'SELECTED',
}

export const s3AuditModeLabels = new Map<S3AuditMode, string>([
  [S3AuditMode.Inherit, T('Use service default')],
  [S3AuditMode.All, T('Audit all actions')],
  [S3AuditMode.None, T('Audit nothing')],
  [S3AuditMode.Selected, T('Audit selected actions')],
]);
