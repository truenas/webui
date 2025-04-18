import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate, HarnessQuery,
} from '@angular/cdk/testing';
import { DetailsItemHarness } from 'app/modules/details-table/details-item/details-item.harness';

export class DetailsTableHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-details-table';

  static with(options: BaseHarnessFilters): HarnessPredicate<DetailsTableHarness> {
    return new HarnessPredicate(DetailsTableHarness, options);
  }

  getItems = this.locatorForAll(DetailsItemHarness);

  async getItemByLabel(label: string): Promise<DetailsItemHarness> {
    return this.locatorFor(DetailsItemHarness.with({ label }))();
  }

  async getValues(): Promise<Record<string, string>> {
    const items = await this.getItems();
    const values: Record<string, string> = {};

    for (const item of items) {
      const label = await item.getLabelText();
      const value = await item.getValueText();
      values[label] = value;
    }

    return values;
  }

  async getHarnessForItem<T extends ComponentHarness>(label: string, harness: HarnessQuery<T>): Promise<T> {
    const item = await this.getItemByLabel(label);
    return item.getHarness(harness);
  }
}
