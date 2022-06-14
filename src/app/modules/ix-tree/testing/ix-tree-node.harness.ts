import { HarnessPredicate } from '@angular/cdk/testing';
import { MatTreeNodeHarness, TreeNodeHarnessFilters } from '@angular/material/tree/testing';

export class IxTreeNodeHarness extends MatTreeNodeHarness {
  static override hostSelector = '.ix-tree-node';
  static override with(options?: TreeNodeHarnessFilters): HarnessPredicate<IxTreeNodeHarness> {
    return new HarnessPredicate(IxTreeNodeHarness, options);
  }
}
