import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { isRootShare } from 'app/pages/sharing/utils/smb.utils';

export function isShareOnExportedPool(path: string | null | undefined, activePoolPaths: string[] | null): boolean {
  if (activePoolPaths === null) {
    return false;
  }
  if (!path?.startsWith('/mnt/')) {
    return false;
  }
  return !activePoolPaths.some((poolPath) => path === poolPath || path.startsWith(poolPath + '/'));
}

export function isShareUnavailable(
  row: { locked: boolean; path: string },
  activePoolPaths: string[] | null,
): boolean {
  return row.locked || isShareOnExportedPool(row.path, activePoolPaths);
}

export function getUnavailableReason(
  row: { locked: boolean; path: string },
  activePoolPaths: string[] | null,
): string {
  if (row.locked) {
    return T('Dataset is locked');
  }
  if (isShareOnExportedPool(row.path, activePoolPaths)) {
    return T('Share is on an exported pool');
  }
  return '';
}

export function getFilesystemAclUnavailableReason(
  row: { locked: boolean; path: string },
  activePoolPaths: string[] | null,
): string {
  if (isRootShare(row.path)) {
    return T('This action is not available for root shares');
  }
  return getUnavailableReason(row, activePoolPaths);
}
