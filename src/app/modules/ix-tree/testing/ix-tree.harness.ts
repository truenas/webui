import { HarnessPredicate } from '@angular/cdk/testing';
import {
  MatTreeHarness, TreeHarnessFilters, TreeNodeHarnessFilters,
} from '@angular/material/tree/testing';
import { IxTreeNodeHarness } from 'app/modules/ix-tree/testing/ix-tree-node.harness';

export class IxTreeHarness extends MatTreeHarness {
  static override hostSelector = '.ix-tree';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a tree with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(options: TreeHarnessFilters = {}): HarnessPredicate<IxTreeHarness> {
    return new HarnessPredicate(IxTreeHarness, options);
  }

  async getNodes(filter: TreeNodeHarnessFilters = {}): Promise<IxTreeNodeHarness[]> {
    return this.locatorForAll(IxTreeNodeHarness.with(filter))();
  }
}
