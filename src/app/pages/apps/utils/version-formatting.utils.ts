
/**
 * Extracts the upstream app version by dropping the library version suffix from a human version
 * in the form "app_version_library_version": ("32.0.3_2.1.22", "2.1.22") → "32.0.3".
 * Without a human version, returns the library version.
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
 * Formats the app version with the revision in parentheses, which keeps labels unique:
 * ("2.1.22", "32.0.3_2.1.22") → "32.0.3 (2.1.22)". Pass `showRevision: false` for the app version alone.
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
 * Formats "Version: X / Revision: Y" for dropdown options and update dialogs,
 * e.g. ("2.1.22", "32.0.3_2.1.22") → "Version: 32.0.3 / Revision: 2.1.22".
 */
export function formatVersionWithRevision(libraryVersion: string, humanVersion: string): string {
  const appVersion = extractAppVersion(humanVersion, libraryVersion);
  return `Version: ${appVersion} / Revision: ${libraryVersion}`;
}

/**
 * Resolves the app version using a preferred app_version if available,
 * falling back to extracting it from humanVersion and libraryVersion.
 *
 * @param options.appVersion - Pre-resolved app version from the API (preferred)
 * @param options.humanVersion - Human-readable version string for extraction fallback
 * @param options.libraryVersion - Library/catalog version for extraction fallback
 * @returns The resolved app version string
 */
export function resolveAppVersion(options: {
  appVersion?: string;
  humanVersion?: string;
  libraryVersion: string;
}): string {
  return options.appVersion
    || extractAppVersion(options.humanVersion, options.libraryVersion);
}
