import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate, HarnessQuery,
} from '@angular/cdk/testing';
import { DetailsItemHarness } from 'app/modules/details-table/details-item/details-item.harness';
import { EditableHarness } from 'app/modules/forms/editable/editable.harness';

export class DetailsTableHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-details-table';

  static with(options: BaseHarnessFilters): HarnessPredicate<DetailsTableHarness> {
    return new HarnessPredicate(DetailsTableHarness, options);
  }

  getItems = this.locatorForAll(DetailsItemHarness);

  async getItemByLabel(label: string): Promise<DetailsItemHarness> {
    const item = await this.locatorForOptional(DetailsItemHarness.with({ label }))();

    if (!item) {
      throw new Error(`Could not find details item with label: ${label}.`);
    }

    return item;
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

  /**
   * Attempts to sequentially fill in values based on the labels.
   * Only supports ix-editable components with one control in them.
   */
  async setValues(values: Record<string, unknown>): Promise<void> {
    const labels = Object.keys(values);
    for (const label of labels) {
      const editable = await this.getHarnessForItemOrNull(label, EditableHarness);
      if (!editable) {
        throw new Error(`Could not editable harness for detail item with label: ${label}.`);
      }

      await editable.setFirstControlValue(values[label]);
    }
  }

  async getHarnessForItem<T extends ComponentHarness>(label: string, harness: HarnessQuery<T>): Promise<T> {
    const item = await this.getItemByLabel(label);
    return item.getHarness(harness);
  }

  async getHarnessForItemOrNull<T extends ComponentHarness>(
    label: string,
    harness: HarnessQuery<T>,
  ): Promise<T | null> {
    const item = await this.getItemByLabel(label);

    return item.getHarnessOrNull(harness);
  }
}
