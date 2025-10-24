import { specialVdevDefaultThreshold } from 'app/constants/dataset.constants';
import { EncryptionKeyFormat } from 'app/enums/encryption-key-format.enum';
import { inherit, WithInherit } from 'app/enums/with-inherit.enum';
import { ZfsPropertySource } from 'app/enums/zfs-property-source.enum';
import { Dataset, DatasetDetails } from 'app/interfaces/dataset.interface';
import { ZfsProperty } from 'app/interfaces/zfs-property.interface';

export const ixAppsDataset = 'ix-apps';

export function getDatasetLabel(dataset: Pick<Dataset, 'name'>): string {
  if (!dataset?.name) {
    return '';
  }
  const segments = dataset.name.split('/');
  if (segments.length === 1) {
    return dataset.name;
  }
  return segments[segments.length - 1];
}

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
  return dataset.mountpoint?.split('/')?.[1] === 'iocage';
}

export function isPropertyInherited(property?: ZfsProperty<unknown>): boolean {
  return !property?.source
    || property.source === ZfsPropertySource.Inherited
    || property.source === ZfsPropertySource.Default;
}

export function doesDatasetOrChildrenHaveShares(dataset: DatasetDetails): boolean {
  if (dataset.nfs_shares?.length || dataset.smb_shares?.length || dataset.iscsi_shares?.length) {
    return true;
  }
  for (const child of (dataset.children || [])) {
    if (doesDatasetOrChildrenHaveShares(child)) {
      return true;
    }
  }
  return false;
}

export function doesDatasetHaveShares(dataset: DatasetDetails): boolean {
  if (!dataset.children?.length) {
    return false;
  }
  for (const child of dataset.children) {
    if (doesDatasetOrChildrenHaveShares(child)) {
      return true;
    }
  }
  return false;
}

export function datasetNameSortComparer(a: DatasetDetails, b: DatasetDetails): number {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'variant' });

  const partsA = a.name.split('/');
  const partsB = b.name.split('/');
  const minLength = Math.min(partsA.length, partsB.length);

  for (let i = 0; i < minLength; i++) {
    const compareResult = collator.compare(partsA[i], partsB[i]);
    if (compareResult !== 0) {
      return compareResult;
    }
  }

  return partsA.length - partsB.length;
}

/**
 * Known user property keys that are commonly accessed in the application
 */
export type UserPropertyKey = 'comments' | 'managedby' | 'refquota_warning' | 'refquota_critical' | 'quota_warning' | 'quota_critical';

/**
 * Safely retrieves a user property from a dataset with proper type casting
 * @param dataset The dataset or dataset details object
 * @param key The user property key to retrieve
 * @returns The ZfsProperty or undefined if not found
 */
export function getUserProperty<T>(
  dataset: Pick<Dataset | DatasetDetails, 'user_properties'>,
  key: UserPropertyKey,
): ZfsProperty<string, T> | undefined {
  return dataset.user_properties?.[key] as ZfsProperty<string, T> | undefined;
}

/**
 * Transforms the special_small_block_size UI values to API payload format
 * @param uiValue The UI value ('ON', 'OFF', or inherit)
 * @param customValue The custom threshold value in bytes (optional)
 * @returns The API payload value (number or inherit), or undefined if should be deleted from payload
 */
export function transformSpecialSmallBlockSizeForPayload(
  uiValue: WithInherit<'ON' | 'OFF'>,
  customValue: number | null,
): number | typeof inherit | undefined {
  if (uiValue === 'ON') {
    // Use custom value if set, otherwise default to 128 KiB
    // This preserves existing custom values even when the customize section is collapsed
    return customValue ?? specialVdevDefaultThreshold;
  }

  if (uiValue === 'OFF') {
    // When OFF, set to 0 to disable special vdev usage
    return 0;
  }

  if (uiValue === inherit) {
    // When INHERIT, return inherit for datasets or undefined for zvols
    return inherit;
  }

  // For any other value (like null or number), return undefined to delete from payload
  return undefined;
}
