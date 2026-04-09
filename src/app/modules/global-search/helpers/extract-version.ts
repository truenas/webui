export function extractVersion(version: string): string | undefined {
  return /(\d+)(?:\.\d+)+/.exec(version)?.[1];
}
