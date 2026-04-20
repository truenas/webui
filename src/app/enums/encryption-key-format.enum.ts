import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum EncryptionKeyFormat {
  Hex = 'HEX',
  Passphrase = 'PASSPHRASE',
}

export const encryptionKeyFormatNames = new Map<EncryptionKeyFormat, string>([
  [EncryptionKeyFormat.Hex, T('Key')],
  [EncryptionKeyFormat.Passphrase, T('Passphrase')],
]);
