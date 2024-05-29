import { glob } from 'glob';

export function findComponentFiles(pattern: string): Promise<string[]> {
  return glob(pattern);
}
