import { HarnessPredicate } from '@angular/cdk/testing';
import {
  MatTreeHarness, TreeHarnessFilters, TreeNodeHarnessFilters,
} from '@angular/material/tree/testing';
import { TreeNodeHarness } from 'app/modules/ix-tree/testing/tree-node.harness';

export class TreeHarness extends MatTreeHarness {
  static override readonly hostSelector = '.ix-tree';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tree with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static override with(options: TreeHarnessFilters = {}): HarnessPredicate<TreeHarness> {
    return new HarnessPredicate(TreeHarness, options);
  }

  override async getNodes(filter: TreeNodeHarnessFilters = {}): Promise<TreeNodeHarness[]> {
    return this.locatorForAll(TreeNodeHarness.with(filter))();
  }
}
