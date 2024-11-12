import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { IxLabelHarness } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.harness';
import { IxFormControlHarness } from 'app/modules/forms/ix-forms/interfaces/ix-form-control-harness.interface';
import { getErrorText } from 'app/modules/forms/ix-forms/utils/harness.utils';

export interface IxInputHarnessFilters extends BaseHarnessFilters {
  label?: string;
}

export class IxInputHarness extends ComponentHarness implements IxFormControlHarness {
  static readonly hostSelector = 'ix-input';

  static with(options: IxInputHarnessFilters): HarnessPredicate<IxInputHarness> {
    return new HarnessPredicate(IxInputHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabelText(), label));
  }

  getMatInputHarness = this.locatorFor(MatInputHarness);
  getErrorText = getErrorText;

  async getLabelText(): Promise<string> {
    const label = await this.locatorForOptional(IxLabelHarness)();
    if (!label) {
      return '';
    }
    return label.getLabel();
  }

  async getValue(): Promise<string> {
    return (await this.getMatInputHarness()).getValue();
  }

  async setValue(value: string | number): Promise<void> {
    const harness = await this.getMatInputHarness();

    // MatInputHarness does not properly work with numeric values
    // (for example for <input type="number">).
    // https://github.com/angular/components/issues/23894
    if (typeof value === 'number') {
      return this.setValueAndTriggerBlur(value);
    }

    return harness.setValue(value);
  }

  async setValueAndTriggerBlur(value: string | number): Promise<void> {
    const harness = await this.getMatInputHarness();

    const nativeInput = await harness.host();
    await nativeInput.setInputValue(value as unknown as string);
    await nativeInput.dispatchEvent('input');
    return nativeInput.blur();
  }

  async isDisabled(): Promise<boolean> {
    return (await this.getMatInputHarness()).isDisabled();
  }

  async isReadonly(): Promise<boolean> {
    return (await this.getMatInputHarness()).isReadonly();
  }
}
