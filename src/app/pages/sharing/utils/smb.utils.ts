export function isRootShare(path: string): boolean {
  return !path.replace('/mnt/', '').includes('/');
}
