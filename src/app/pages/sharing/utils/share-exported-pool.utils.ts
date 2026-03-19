import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export function isShareOnExportedPool(path: string, activePoolPaths: string[]): boolean {
  if (!path.startsWith('/mnt/')) return false;
  return !activePoolPaths.some((poolPath) => path === poolPath || path.startsWith(poolPath + '/'));
}

export function isShareUnavailable(row: { locked: boolean; path: string }, activePoolPaths: string[]): boolean {
  return row.locked || isShareOnExportedPool(row.path, activePoolPaths);
}

export function getUnavailableReason(row: { locked: boolean; path: string }, activePoolPaths: string[]): string {
  if (row.locked) return T('Dataset is locked');
  if (isShareOnExportedPool(row.path, activePoolPaths)) return T('Share is on an exported pool');
  return '';
}
