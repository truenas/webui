export function isEmptyHomeDirectory(home: string): boolean {
  return !home
    || home === '/nonexistent'
    || home === '/usr/empty';
}
