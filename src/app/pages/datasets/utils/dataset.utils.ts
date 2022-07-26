import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

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

export function isPropertyInherited(property: ZfsProperty<unknown>): boolean {
  return !property
    || !property.source
    || property.source === ZfsPropertySource.Inherited
    || property.source === ZfsPropertySource.Default;
}
