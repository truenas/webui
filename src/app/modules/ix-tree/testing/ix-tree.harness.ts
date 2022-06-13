import { HarnessPredicate } from '@angular/cdk/testing';
import {
  MatTreeHarness, TreeHarnessFilters,
} from '@angular/material/tree/testing';

export class IxTreeHarness extends MatTreeHarness {
  static override hostSelector = '.ix-tree';
  /**
   * Gets a `HarnessPredicate` that can be used to search for a tree with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static override with(options?: TreeHarnessFilters): HarnessPredicate<IxTreeHarness> {
    return new HarnessPredicate(IxTreeHarness, options);
  }
}
