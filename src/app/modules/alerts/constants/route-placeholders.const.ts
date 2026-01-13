/**
 * Route placeholders for dynamic alert navigation.
 * These placeholders are replaced at runtime with extracted values from alert data.
 *
 * Usage in alert enhancement registry:
 * ```typescript
 * {
 *   route: ['/storage', routePlaceholders.poolId, 'vdevs'],
 *   extractApiParams: (alert) => ({ poolId: alert.args.id })  // Returns mapping object
 * }
 * ```
 *
 * The SmartAlertService will automatically replace placeholders with extracted values.
 */
export const routePlaceholders = {
  /**
   * Placeholder for pool ID in storage routes.
   * Replaced with the pool ID extracted from alert.args.id
   */
  poolId: '__POOL_ID__',

  /**
   * Placeholder for dataset ID in dataset routes.
   * Replaced with the dataset ID extracted from alert data.
   */
  datasetId: '__DATASET_ID__',

  /**
   * Placeholder for task ID in task routes.
   * Replaced with the task ID extracted from alert data.
   */
  taskId: '__TASK_ID__',

  /**
   * Placeholder for share ID in sharing routes.
   * Replaced with the share ID extracted from alert data.
   */
  shareId: '__SHARE_ID__',
} as const;

/**
 * Type for route placeholder values
 */
export type RoutePlaceholder = typeof routePlaceholders[keyof typeof routePlaceholders];

/**
 * Helper function to check if a route segment is a placeholder
 */
export function isRoutePlaceholder(segment: string): segment is RoutePlaceholder {
  return Object.values(routePlaceholders).includes(segment as RoutePlaceholder);
}
