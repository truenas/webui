export function extractVersion(version: string | undefined | null): string | undefined {
  if (!version) return undefined;
  return /(\d+)(?:\.\d+)+/.exec(version)?.[1];
}
