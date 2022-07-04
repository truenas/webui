import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';

export function isRootDataset(dataset: Dataset): boolean {
  return dataset.name.split('/').length === 1;
}

export function isEncryptionRoot(dataset: Dataset): boolean {
  return dataset.encryption_root === dataset.id;
}

export function isPasswordEncrypted(dataset: Dataset): boolean {
  return dataset.key_format?.value === EncryptionKeyFormat.Passphrase;
}

export function isIocageMounted(dataset: Dataset): boolean {
  return dataset.mountpoint.split('/')[1] === 'iocage';
}
