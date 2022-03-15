import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/ix-forms/utils/harness.utils';

export interface IxPermissionsHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxPermissionsHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-permissions';

  static with(options: IxPermissionsHarnessFilters): HarnessPredicate<IxPermissionsHarness> {
    return new HarnessPredicate(IxPermissionsHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getValue(): Promise<string> {
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    return (await this.getMatInputHarness()).setValue(value);
  }
}
