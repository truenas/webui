
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
 * Formats a version display string, emphasizing app version over revision.
 * Can show just app version or include revision for uniqueness.
 *
 * @param libraryVersion - The internal library version (e.g., "2.1.22")
 * @param humanVersion - The human-readable version string or app version (e.g., "32.0.3_2.1.22" or "32.0.3")
 * @param options - Optional configuration
 * @param options.showRevision - Whether to show revision in parentheses (default: true)
 * @returns Formatted version string
 *
 * @example
 * formatVersionLabel("2.1.22", "32.0.3_2.1.22") // Returns "32.0.3 (2.1.22)"
 * formatVersionLabel("2.1.22", "32.0.3_2.1.22", { showRevision: false }) // Returns "32.0.3"
 * formatVersionLabel("1.0.0", "1.0.0") // Returns "1.0.0 (1.0.0)"
 */
export function formatVersionLabel(
  libraryVersion: string,
  humanVersion: string | undefined,
  options: { showRevision?: boolean } = {},
): string {
  const { showRevision = true } = options;
  const appVersion = extractAppVersion(humanVersion, libraryVersion);

  // If showRevision is false (e.g., app version is changing), show only app version
  if (!showRevision) {
    return appVersion;
  }

  // Otherwise show app version with revision in parentheses for uniqueness
  return `${appVersion} (${libraryVersion})`;
}

/**
 * Formats a version label with explicit "Version" and "Revision" labels.
 * Used in dropdown options and update dialogs for clarity.
 *
 * @param libraryVersion - The internal library version (e.g., "2.1.22")
 * @param humanVersion - The human-readable version string (e.g., "32.0.3_2.1.22")
 * @returns Formatted string in the format "Version: X / Revision: Y"
 *
 * @example
 * formatVersionWithRevision("2.1.22", "32.0.3_2.1.22") // Returns "Version: 32.0.3 / Revision: 2.1.22"
 * formatVersionWithRevision("1.0.0", "1.0.0") // Returns "Version: 1.0.0 / Revision: 1.0.0"
 */
export function formatVersionWithRevision(libraryVersion: string, humanVersion: string): string {
  const appVersion = extractAppVersion(humanVersion, libraryVersion);
  return `Version: ${appVersion} / Revision: ${libraryVersion}`;
}
