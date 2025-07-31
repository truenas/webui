export function extractVersion(version: string): string | undefined {
  return /(\d+\.\d+)(?:\.\d+)?/.exec(version)?.[1];
}
