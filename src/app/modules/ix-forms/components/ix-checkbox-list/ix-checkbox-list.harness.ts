import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate,
} from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from '../../utils/harness.utils';

export interface IxCheckboxListHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxCheckboxListHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-checkbox-list';

  static with(options: IxCheckboxListHarnessFilters): HarnessPredicate<IxCheckboxListHarness> {
    return new HarnessPredicate(IxCheckboxListHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getCheckboxes = this.locatorForAll(MatCheckboxHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string[]> {
    const checkboxes = await this.getCheckboxes();
    const checkedValues: string[] = [];
    for (const checkbox of checkboxes) {
      if (!await checkbox.isChecked()) {
        continue;
      }

      checkedValues.push(await checkbox.getLabelText());
    }

    return checkedValues;
  }

  async setValue(value: string[]): Promise<void> {
    const checkboxes = await this.getCheckboxes();
    for (const checkbox of checkboxes) {
      const checkboxLabel = await checkbox.getLabelText();
      if (value.includes(checkboxLabel)) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getCheckboxes())[0].isDisabled();
  }
}
