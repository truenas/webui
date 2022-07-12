import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { Dataset } from 'app/interfaces/dataset.interface';

export function isRootDataset(dataset: Pick<Dataset, 'name'>): boolean {
  return dataset.name.split('/').length === 1;
}

export function isEncryptionRoot(dataset: Pick<Dataset, 'encryption_root' | 'id'>): boolean {
  return dataset.encryption_root === dataset.id;
}

export function isPasswordEncrypted(dataset: Pick<Dataset, 'key_format'>): boolean {
  return dataset.key_format?.value === EncryptionKeyFormat.Passphrase;
}

export function isIocageMounted(dataset: Pick<Dataset, 'mountpoint'>): boolean {
  return dataset.mountpoint.split('/')[1] === 'iocage';
}
