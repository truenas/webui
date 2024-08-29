export function extractVersion(version: string): string | undefined {
  return version.match(/(\d+\.\d+)(?:\.\d+)?/)?.[1];
}
