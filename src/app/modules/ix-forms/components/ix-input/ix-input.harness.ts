import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxFormControlHarness } from 'app/modules/ix-forms/interfaces/ix-form-control-harness.interface';

export interface IxInputHarnessFilters extends BaseHarnessFilters {
  label: string;
}

export class IxInputHarness extends ComponentHarness implements IxFormControlHarness {
  static hostSelector = 'ix-input';

  static with(options: IxInputHarnessFilters): HarnessPredicate<IxInputHarness> {
    return new HarnessPredicate(IxInputHarness, options)
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

  async setValue(value: string | number): Promise<void> {
    const harness = (await this.getMatInputHarness());

    // MatInputHarness does not properly work with numeric values
    // (for example for <input type="number">).
    // https://github.com/angular/components/issues/23894
    if (typeof value === 'number') {
      const nativeInput = await harness.host();
      await nativeInput.setInputValue(value as unknown as string);
      await nativeInput.dispatchEvent('input');
      return nativeInput.blur();
    }

    return harness.setValue(value);
  }
}
