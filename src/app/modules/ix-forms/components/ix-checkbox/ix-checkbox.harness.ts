import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxCheckboxHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxCheckboxHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-checkbox';

  static with(options: IxCheckboxHarnessFilters): HarnessPredicate<IxCheckboxHarness> {
    return new HarnessPredicate(IxCheckboxHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatCheckboxHarness = this.locatorFor(MatCheckboxHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<boolean> {
    return (await this.getMatCheckboxHarness()).isChecked();
  }

  async setValue(value: boolean): Promise<void> {
    const matCheckboxHarness = await this.getMatCheckboxHarness();
    if (value) {
      return matCheckboxHarness.check();
    }

    return matCheckboxHarness.uncheck();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatCheckboxHarness()).isDisabled();
  }
}
