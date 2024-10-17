import {
  BaseHarnessFilters, ComponentHarness, HarnessPredicate, parallel,
} from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxCheckboxListHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxCheckboxListHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-checkbox-list';

  static with(options: IxCheckboxListHarnessFilters): HarnessPredicate<IxCheckboxListHarness> {
    return new HarnessPredicate(IxCheckboxListHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getCheckboxes = this.locatorForAll(MatCheckboxHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
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
    const checkboxes = await this.getCheckboxes();
    const inputState = await parallel(() => checkboxes.map((control) => control.isDisabled()));

    return inputState.every(Boolean);
  }
}
