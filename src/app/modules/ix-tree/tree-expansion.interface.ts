import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';

/**
 * Interface for tree expansion state management.
 * This interface replaces the deprecated TreeControl from @angular/cdk/tree.
 *
 * It provides the same methods as the deprecated TreeControl interface
 * without directly referencing the deprecated type.
 *
 * Both FlatTreeControl and NestedTreeControl implement all these methods,
 * so this interface maintains full compatibility with existing code.
 */
export interface TreeExpansion<T, K = T> {
  /** The saved tree nodes data for `expandAll` action. */
  dataNodes: T[];

  /** The expansion model */
  expansionModel: SelectionModel<K>;

  /** Whether the data node is expanded or collapsed. Return true if it's expanded. */
  isExpanded(dataNode: T): boolean;

  /** Get all descendants of a data node */
  getDescendants(dataNode: T): T[];

  /** Expand or collapse data node */
  toggle(dataNode: T): void;

  /** Expand one data node */
  expand(dataNode: T): void;

  /** Collapse one data node */
  collapse(dataNode: T): void;

  /** Expand all the dataNodes in the tree */
  expandAll(): void;

  /** Collapse all the dataNodes in the tree */
  collapseAll(): void;

  /** Toggle a data node by expand/collapse it and all its descendants */
  toggleDescendants(dataNode: T): void;

  /** Expand a data node and all its descendants */
  expandDescendants(dataNode: T): void;

  /** Collapse a data node and all its descendants */
  collapseDescendants(dataNode: T): void;

  /** Get depth of a given data node, return the level number. This is for flat tree node. */
  readonly getLevel: (dataNode: T) => number;

  /**
   * Whether the data node is expandable. Returns true if expandable.
   * This is for flat tree node.
   */
  readonly isExpandable: (dataNode: T) => boolean;

  /** Gets a stream that emits whenever the given data node's children change. */
  readonly getChildren: (dataNode: T) => Observable<T[]> | T[] | undefined | null;
}
