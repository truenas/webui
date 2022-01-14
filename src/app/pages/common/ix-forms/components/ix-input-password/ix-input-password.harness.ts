import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxFormControlHarness } from 'app/pages/common/ix-forms/interfaces/ix-form-control-harness.interface';

export interface IxInputHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxInputPasswordHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-input-password';

  static with(options: IxInputHarnessFilters): HarnessPredicate<IxInputPasswordHarness> {
    return new HarnessPredicate(IxInputPasswordHarness, options)
      .addOption('label', options.label,
        (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);

  async getLabelText(): Promise<string> {
    const label = await this.locatorFor('label')();
    return label.text({ exclude: '.required' });
  }

  async getErrorText(): Promise<string> {
    const label = await this.locatorForOptional('ix-errors')();
    return label?.text() || '';
  }

  async getValue(): Promise<string> {
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string): Promise<void> {
    const harness = (await this.getMatInputHarness());
    return harness.setValue(value);
  }
}
