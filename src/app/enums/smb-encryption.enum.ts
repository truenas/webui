import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum SmbEncryption {
  Default = 'DEFAULT',
  Negotiate = 'NEGOTIATE',
  Desired = 'DESIRED',
  Required = 'REQUIRED',
}

export const smbEncryptionLabels = new Map<SmbEncryption, string>([
  [SmbEncryption.Default, T('Default – follow upstream / TrueNAS default')],
  [SmbEncryption.Negotiate, T('Negotiate – only encrypt transport if explicitly requested by the SMB client')],
  [SmbEncryption.Desired, T('Desired – encrypt transport if supported by client during session negotiation')],
  [SmbEncryption.Required, T('Required – always encrypt transport (rejecting access if client does not support encryption – incompatible with SMB1 server enable_smb1)')],
]);
