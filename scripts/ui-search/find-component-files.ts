import { glob } from 'fs/promises';

export async function findComponentFiles(pattern: string): Promise<string[]> {
  const files: string[] = [];
  for await (const file of glob(pattern)) {
    files.push(file);
  }
  return files;
}
