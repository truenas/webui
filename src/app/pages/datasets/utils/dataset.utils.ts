import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';

export function isRootDataset(dataset: { mountpoint: string }): boolean {
  return (dataset.mountpoint.match(/\//g) || []).length <= 2;
}

export function isEncryptionRoot(dataset: Dataset): boolean {
  return dataset.encryption_root === dataset.id;
}

export function isPasswordEncrypted(dataset: Dataset): boolean {
  return dataset.key_format?.value === EncryptionKeyFormat.Passphrase;
}
