/**
 * Extracts the upstream app version from a version string.
 * Handles the format "app_version_library_version" by removing the library version suffix.
 *
 * @param humanVersion - The human-readable version string (e.g., "32.0.3_2.1.22")
 * @param libraryVersion - The internal library version (e.g., "2.1.22")
 * @returns The upstream app version (e.g., "32.0.3")
 *
 * @example
 * extractAppVersion("32.0.3_2.1.22", "2.1.22") // Returns "32.0.3"
 * extractAppVersion("1.0.0", "1.0.0") // Returns "1.0.0"
 * extractAppVersion(undefined, "1.0.0") // Returns "1.0.0"
 */
export function extractAppVersion(humanVersion: string | undefined, libraryVersion: string): string {
  if (!humanVersion) {
    return libraryVersion;
  }

  // Remove the library version suffix if it's in the format "app_version_library_version"
  if (humanVersion.endsWith('_' + libraryVersion)) {
    return humanVersion.slice(0, -(libraryVersion.length + 1));
  }

  return humanVersion;
}

/**
 * Formats a version display string to show both library version and app version.
 *
 * @param libraryVersion - The internal library version (e.g., "2.1.22")
 * @param humanVersion - The human-readable version string or app version (e.g., "32.0.3_2.1.22" or "32.0.3")
 * @returns Formatted version string (e.g., "2.1.22 (32.0.3)")
 *
 * @example
 * formatVersionLabel("2.1.22", "32.0.3_2.1.22") // Returns "2.1.22 (32.0.3)"
 * formatVersionLabel("1.0.0", "1.0.0") // Returns "1.0.0 (1.0.0)"
 * formatVersionLabel("1.0.0", undefined) // Returns "1.0.0 (1.0.0)"
 */
export function formatVersionLabel(libraryVersion: string, humanVersion: string | undefined): string {
  const appVersion = extractAppVersion(humanVersion, libraryVersion);
  return `${libraryVersion} (${appVersion})`;
}
