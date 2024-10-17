import { HarnessPredicate } from '@angular/cdk/testing';
import { IconHarnessFilters, MatIconHarness } from '@angular/material/icon/testing';

export class IxIconHarness extends MatIconHarness {
  static override readonly hostSelector = '.ix-icon';
  /**
   * Gets a `HarnessPredicate` that can be used to search for a tree with specific attributes.
   * @param options Options for narrowing the search
   * @return a `HarnessPredicate` configured with the given options.
   */
  static override with(options: IconHarnessFilters = {}): HarnessPredicate<IxIconHarness> {
    return new HarnessPredicate(IxIconHarness, options)
      .addOption('type', options.type, async (harness, type) => (await harness.getType()) === type)
      .addOption('name', options.name, (harness, text) => HarnessPredicate.stringMatches(harness.getName(), text))
      .addOption('namespace', options.namespace, (harness, text) => HarnessPredicate.stringMatches(harness.getNamespace(), text));
  }

  async click(): Promise<void> {
    return (await this.host()).click();
  }
}
