import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';

/**
 * Menu paths that should show a navigation badge for this alert.
 * `extraMenuPaths` lets an alert that spans two feature areas badge both of them.
 */
export function getAlertBadgeMenuPaths(alert: EnhancedAlert): string[][] {
  return [
    ...(alert.relatedMenuPath ? [alert.relatedMenuPath] : []),
    ...(alert.extraMenuPaths || []),
  ];
}

/**
 * Menu paths whose pages should show the alert banner.
 * `bannerMenuPath` narrows the primary scope (see SmartAlertEnhancement), while
 * `extraMenuPaths` widens it to the alert's secondary feature areas.
 */
export function getAlertBannerMenuPaths(alert: EnhancedAlert): string[][] {
  const primaryPath = alert.bannerMenuPath ?? alert.relatedMenuPath;
  return [
    ...(primaryPath ? [primaryPath] : []),
    ...(alert.extraMenuPaths || []),
  ];
}

/**
 * True when the current route is at or below the given menu path.
 * Dataset routes use /datasets/:datasetId, so ['datasets'] still matches /datasets/tank.
 */
export function isRouteUnderMenuPath(menuPath: string[], pathSegments: string[]): boolean {
  return menuPath.length <= pathSegments.length
    && menuPath.every((segment, index) => pathSegments[index] === segment);
}
