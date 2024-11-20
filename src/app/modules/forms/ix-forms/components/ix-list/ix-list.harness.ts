import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxListItemHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.harness';
import {
  IxFormBasicValueType,
} from 'app/modules/forms/ix-forms/testing/control-harnesses.helpers';

export interface IxListHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxListHarness extends ComponentHarness {
  static readonly hostSelector = 'ix-list';

  getListItems = this.locatorForAll(IxListItemHarness);

  static with(options: IxListHarnessFilters): HarnessPredicate<IxListHarness> {
    return new HarnessPredicate(IxListHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async pressAddButton(): Promise<void> {
    const button = await this.locatorFor(MatButtonHarness.with({ text: 'Add' }))();
    await button.click();
  }

  async getLastListItem(): Promise<IxListItemHarness> {
    const listItems = await this.getListItems();
    return listItems[listItems.length - 1];
  }

  async getFormValues(): Promise<Record<string, IxFormBasicValueType>[]> {
    const listItems = await this.getListItems();
    const values: Record<string, IxFormBasicValueType>[] = [];
    for (const listItem of listItems) {
      const formValues = await listItem.getFormValues();
      values.push(formValues);
    }

    return values;
  }
}
