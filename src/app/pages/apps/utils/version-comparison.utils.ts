import { App } from 'app/interfaces/app.interface';
import { extractAppVersion } from './version-formatting.utils';

export interface VersionChange {
  hasAppVersionChange: boolean;
  hasRevisionChange: boolean;
}

/**
 * Analyzes an app to determine what type of version changes are available.
 * Compares current versions with latest available versions to detect:
 * - App version changes (upstream application version)
 * - Revision changes (catalog version/revision)
 *
 * @param app - The app to analyze
 * @returns Object indicating which types of changes are available
 *
 * @example
 * // App with revision-only change
 * analyzeVersionChange(app) // Returns { hasAppVersionChange: false, hasRevisionChange: true }
 *
 * // App with app version change (revision will also change)
 * analyzeVersionChange(app) // Returns { hasAppVersionChange: true, hasRevisionChange: true }
 */
export function analyzeVersionChange(app: App): VersionChange {
  // If no upgrade is available, return no changes
  if (!app.upgrade_available) {
    return {
      hasAppVersionChange: false,
      hasRevisionChange: false,
    };
  }

  // Check if revision changed
  const hasRevisionChange = app.version !== app.latest_version;

  // Extract current app version from human_version
  const currentAppVersion = extractAppVersion(app.human_version, app.version);

  // Use latest_app_version from the API if available
  // Otherwise, default to true (show "Update available") as a conservative fallback until backend implements the field
  const latestAppVersion = app.latest_app_version;

  const hasAppVersionChange = latestAppVersion !== undefined
    ? currentAppVersion !== latestAppVersion
    : true; // Fallback: if backend doesn't provide field yet, show "Update available" for all updates

  return {
    hasAppVersionChange,
    hasRevisionChange,
  };
}
