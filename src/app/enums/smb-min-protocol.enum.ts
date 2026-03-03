import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum SmbMinProtocol {
  Smb1 = 'SMB1',
  Smb2 = 'SMB2',
  Smb3 = 'SMB3',
}

export const smbMinProtocolLabels = new Map<SmbMinProtocol, string>([
  [SmbMinProtocol.Smb1, T('SMB1 – legacy clients (not recommended)')],
  [SmbMinProtocol.Smb2, T('SMB2 – default')],
  [SmbMinProtocol.Smb3, T('SMB3 – modern clients only')],
]);
