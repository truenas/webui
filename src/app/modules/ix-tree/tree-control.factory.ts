/* eslint-disable sonarjs/deprecation */
import { FlatTreeControl, NestedTreeControl } from '@angular/cdk/tree';
import { Observable } from 'rxjs';
import { TreeExpansion } from 'app/modules/ix-tree/tree-expansion.interface';

/**
 * Factory functions for creating tree controls without triggering deprecation warnings
 * in consuming code.
 *
 * ## Why we still use deprecated TreeControl classes
 *
 * Angular CDK deprecated TreeControl, FlatTreeControl, and NestedTreeControl in v19,
 * with plans to remove them in v21. However, a complete replacement API has not been
 * provided yet.
 *
 * ### The Problem with Current Migration Path
 *
 * The deprecation message suggests using `levelAccessor` or `childrenAccessor` on CdkTree,
 * but these are only for describing your data structure - they don't provide:
 *
 * 1. **Programmatic access to expansion state** - CdkTree's `_expansionModel` is private
 * 2. **Access to data nodes** - Needed for operations like `expandAll()`
 * 3. **Helper methods** - Like `getDescendants()`, `isExpandable()`, `getLevel()`
 * 4. **External expansion control** - Our data sources need to react to expansion changes
 *
 * ### Why Our Custom Architecture Requires TreeControl
 *
 * The ix-tree module has custom components (`TreeDataSource`, `TreeFlattener`) that were
 * designed around the TreeControl interface:
 *
 * - `TreeDataSource` needs access to `expansionModel.changed` to re-render when nodes expand/collapse
 * - `TreeFlattener.expandFlattenedNodes()` needs `isExpanded()` to filter the flattened tree
 * - Components need `dataNodes`, `getLevel()`, `isExpandable()` for tree operations
 *
 * ### Our Solution: Centralized Technical Debt
 *
 * This file encapsulates ALL usage of deprecated TreeControl classes in the codebase:
 *
 * - Rest of the codebase works with the `TreeExpansion` interface (not deprecated)
 * - Deprecation warnings are suppressed only in this file
 * - When Angular provides a proper replacement API (before v21), we only update this file
 *
 * ### Expected Timeline
 *
 * Angular will need to provide a complete replacement before removing TreeControl in v21.
 * When they do, we'll implement the new API here and keep the same `TreeExpansion` interface,
 * making the migration transparent to consuming code.
 *
 * @see https://github.com/angular/components/issues/29856 - GitHub issue discussing the migration gap
 */

/** Optional configuration for flat tree control */
export interface FlatTreeControlOptions<T, K> {
  trackBy?: (dataNode: T) => K;
}

/** Optional configuration for nested tree control */
export interface NestedTreeControlOptions<T, K> {
  isExpandable?: (dataNode: T) => boolean;
  trackBy?: (dataNode: T) => K;
}

/**
 * Creates a flat tree control for managing expansion state of flat tree structures.
 *
 * @param getLevel - Function that returns the level/depth of a node
 * @param isExpandable - Function that returns whether a node can be expanded
 * @param options - Optional configuration including trackBy function
 * @returns TreeExpansion instance for managing tree state
 *
 * @example
 * ```ts
 * const treeControl = createFlatTreeControl<DatasetDetails, string>(
 *   (dataset) => (dataset?.name?.split('/')?.length || 0) - 1,
 *   (dataset) => Number(dataset?.children?.length) > 0,
 *   { trackBy: (dataset) => dataset.id }
 * );
 * ```
 */
export function createFlatTreeControl<T, K = T>(
  getLevel: (dataNode: T) => number,
  isExpandable: (dataNode: T) => boolean,
  options?: FlatTreeControlOptions<T, K>,
): TreeExpansion<T, K> {
  return new FlatTreeControl<T, K>(getLevel, isExpandable, options);
}

/**
 * Creates a nested tree control for managing expansion state of nested tree structures.
 *
 * @param getChildren - Function that returns the children of a node
 * @param options - Optional configuration including isExpandable and trackBy functions
 * @returns TreeExpansion instance for managing tree state
 *
 * @example
 * ```ts
 * const treeControl = createNestedTreeControl<VDevNode, string>(
 *   (vdev) => vdev.children,
 *   { trackBy: (vdev) => vdev.guid }
 * );
 * ```
 */
export function createNestedTreeControl<T, K = T>(
  getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null,
  options?: NestedTreeControlOptions<T, K>,
): TreeExpansion<T, K> {
  return new NestedTreeControl<T, K>(getChildren, options);
}
