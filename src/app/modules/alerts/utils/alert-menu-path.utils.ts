import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';

/**
 * Menu paths whose pages should show the alert banner.
 * `bannerMenuPath` narrows the primary scope (see SmartAlertEnhancement), falling back
 * to the path that drives the nav badge.
 */
export function getAlertBannerMenuPaths(alert: EnhancedAlert): string[][] {
  const primaryPath = alert.bannerMenuPath ?? alert.relatedMenuPath;
  return primaryPath ? [primaryPath] : [];
}

/**
 * True when the current route is at or below the given menu path.
 * Dataset routes use /datasets/:datasetId, so ['datasets'] still matches /datasets/tank.
 */
export function isRouteUnderMenuPath(menuPath: string[], pathSegments: string[]): boolean {
  return menuPath.length <= pathSegments.length
    && menuPath.every((segment, index) => pathSegments[index] === segment);
}
